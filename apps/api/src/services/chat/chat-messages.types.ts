/**
 * Chat Messages - Types and interfaces
 */

import { MessageType } from '@prisma/client';

/** Options for paginating messages */
export interface GetMessagesOptions {
  limit?: number;
  offset?: number;
}

/** Input data for sending a message */
export interface SendMessageData {
  content: string;
  messageType?: MessageType;
}

/** Formatted message response */
export interface FormattedMessage {
  id: string;
  chat_id: string;
  sender_id: string;
  sender: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    profile_images: string[];
  };
  message_type: MessageType;
  content: string | null;
  text_content: string | null;
  is_read: boolean;
  created_at: Date;
}

/** Paginated messages result */
export interface GetMessagesResult {
  messages: FormattedMessage[];
  total: number;
}
