import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import OpenAI from 'openai';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { prisma } from './lib/prisma';
import { CreateFeedbackRequest, UpdateFeedbackRequest, FeedbackResponse, ApiResponse } from './types';

dotenv.config();

// Content Moderation Strategy:
// 1. PRIMARY: OpenAI Moderation API (comprehensive, context-aware, multi-language)
// 2. FALLBACK: Local word filter (basic protection when OpenAI is unavailable)

// Basic inappropriate words list - used only as fallback when OpenAI is not available
const inappropriateWords = [
  // Common profanity
  'damn', 'hell', 'shit', 'fuck', 'fucking', 'fucked', 'bitch', 'bastard', 'ass', 'asshole',
  'crap', 'piss', 'cock', 'dick', 'pussy', 'whore', 'slut', 'fag', 'faggot', 'nigger', 'nigga',
  // Variations and leetspeak
  'f*ck', 'f**k', 'sh*t', 'sh**', 'b*tch', 'a**hole', 'wtf', 'stfu', 'gtfo',
  'fu', 'fk', 'fck', 'sht', 'btch', 'azz', 'phuck', 'shyt', 'biatch', 'dumbass',
  // Harassment and harmful content
  'kill yourself', 'kys', 'die', 'stupid', 'idiot', 'moron', 'retard', 'retarded',
  'loser', 'worthless', 'pathetic', 'waste of space', 'go die', 'should die',
  'want to kill', 'will kill', 'gonna kill', 'going to kill', 'i kill', 'murder',
  'threaten', 'threat', 'hurt you', 'harm you', 'beat you up', 'destroy you',
  // Hate speech indicators (basic)
  'hate', 'terrorist', 'nazi', 'hitler'
];

// Function to check for inappropriate content (fallback only)
const checkInappropriateContent = (text: string): { isFlagged: boolean; flaggedReason: string | null } => {
  const lowerText = text.toLowerCase();
  const foundWords: string[] = [];
  
  inappropriateWords.forEach(word => {
    if (lowerText.includes(word.toLowerCase())) {
      foundWords.push(word);
    }
  });
  
  if (foundWords.length > 0) {
    return {
      isFlagged: true,
      flaggedReason: `Local filter detected: ${foundWords.slice(0, 3).join(', ')}${foundWords.length > 3 ? '...' : ''}`
    };
  }
  
  return { isFlagged: false, flaggedReason: null };
};

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

let openai: OpenAI | null = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json({ limit: '1mb' }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX || '100'), // Allow environment override, default 100
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api/feedback', limiter);

const formatFeedbackResponse = (feedback: any, currentUserToken?: string): FeedbackResponse => ({
  id: feedback.id,
  name: feedback.name,
  message: feedback.message,
  isFlagged: feedback.isFlagged,
  flaggedReason: feedback.flaggedReason,
  createdAt: feedback.createdAt.toISOString(),
  canEdit: feedback.userToken && currentUserToken ? feedback.userToken === currentUserToken : false
});

app.post('/api/feedback', async (req, res) => {
  try {
    const { name, message, anonymous, userToken }: CreateFeedbackRequest = req.body;
    const ipAddress = req.ip || (req.connection as any).remoteAddress || 'unknown';

    if (!message?.trim()) {
      return res.status(400).json({ success: false, error: 'Message is required' } as ApiResponse);
    }

    if (!userToken) {
      return res.status(400).json({ success: false, error: 'User token is required' } as ApiResponse);
    }

    const effectiveName = anonymous ? 'Anonymous' : (name || '').trim();

    if (!anonymous) {
      if (!effectiveName) {
        return res.status(400).json({ success: false, error: 'Name is required unless submitting anonymously' } as ApiResponse);
      }
      if (effectiveName.length > 100) {
        return res.status(400).json({ success: false, error: 'Name must be 100 characters or less' } as ApiResponse);
      }
    }

    if (message.length > 1000) {
      return res.status(400).json({ success: false, error: 'Message must be 1000 characters or less' } as ApiResponse);
    }

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentSubmissions = await prisma.feedback.count({
      where: { ipAddress: ipAddress, createdAt: { gte: oneHourAgo } }
    });
    const maxSubmissionsPerHour = parseInt(process.env.MAX_SUBMISSIONS_PER_HOUR || '20');
    if (recentSubmissions >= maxSubmissionsPerHour) {
      return res.status(429).json({ success: false, error: 'Too many submissions from this IP address. Please try again later.' } as ApiResponse);
    }

    if (!anonymous) {
      const existingName = await prisma.feedback.findFirst({
        where: { name: effectiveName, createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) } }
      });
      if (existingName) {
        return res.status(400).json({ success: false, error: 'This name was already used recently. Please choose a different name or submit anonymously.' } as ApiResponse);
      }
    }

    let isFlagged = false;
    let flaggedReason: string | null = null;

    // Primary: Use OpenAI moderation if available (much more comprehensive)
    if (openai) {
      try {
        const moderation = await openai.moderations.create({
          model: 'omni-moderation-latest',
          input: `${effectiveName || 'Anonymous'}: ${message}`
        });
        const result: any = (moderation as any).results?.[0];
        if (result && result.flagged) {
          isFlagged = true;
          const flaggedCategories = Object.entries(result.categories || {})
            .filter(([_, flagged]) => flagged as any)
            .map(([category]) => category);
          flaggedReason = `Content moderation: ${flaggedCategories.join(', ')}`;
        }
      } catch (moderationError) {
        console.warn('OpenAI Moderation API error:', moderationError);
        // Fallback to local check if OpenAI fails
        const localCheck = checkInappropriateContent(`${effectiveName}: ${message}`);
        isFlagged = localCheck.isFlagged;
        flaggedReason = localCheck.flaggedReason;
      }
    } else {
      // Fallback: Use local word filter only if OpenAI is not available
      console.warn('OpenAI API not configured, using local word filter as fallback');
      const localCheck = checkInappropriateContent(`${effectiveName}: ${message}`);
      isFlagged = localCheck.isFlagged;
      flaggedReason = localCheck.flaggedReason;
    }

    const newFeedback = await prisma.feedback.create({
      data: { 
        name: effectiveName || 'Anonymous', 
        message: message.trim(), 
        isFlagged, 
        flaggedReason, 
        ipAddress,
        userToken
      }
    });

    const formattedFeedback = formatFeedbackResponse(newFeedback, userToken);
    io.emit('newFeedback', formattedFeedback);

    res.status(201).json({ success: true, data: formattedFeedback } as ApiResponse<FeedbackResponse>);
  } catch (error) {
    console.error('Error creating feedback:', error);
    res.status(500).json({ success: false, error: 'Internal server error' } as ApiResponse);
  }
});

