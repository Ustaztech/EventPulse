import React, { useState } from 'react';
import { Bell, CheckCheck, CalendarDays, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { db } from '../lib/storage';
import { getDefaultDashboardRoute } from '../lib/rbac';

export const NotificationCenterPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [revision, setRevision] = useState(0);
  if (!currentUser) return null;

  const notifications = db.getInAppNotifications(currentUser.id);
  const unreadCount = notifications.filter((notification) => !notification.isRead).length;

  const markAllRead = async () => {
    await db.markAllNotificationsAsRead(currentUser.id);
    setRevision((value) => value + 1);
  };

  const markRead = async (id: string) => {
    await db.markNotificationAsRead(id);
    setRevision((value) => value + 1);
  };

  void revision;

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-5 dark:border-navy-light/40">
        <div>
          <Link to={getDefaultDashboardRoute(currentUser)} className="mb-3 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:underline dark:text-turquoise">
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> Back to dashboard
          </Link>
          <h1 className="flex items-center gap-2 text-2xl font-black text-slate-900 dark:text-white">
            <Bell className="h-6 w-6 text-blue-700 dark:text-turquoise" aria-hidden="true" /> Notifications
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Event updates and reminders for your account.</p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-navy-light/60 dark:text-slate-200 dark:hover:bg-navy-light/20">
            <CheckCheck className="h-4 w-4" aria-hidden="true" /> Mark all as read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 px-6 py-14 text-center dark:border-navy-light/60">
          <Bell className="mx-auto h-8 w-8 text-slate-400" aria-hidden="true" />
          <h2 className="mt-3 font-bold text-slate-800 dark:text-white">You&apos;re all caught up</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">New event updates will appear here.</p>
        </div>
      ) : (
        <ul className="space-y-3" aria-label="Your notifications">
          {notifications.map((notification) => (
            <li key={notification.id} className={`rounded-2xl border p-4 transition-colors ${notification.isRead ? 'border-slate-200 bg-white dark:border-navy-light/50 dark:bg-[#111A33]' : 'border-blue-200 bg-blue-50/70 dark:border-blue-900/70 dark:bg-blue-950/20'}`}>
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-xl bg-white p-2 text-blue-700 dark:bg-[#0B132B] dark:text-turquoise">
                  <CalendarDays className="h-4 w-4" aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="font-bold text-slate-900 dark:text-white">{notification.title}</h2>
                    {!notification.isRead && <span className="rounded-full bg-blue-700 px-2 py-0.5 text-[10px] font-bold text-white">New</span>}
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{notification.message}</p>
                  <time className="mt-2 block text-xs text-slate-500" dateTime={notification.createdAt}>
                    {new Date(notification.createdAt).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' })}
                  </time>
                  {notification.eventId && <Link to={`/events/${db.getEventById(notification.eventId)?.slug || notification.eventId}`} className="mt-2 inline-block text-xs font-semibold text-blue-700 hover:underline dark:text-turquoise">View event</Link>}
                </div>
                {!notification.isRead && <button onClick={() => markRead(notification.id)} className="shrink-0 rounded-lg px-2 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100 dark:text-turquoise dark:hover:bg-blue-950/50" aria-label={`Mark ${notification.title} as read`}>Mark read</button>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
};
export default NotificationCenterPage;
