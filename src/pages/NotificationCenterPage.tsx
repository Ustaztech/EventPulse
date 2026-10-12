import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Shield } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { GmailMailingSystem } from '../components/GmailMailingSystem';

export const NotificationCenterPage: React.FC = () => {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-royal/10 text-royal flex items-center justify-center mx-auto">
          <Mail className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-black text-slate-800 dark:text-white">Sign In to Access Mailbox</h2>
        <p className="text-slate-500 text-xs">You must be logged in to inspect your campus mail and notification queue.</p>
        <Link to="/auth/login" className="px-6 py-2.5 rounded-xl bg-royal text-white font-bold text-xs inline-block shadow-md">
          Sign In
        </Link>
      </div>
    );
  }

  const getDashboardPath = () => {
    if (currentUser.role === 'ADMIN') return '/dashboard/admin';
    if (currentUser.role === 'ORGANIZER') return '/dashboard/organizer';
    return '/dashboard/student';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-20">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-navy-light/40">
        <div>
          <div className="flex items-center gap-2">
            <Link 
              to={getDashboardPath()}
              className="inline-flex items-center gap-1 text-xs font-bold text-royal dark:text-turquoise hover:underline"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Dashboard</span>
            </Link>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
            Campus Mailbox & Notification Center
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Gmail-style webmail client for event tickets, organizers' announcements, and durable dispatch queues.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto text-xs font-mono text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>support@eventpulse.com.ng</span>
        </div>
      </div>

      {/* Gmail-Style Mailing System */}
      <GmailMailingSystem initialFolder="inbox" />
    </div>
  );
};
export default NotificationCenterPage;
