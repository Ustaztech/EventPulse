import React from 'react';
import { EmailBroadcastHub } from './EmailBroadcastHub';

export interface EmailItem {
  id: string;
  senderName: string;
  senderEmail: string;
  recipientEmail: string;
  subject: string;
  preview: string;
  body: string;
  date: string;
  isRead: boolean;
  isStarred: boolean;
  category: 'tickets' | 'announcements' | 'updates' | 'general';
  lifecycleType?: string;
  status?: string;
}

interface GmailMailingSystemProps {
  initialFolder?: string;
}

/**
 * Re-export EmailBroadcastHub as GmailMailingSystem for clean backward compatibility.
 * Provides the Resend email campaign composer and automated notification engine.
 */
export const GmailMailingSystem: React.FC<GmailMailingSystemProps> = () => {
  return <EmailBroadcastHub initialTab="compose" />;
};

export default GmailMailingSystem;
