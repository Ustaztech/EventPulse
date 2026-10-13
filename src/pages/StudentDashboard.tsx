import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  Calendar, 
  Bookmark as BookmarkIcon, 
  CheckCircle, 
  QrCode, 
  Download, 
  XCircle, 
  Clock, 
  MapPin, 
  Building, 
  Sparkles, 
  Award,
  Bell,
  ArrowRight,
  Send,
  Mail
} from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { db } from '../lib/storage';
import { Registration, Event } from '../lib/types';
import { DashboardLayout, DashboardNavItem } from '../components/DashboardLayout';
import { DigitalTicketModal } from '../components/DigitalTicketModal';
import { EmailBroadcastHub } from '../components/EmailBroadcastHub';

export const StudentDashboard: React.FC = () => {
  const { currentUser, unreadCount, refreshUserData } = useAuth();
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<'registrations' | 'bookmarks' | 'history' | 'mail' | 'apply'>(
    tabParam === 'apply' ? 'apply' : tabParam === 'mail' ? 'mail' : tabParam === 'bookmarks' ? 'bookmarks' : tabParam === 'history' ? 'history' : 'registrations'
  );
  const [selectedReg, setSelectedReg] = useState<Registration | null>(null);

  // Application form state
  const [orgName, setOrgName] = useState('');
  const [reason, setReason] = useState('');
  const [appliedSuccess, setAppliedSuccess] = useState(false);

  if (!currentUser) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-2xl font-black text-slate-800">Please Sign In</h2>
        <p className="text-slate-500 text-sm">You must be logged in to access your student/staff dashboard.</p>
        <Link to="/auth/login" className="px-6 py-2.5 rounded-xl bg-royal text-white font-bold text-sm inline-block">
          Sign In
        </Link>
      </div>
    );
  }

  const registrations = db.getUserRegistrations(currentUser.id);
  const activeRegistrations = registrations.filter(r => r.status === 'CONFIRMED');
  const attendedRegistrations = registrations.filter(r => r.status === 'ATTENDED');
  const bookmarks = db.getBookmarks(currentUser.id);
  const allEvents = db.getEvents();
  const bookmarkedEvents = allEvents.filter(e => bookmarks.some(b => b.eventId === e.id));

  const handleCancelRegistration = (regId: string) => {
    if (window.confirm('Are you sure you want to cancel this registration? Your seat will be freed.')) {
      db.cancelRegistration(regId, currentUser);
      refreshUserData();
    }
  };

  const handleApplyOrganizer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim() || !reason.trim()) return;

    db.submitApplication({
      userId: currentUser.id,
      userName: currentUser.name,
      userEmail: currentUser.email,
      organizationName: orgName.trim(),
      department: currentUser.department,
      faculty: currentUser.faculty,
      reason: reason.trim()
    });

    setAppliedSuccess(true);
    setOrgName('');
    setReason('');
  };

  // Helper to generate and download .ics calendar file
  const downloadIcsFile = (evt: Event, reg: Registration) => {
    const formatICSDate = (dateStr: string) => {
      const d = new Date(dateStr);
      return d.toISOString().replace(/-|:|\.\d+/g, '');
    };

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//EventPulse//Event Management//EN',
      'BEGIN:VEVENT',
      `UID:${reg.referenceCode}@eventpulse.com.ng`,
      `DTSTAMP:${formatICSDate(new Date().toISOString())}`,
      `DTSTART:${formatICSDate(evt.startTime)}`,
      `DTEND:${formatICSDate(evt.endTime)}`,
      `SUMMARY:${evt.title}`,
      `DESCRIPTION:${evt.description.replace(/\n/g, ' ')} \\n\\nTicket Ref: ${reg.referenceCode}`,
      `LOCATION:${evt.venueName || 'Campus Main Hall'} ${evt.campusArea || 'Main Campus'}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${evt.slug}-ticket.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const navItems: DashboardNavItem[] = [
    {
      id: 'registrations',
      label: 'My Registrations',
      icon: Calendar,
      badge: activeRegistrations.length,
      badgeVariant: 'royal',
    },
    {
      id: 'bookmarks',
      label: 'Saved Events',
      icon: BookmarkIcon,
      badge: bookmarkedEvents.length,
      badgeVariant: 'teal',
    },
    {
      id: 'history',
      label: 'Attendance Records',
      icon: Award,
      badge: attendedRegistrations.length,
      badgeVariant: 'emerald',
    },
    {
      id: 'mail',
      label: 'Email Notifications',
      icon: Mail,
      badge: unreadCount > 0 ? unreadCount : undefined,
      badgeVariant: 'rose',
    },
    ...(currentUser.role !== 'ORGANIZER' && currentUser.role !== 'ADMIN'
      ? [
          {
            id: 'apply',
            label: 'Apply as Organiser',
            icon: Sparkles,
            badge: 'Portal',
            badgeVariant: 'amber' as const,
          },
        ]
      : []),
  ];

  const quickStats = [
    { label: 'Active', value: activeRegistrations.length },
    { label: 'Attended', value: attendedRegistrations.length },
    { label: 'Saved', value: bookmarkedEvents.length },
  ];

  return (
    <>
      <DashboardLayout
        title={`${currentUser.name.split(' ')[0]}'s Portal`}
        subtitle="Manage your personal event registrations, attendance records, and campus activities."
        badgeText={currentUser.role === 'STAFF' ? 'Staff Portal' : 'Student Portal'}
        badgeColor="royal"
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id)}
        navItems={navItems}
        quickStats={quickStats}
      >

      {/* Tab 1: My Registered Events */}
      {activeTab === 'registrations' && (
        <div className="space-y-4">
          {activeRegistrations.length === 0 ? (
            <div className="bg-white dark:bg-[#111A33] rounded-3xl border border-slate-200 dark:border-navy-light/40 p-12 text-center space-y-4">
              <Calendar className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">No active registrations</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Explore upcoming campus lectures, workshops, and sports championships to secure your seat.
              </p>
              <Link to="/explore" className="px-5 py-2.5 rounded-xl bg-royal text-white font-bold text-xs inline-block">
                Explore Events
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activeRegistrations.map((reg) => {
                const evt = reg.event;
                if (!evt) return null;
                return (
                  <div key={reg.id} className="bg-white dark:bg-[#111A33] rounded-3xl border border-slate-200 dark:border-navy-light/40 p-6 shadow-sm space-y-4 hover:shadow-md transition-all">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-blue-100 dark:bg-royal/30 text-royal dark:text-turquoise">
                          {evt.categoryName || 'Event'}
                        </span>
                        <Link to={`/events/${evt.slug}`}>
                          <h3 className="font-bold text-slate-900 dark:text-white text-base mt-2 hover:text-royal dark:hover:text-turquoise transition-colors line-clamp-1">
                            {evt.title}
                          </h3>
                        </Link>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">{evt.organizerName}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Ticket Ref</span>
                        <span className="text-xs font-black font-mono text-royal dark:text-turquoise">{reg.referenceCode}</span>
                      </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-[#0B132B] p-3 rounded-2xl border border-slate-200/80 dark:border-navy-light/40 text-xs space-y-1.5 text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-royal dark:text-turquoise shrink-0" />
                        <span>{new Date(evt.startTime).toLocaleDateString()} at {new Date(evt.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} WAT</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-teal shrink-0" />
                        <span className="truncate">{evt.venueName || 'Virtual Room'} ({evt.campusArea || 'Main Campus'})</span>
                      </div>
                    </div>

                    {/* Registration Actions */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-navy-light/40">
                      <button
                        onClick={() => setSelectedReg(reg)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-royal text-white text-xs font-bold hover:bg-royal-hover shadow-xs"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>Digital Pass & QR</span>
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => downloadIcsFile(evt, reg)}
                          className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-light/30 border border-slate-200 dark:border-navy-light/50 text-xs font-medium"
                          title="Add to Google / Apple Calendar"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleCancelRegistration(reg.id)}
                          className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:text-rose-700 px-2 py-1"
                        >
                          Cancel Registration
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Saved Bookmarks */}
      {activeTab === 'bookmarks' && (
        <div className="space-y-4">
          {bookmarkedEvents.length === 0 ? (
            <div className="bg-white dark:bg-[#111A33] rounded-3xl border border-slate-200 dark:border-navy-light/40 p-12 text-center space-y-2">
              <BookmarkIcon className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">No saved bookmarks</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Click the bookmark icon on any event card to save it for quick reference.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bookmarkedEvents.map((evt) => (
                <div key={evt.id} className="bg-white dark:bg-[#111A33] rounded-3xl border border-slate-200 dark:border-navy-light/40 p-5 space-y-3 shadow-xs">
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-blue-50 dark:bg-royal/30 text-royal dark:text-turquoise">
                    {evt.categoryName}
                  </span>
                  <Link to={`/events/${evt.slug}`}>
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm hover:text-royal dark:hover:text-turquoise line-clamp-2">
                      {evt.title}
                    </h4>
                  </Link>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{evt.venueName}</p>
                  <div className="pt-2 border-t border-slate-100 dark:border-navy-light/40 flex justify-between items-center text-xs">
                    <span className="font-medium text-slate-400 dark:text-slate-500">{new Date(evt.startTime).toLocaleDateString()}</span>
                    <Link to={`/events/${evt.slug}`} className="font-bold text-royal dark:text-turquoise hover:underline flex items-center gap-1">
                      <span>View</span> <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Attendance History */}
      {activeTab === 'history' && (
        <div className="bg-white dark:bg-[#111A33] rounded-3xl border border-slate-200 dark:border-navy-light/40 p-6 space-y-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Verified Campus Attendance</h3>
          {attendedRegistrations.length === 0 ? (
            <p className="text-xs text-slate-400 dark:text-slate-500 italic">No attendance records yet. Present your QR ticket at check-in.</p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-navy-light/30">
              {attendedRegistrations.map((reg) => (
                <div key={reg.id} className="py-3.5 flex items-center justify-between text-xs">
                  <div>
                    <h5 className="font-bold text-slate-900 dark:text-white text-sm">{reg.event?.title}</h5>
                    <p className="text-slate-500 dark:text-slate-400 text-[11px]">Pass Reference: {reg.referenceCode}</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 font-extrabold px-2.5 py-1 rounded-md text-[11px]">
                      <CheckCircle className="w-3 h-3" /> Verified Present
                    </span>
                    <span className="block text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                      {reg.attendedAt ? new Date(reg.attendedAt).toLocaleTimeString() : ''}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Organiser Application Form */}
      {activeTab === 'apply' && (
        <div className="bg-white dark:bg-[#111A33] rounded-3xl border border-slate-200 dark:border-navy-light/40 p-6 sm:p-8 space-y-6 max-w-2xl">
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Apply for Organiser Privileges</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Accredited academic departments, student societies, and university directorates can request event hosting access.
            </p>
          </div>

          {appliedSuccess ? (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-xs font-semibold space-y-1">
              <div className="flex items-center gap-2 font-bold text-emerald-900 dark:text-emerald-200">
                <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Application Submitted Successfully</span>
              </div>
              <p>Your request has been routed to the EventPulse Committee for review. You will receive an in-app and email alert once approved.</p>
            </div>
          ) : (
            <form onSubmit={handleApplyOrganizer} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200">Organization or Society Name</label>
                <input
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="e.g. Developer Student Club / Campus Society"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-navy-light/60 bg-white dark:bg-[#0B132B] text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-royal/30 font-medium"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200">Purpose & Event Types</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Explain the nature of events you plan to organize and target audience..."
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-navy-light/60 bg-white dark:bg-[#0B132B] text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-royal/30 font-medium"
                  rows={3}
                  required
                />
              </div>

              <button
                type="submit"
                className="px-6 py-3 rounded-xl bg-teal text-white font-bold text-sm hover:bg-teal-600 shadow-md transition-all flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>Submit Application for Approval</span>
              </button>
            </form>
          )}
        </div>
      )}

      {/* Tab 4: Email Notifications (Resend / MailerLite deliveries) */}
      {activeTab === 'mail' && (
        <EmailBroadcastHub initialTab="logs" />
      )}

        {/* Digital Ticket Modal */}
        {selectedReg && (
          <DigitalTicketModal
            registration={selectedReg}
            isOpen={!!selectedReg}
            onClose={() => setSelectedReg(null)}
          />
        )}
      </DashboardLayout>
    </>
  );
};
export default StudentDashboard;