app.get('/api/feedback', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const skip = (page - 1) * limit;
    const userToken = req.headers['user-token'] as string; // Get user token from header

    const [feedbacks, totalCount] = await Promise.all([
      prisma.feedback.findMany({ orderBy: { createdAt: 'desc' }, take: limit, skip }),
      prisma.feedback.count()
    ]);

    const formattedFeedbacks = feedbacks.map(feedback => formatFeedbackResponse(feedback, userToken));

    res.json({ success: true, data: { feedbacks: formattedFeedbacks, pagination: { page, limit, total: totalCount, totalPages: Math.ceil(totalCount / limit) } } } as ApiResponse);
  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({ success: false, error: 'Internal server error' } as ApiResponse);
  }
});

app.get('/api/feedback/flagged', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const skip = (page - 1) * limit;
    const userToken = req.headers['user-token'] as string; // Get user token from header

    const [feedbacks, totalCount] = await Promise.all([
      prisma.feedback.findMany({ 
        where: { isFlagged: true },
        orderBy: { createdAt: 'desc' }, 
        take: limit, 
        skip 
      }),
      prisma.feedback.count({ where: { isFlagged: true } })
    ]);

    const formattedFeedbacks = feedbacks.map(feedback => formatFeedbackResponse(feedback, userToken));

    res.json({ success: true, data: { feedbacks: formattedFeedbacks, pagination: { page, limit, total: totalCount, totalPages: Math.ceil(totalCount / limit) } } } as ApiResponse);
  } catch (error) {
    console.error('Error fetching flagged feedback:', error);
    res.status(500).json({ success: false, error: 'Internal server error' } as ApiResponse);
  }
});

