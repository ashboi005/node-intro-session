import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import OpenAI from 'openai';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { prisma } from './lib/prisma';
import { CreateFeedbackRequest, FeedbackResponse, ApiResponse } from './types';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
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
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api/feedback', limiter);

const formatFeedbackResponse = (feedback: any): FeedbackResponse => ({
  id: feedback.id,
  name: feedback.name,
  message: feedback.message,
  isFlagged: feedback.isFlagged,
  flaggedReason: feedback.flaggedReason,
  createdAt: feedback.createdAt.toISOString()
});

app.post('/api/feedback', async (req, res) => {
  try {
    const { name, message, anonymous }: CreateFeedbackRequest = req.body;
    const ipAddress = req.ip || (req.connection as any).remoteAddress || 'unknown';

    if (!message?.trim()) {
      return res.status(400).json({ success: false, error: 'Message is required' } as ApiResponse);
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
    if (recentSubmissions >= 3) {
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

    if (openai) {
      try {
        const moderation = await openai.moderations.create({
          model: 'omni-moderation-latest',
          input: `${effectiveName || 'Anonymous'}: ${message}`
        });
        const result: any = (moderation as any).results?.[0];
        if (result) {
          isFlagged = !!result.flagged;
          if (isFlagged) {
            const flaggedCategories = Object.entries(result.categories || {})
              .filter(([_, flagged]) => flagged as any)
              .map(([category]) => category);
            flaggedReason = flaggedCategories.join(', ');
          }
        }
      } catch (moderationError) {
        console.warn('OpenAI Moderation API error:', moderationError);
      }
    }

    const newFeedback = await prisma.feedback.create({
      data: { name: effectiveName || 'Anonymous', message: message.trim(), isFlagged, flaggedReason, ipAddress }
    });

    const formattedFeedback = formatFeedbackResponse(newFeedback);
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

    const [feedbacks, totalCount] = await Promise.all([
      prisma.feedback.findMany({ orderBy: { createdAt: 'desc' }, take: limit, skip }),
      prisma.feedback.count()
    ]);

    const formattedFeedbacks = feedbacks.map(formatFeedbackResponse);

    res.json({ success: true, data: { feedbacks: formattedFeedbacks, pagination: { page, limit, total: totalCount, totalPages: Math.ceil(totalCount / limit) } } } as ApiResponse);
  } catch (error) {
    console.error('Error fetching feedback:', error);
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
      console.log(`📊 Prisma Studio: Run 'npm run db:studio' to open database GUI`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer(); 