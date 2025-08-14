import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import OpenAI from 'openai';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
const Pusher = require('pusher');
import { prisma } from './lib/prisma';
import { CreateFeedbackRequest, UpdateFeedbackRequest, FeedbackResponse, ApiResponse } from './types';

dotenv.config();const app = express();
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

// Initialize Pusher
let pusher: any | null = null;
if (process.env.PUSHER_APP_ID && process.env.PUSHER_KEY && process.env.PUSHER_SECRET && process.env.PUSHER_CLUSTER) {
  pusher = new Pusher({
    appId: process.env.PUSHER_APP_ID,
    key: process.env.PUSHER_KEY,
    secret: process.env.PUSHER_SECRET,
    cluster: process.env.PUSHER_CLUSTER,
    useTLS: true
  });
}

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json({ limit: '1mb' }));

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

    // Check if this user has already submitted feedback (one submission per user)
    const existingSubmission = await prisma.feedback.findFirst({
      where: { 
        userToken: userToken as string
      } as any
    });
    
    if (existingSubmission) {
      return res.status(400).json({ 
        success: false, 
        error: 'You have already submitted feedback. Only one submission per user is allowed.' 
      } as ApiResponse);
    }

    let isFlagged = false;
    let flaggedReason: string | null = null;

    // Use OpenAI moderation
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
      } catch (moderationError: any) {
        console.warn(`OpenAI Moderation API error (${moderationError?.status || 'unknown'}): ${moderationError?.message || 'Unknown error'}`);
        // If OpenAI fails, we'll still allow the submission but log the error
      }
    } else {
      console.warn('OpenAI API not configured - content moderation disabled');
    }

    const newFeedback = await prisma.feedback.create({
      data: { 
        name: effectiveName || 'Anonymous', 
        message: message.trim(), 
        isFlagged, 
        flaggedReason, 
        ipAddress,
        userToken: userToken || null
      } as any
    });

    const formattedFeedback = formatFeedbackResponse(newFeedback, userToken);
    
    // Send real-time update via Pusher
    if (pusher) {
      try {
        await pusher.trigger('feedback-channel', 'new-feedback', formattedFeedback);
      } catch (pusherError) {
        console.warn('Pusher error:', pusherError);
      }
    }
    
    // Keep Socket.IO for local development fallback
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
    const userToken = req.headers['user-token'] as string; 

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
          moderationUpdate = {
            isFlagged: false,
            flaggedReason: null
          };
        }
      } else {
        console.warn('OpenAI API not configured - content moderation disabled');
        moderationUpdate = {
          isFlagged: false,
          flaggedReason: null
        };
      }
    }

    const updatedFeedback = await prisma.feedback.update({
      where: { id },
      data: { ...updateData, ...moderationUpdate }
    });

    const formattedFeedback = formatFeedbackResponse(updatedFeedback, userToken);
    
    // Send real-time update via Pusher
    if (pusher) {
      try {
        await pusher.trigger('feedback-channel', 'updated-feedback', formattedFeedback);
      } catch (pusherError) {
        console.warn('Pusher error:', pusherError);
      }
    }
    
    // Keep Socket.IO for local development fallback
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

    // Send real-time update via Pusher
    if (pusher) {
      try {
        await pusher.trigger('feedback-channel', 'deleted-feedback', { id });
      } catch (pusherError) {
        console.warn('Pusher error:', pusherError);
      }
    }
    
    // Keep Socket.IO for local development fallback
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
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer(); 