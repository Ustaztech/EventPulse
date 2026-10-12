import React, { useState } from 'react';
import { Link } from 'react-router-dom';
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
  Send
} from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { db } from '../lib/storage';
import { Registration, Event } from '../lib/types';
import { DigitalTicketModal } from '../components/DigitalTicketModal';

export const StudentDashboard: React.FC = () => {
  const { currentUser, refreshUserData } = useAuth();
  const [activeTab, setActiveTab] = useState<'registrations' | 'bookmarks' | 'history' | 'apply'>('registrations');
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
      'PRODID:-//NSUK EventPulse//Event Management//EN',
      'BEGIN:VEVENT',
      `UID:${reg.referenceCode}@nsuk.edu.ng`,
      `DTSTAMP:${formatICSDate(new Date().toISOString())}`,
      `DTSTART:${formatICSDate(evt.startTime)}`,
      `DTEND:${formatICSDate(evt.endTime)}`,
      `SUMMARY:${evt.title}`,
      `DESCRIPTION:${evt.description.replace(/\n/g, ' ')} \\n\\nTicket Ref: ${reg.referenceCode}`,
      `LOCATION:${evt.venueName || 'NSUK'} ${evt.campusArea || 'Main Campus'}`,
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-20">
      {/* Profile Overview Banner */}
      <div className="bg-gradient-to-r from-navy via-royal to-teal rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <img
            src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
            alt={currentUser.name}
            className="w-16 h-16 rounded-2xl object-cover ring-4 ring-white/20 shadow-md"
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black">{currentUser.name}</h1>
              <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-turquoise text-navy-dark">
                {currentUser.role}
              </span>
            </div>
            <p className="text-xs text-blue-100 mt-1">
              {currentUser.matricOrStaffId || 'NSUK Academic Community'} &bull; {currentUser.department || 'Faculty of Science'}
            </p>
            <p className="text-[11px] text-blue-200">{currentUser.email}</p>
          </div>
        </div>

        {/* Quick Stats Strip */}
        <div className="flex items-center gap-3">
          <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/20 text-center">
            <span className="text-xl font-black block">{activeRegistrations.length}</span>
            <span className="text-[10px] text-slate-200 uppercase font-semibold">Active Passes</span>
          </div>
          <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/20 text-center">
            <span className="text-xl font-black block">{attendedRegistrations.length}</span>
            <span className="text-[10px] text-slate-200 uppercase font-semibold">Attended</span>
          </div>
          <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/20 text-center">
            <span className="text-xl font-black block">{bookmarkedEvents.length}</span>
            <span className="text-[10px] text-slate-200 uppercase font-semibold">Bookmarks</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-navy-light/40 pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab('registrations')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'registrations'
              ? 'bg-royal text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-light/30'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>My Registrations ({activeRegistrations.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('bookmarks')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'bookmarks'
              ? 'bg-royal text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-light/30'
          }`}
        >
          <BookmarkIcon className="w-4 h-4" />
          <span>Saved Events ({bookmarkedEvents.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'history'
              ? 'bg-royal text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-light/30'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Attendance History ({attendedRegistrations.length})</span>
        </button>

        {currentUser.role !== 'ORGANIZER' && currentUser.role !== 'ADMIN' && (
          <button
            onClick={() => setActiveTab('apply')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'apply'
                ? 'bg-teal text-white shadow-xs'
                : 'text-teal dark:text-turquoise hover:bg-teal-50 dark:hover:bg-teal-950/30'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Apply as Event Organiser</span>
          </button>
        )}
      </div>

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
              <p>Your request has been routed to the NSUK Directorate for review. You will receive an in-app and email alert once approved.</p>
            </div>
          ) : (
            <form onSubmit={handleApplyOrganizer} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200">Organization or Department Name</label>
                <input
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="e.g. Google Developer Student Club NSUK / SUG Directorate"
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

      {/* Digital Ticket Modal */}
      {selectedReg && (
        <DigitalTicketModal
          registration={selectedReg}
          isOpen={!!selectedReg}
          onClose={() => setSelectedReg(null)}
        />
      )}
    </div>
  );
};
export default StudentDashboard;
