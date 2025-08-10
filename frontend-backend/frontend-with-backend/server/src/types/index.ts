import { Feedback } from '@prisma/client';

export interface FeedbackResponse {
  id: number;
  name: string;
  message: string;
  isFlagged: boolean;
  flaggedReason: string | null;
  createdAt: string;
}

export interface CreateFeedbackRequest {
  name: string;
  message: string;
  anonymous?: boolean;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export type { Feedback }; 