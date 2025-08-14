import { Feedback } from '@prisma/client';

export interface FeedbackResponse {
  id: number;
  name: string;
  message: string;
  isFlagged: boolean;
  flaggedReason: string | null;
  createdAt: string;
  canEdit?: boolean; // Whether current user can edit this feedback
}

export interface CreateFeedbackRequest {
  name: string;
  message: string;
  anonymous?: boolean;
  userToken?: string; // Client-generated token for ownership
}

export interface UpdateFeedbackRequest {
  name?: string;
  message?: string;
  userToken?: string; // Client-generated token for ownership verification
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export type { Feedback }; 