app.put('/api/feedback/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, message, userToken }: UpdateFeedbackRequest = req.body;

    if (isNaN(id)) {
      return res.status(400).json({ success: false, error: 'Invalid feedback ID' } as ApiResponse);
    }

    if (!userToken) {
      return res.status(400).json({ success: false, error: 'User token is required' } as ApiResponse);
    }

    // Check if feedback exists
    const existingFeedback = await prisma.feedback.findUnique({ where: { id } });
    if (!existingFeedback) {
      return res.status(404).json({ success: false, error: 'Feedback not found' } as ApiResponse);
    }

    // Check ownership
    if ((existingFeedback as any).userToken !== userToken) {
      return res.status(403).json({ success: false, error: 'You can only edit your own feedback' } as ApiResponse);
    }

    // Validate input
    if (message && message.length > 1000) {
      return res.status(400).json({ success: false, error: 'Message must be 1000 characters or less' } as ApiResponse);
    }

    if (name && name.length > 100) {
      return res.status(400).json({ success: false, error: 'Name must be 100 characters or less' } as ApiResponse);
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim() || 'Anonymous';
    if (message !== undefined) updateData.message = message.trim();

    // Re-run moderation if message is being updated
    let moderationUpdate = {};
    if (message) {
      const contentToCheck = `${updateData.name || existingFeedback.name}: ${updateData.message}`;
      
      // Primary: Use OpenAI moderation if available
      if (openai) {
        try {
          const moderation = await openai.moderations.create({
            model: 'omni-moderation-latest',
            input: contentToCheck
          });
          const result: any = (moderation as any).results?.[0];
          if (result && result.flagged) {
            const flaggedCategories = Object.entries(result.categories || {})
              .filter(([_, flagged]) => flagged as any)
              .map(([category]) => category);
            moderationUpdate = {
              isFlagged: true,
              flaggedReason: `Content moderation: ${flaggedCategories.join(', ')}`
            };
          } else {
            moderationUpdate = {
              isFlagged: false,
              flaggedReason: null
            };
          }
        } catch (moderationError) {
          console.warn('OpenAI Moderation API error:', moderationError);
          // Fallback to local check if OpenAI fails
          const localCheck = checkInappropriateContent(contentToCheck);
          moderationUpdate = {
            isFlagged: localCheck.isFlagged,
            flaggedReason: localCheck.flaggedReason
          };
        }
      } else {
        // Fallback: Use local word filter only if OpenAI is not available
        const localCheck = checkInappropriateContent(contentToCheck);
        moderationUpdate = {
          isFlagged: localCheck.isFlagged,
          flaggedReason: localCheck.flaggedReason
        };
      }
    }

    const updatedFeedback = await prisma.feedback.update({
      where: { id },
      data: { ...updateData, ...moderationUpdate }
    });

    const formattedFeedback = formatFeedbackResponse(updatedFeedback, userToken);
    io.emit('updatedFeedback', formattedFeedback);

    res.json({ success: true, data: formattedFeedback } as ApiResponse<FeedbackResponse>);
  } catch (error) {
    console.error('Error updating feedback:', error);
    res.status(500).json({ success: false, error: 'Internal server error' } as ApiResponse);
  }
});

app.delete('/api/feedback/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { userToken } = req.body;

    if (isNaN(id)) {
      return res.status(400).json({ success: false, error: 'Invalid feedback ID' } as ApiResponse);
    }

    if (!userToken) {
      return res.status(400).json({ success: false, error: 'User token is required' } as ApiResponse);
    }

    // Check if feedback exists
    const existingFeedback = await prisma.feedback.findUnique({ where: { id } });
    if (!existingFeedback) {
      return res.status(404).json({ success: false, error: 'Feedback not found' } as ApiResponse);
    }

    // Check ownership
    if ((existingFeedback as any).userToken !== userToken) {
      return res.status(403).json({ success: false, error: 'You can only delete your own feedback' } as ApiResponse);
    }

    await prisma.feedback.delete({ where: { id } });

    io.emit('deletedFeedback', { id });

    res.json({ success: true, data: { id } } as ApiResponse);
  } catch (error) {
    console.error('Error deleting feedback:', error);
    res.status(500).json({ success: false, error: 'Internal server error' } as ApiResponse);
  }
});

app.get('/api/feedback/stats', async (req, res) => {
  try {
    const stats = await prisma.feedback.aggregate({ _count: { _all: true, isFlagged: true } });
    const flaggedCount = await prisma.feedback.count({ where: { isFlagged: true } });

    res.json({ success: true, data: { total: stats._count._all, approved: stats._count._all - flaggedCount, flagged: flaggedCount } } as ApiResponse);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ success: false, error: 'Internal server error' } as ApiResponse);
  }
});

app.get('/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'OK', timestamp: new Date().toISOString(), database: 'connected' });
  } catch (error: any) {
    res.status(500).json({ status: 'ERROR', timestamp: new Date().toISOString(), database: 'disconnected', error: error?.message || 'Unknown error' });
  }
});

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);
  socket.on('getFeedbackCount', async () => {
    try {
      const count = await prisma.feedback.count();
      socket.emit('feedbackCount', count);
    } catch (error) {
      console.error('Error getting feedback count:', error);
    }
  });
  socket.on('disconnect', () => { console.log(`User disconnected: ${socket.id}`); });
});

process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  await prisma.$disconnect();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

const PORT = process.env.PORT || 3001;

async function startServer() {
  try {
    await prisma.$connect();
    console.log('Database connected successfully');
    
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌐 Client URL: ${process.env.CLIENT_URL || 'http://localhost:3000'}`);
      console.log(`📊 Prisma Studio: Run 'npm run db:studio' to open database GUI`);
      
      // Display rate limiting configuration
      console.log(`🚦 Rate Limits:`);
      console.log(`   • ${parseInt(process.env.RATE_LIMIT_MAX || '100')} requests per 15 minutes`);
      console.log(`   • ${parseInt(process.env.MAX_SUBMISSIONS_PER_HOUR || '20')} submissions per hour per IP`);
      
      // Display content moderation status
      if (openai) {
        console.log('🔒 Content Moderation: OpenAI Moderation API (Primary) + Local Filter (Fallback)');
      } else {
        console.log('⚠️  Content Moderation: Local Filter Only (OpenAI API key not configured)');
        console.log('   📝 For better moderation, add OPENAI_API_KEY to your .env file');
        console.log('   🔗 Get API key: https://platform.openai.com/api-keys');
      }
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer(); 