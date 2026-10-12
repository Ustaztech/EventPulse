import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Bell, 
  CheckCheck, 
  Calendar, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  Info,
  ArrowRight,
  Filter
} from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { db } from '../lib/storage';
import { InAppNotification, NotificationType } from '../lib/types';

export const NotificationCenterPage: React.FC = () => {
  const { currentUser, refreshUserData } = useAuth();
  const [filterType, setFilterType] = useState<string>('all');

  if (!currentUser) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-2xl font-black text-slate-800">Please Sign In</h2>
        <p className="text-slate-500 text-sm">Sign in to view your notification history.</p>
        <Link to="/auth/login" className="px-6 py-2.5 rounded-xl bg-royal text-white font-bold text-sm inline-block">
          Sign In
        </Link>
      </div>
    );
  }

  const notifications = db.getInAppNotifications(currentUser.id);
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const filteredNotifs = notifications.filter(n => {
    if (filterType === 'all') return true;
    if (filterType === 'unread') return !n.isRead;
    return n.type === filterType;
  });

  const handleMarkAsRead = (id: string) => {
    db.markNotificationAsRead(id);
    refreshUserData();
  };

  const handleMarkAllRead = () => {
    db.markAllNotificationsAsRead(currentUser.id);
    refreshUserData();
  };

  const getIconForType = (type: NotificationType) => {
    switch (type) {
      case 'REGISTRATION_CONFIRMATION':
        return <CheckCircle2 className="w-5 h-5 text-emerald-600" />;
      case 'STARTING_NOW':
        return <Clock className="w-5 h-5 text-turquoise animate-pulse" />;
      case 'REMINDER_24H':
      case 'REMINDER_1H':
        return <Calendar className="w-5 h-5 text-royal" />;
      case 'EVENT_UPDATE':
      case 'EVENT_CANCELLED':
        return <AlertCircle className="w-5 h-5 text-rose-600" />;
      default:
        return <Info className="w-5 h-5 text-teal" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 pb-20">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-50 text-royal rounded-2xl">
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Notification Centre
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Real-time confirmations, upcoming reminders, and immediate campus schedule alerts.
            </p>
          </div>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-royal bg-blue-50 hover:bg-blue-100 transition-colors self-start sm:self-auto"
          >
            <CheckCheck className="w-4 h-4" />
            <span>Mark all as read</span>
          </button>
        )}
      </div>

      {/* Filter Chips */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] mr-1">Filter:</span>
        {[
          { id: 'all', label: 'All Notices' },
          { id: 'unread', label: `Unread (${unreadCount})` },
          { id: 'REGISTRATION_CONFIRMATION', label: 'Confirmations' },
          { id: 'STARTING_NOW', label: 'Starting Now' },
          { id: 'EVENT_UPDATE', label: 'Schedule Changes' },
          { id: 'ANNOUNCEMENT', label: 'Announcements' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterType(tab.id)}
            className={`px-3 py-1.5 rounded-full font-bold transition-all ${
              filterType === tab.id
                ? 'bg-royal text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notification List */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
        {filteredNotifs.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <Bell className="w-12 h-12 text-slate-200 mx-auto" />
            <p className="font-bold text-slate-700">No notifications to display</p>
            <p className="text-xs">You’re all caught up with campus alerts!</p>
          </div>
        ) : (
          filteredNotifs.map((notif) => (
            <div
              key={notif.id}
              className={`p-5 transition-colors flex items-start gap-4 ${
                notif.isRead ? 'bg-white hover:bg-slate-50/70' : 'bg-blue-50/40 hover:bg-blue-50/70'
              }`}
            >
              <div className="p-2.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs shrink-0 mt-0.5">
                {getIconForType(notif.type)}
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-bold text-slate-900 text-sm">{notif.title}</h4>
                  <span className="text-[10px] text-slate-400 font-medium shrink-0">
                    {new Date(notif.createdAt).toLocaleDateString()} &bull; {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{notif.message}</p>

                <div className="pt-2 flex items-center justify-between">
                  {notif.eventId ? (
                    <Link
                      to={`/events/${db.getEventById(notif.eventId)?.slug || ''}`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-royal hover:underline"
                    >
                      <span>View Event Details</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  ) : <span />}

                  {!notif.isRead && (
                    <button
                      onClick={() => handleMarkAsRead(notif.id)}
                      className="text-[11px] font-bold text-slate-400 hover:text-royal"
                    >
                      Mark read
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
export default NotificationCenterPage;
