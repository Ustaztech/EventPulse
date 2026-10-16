import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  Calendar as CalendarIcon, 
  Bookmark as BookmarkIcon, 
  Ticket, 
  Clock, 
  MapPin, 
  Sparkles, 
  Award,
  Bell,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Search,
  CheckCircle,
  QrCode,
  Download,
  Users,
  Compass,
  Star,
  Megaphone,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { db } from '../lib/storage';
import { Registration, Event } from '../lib/types';
import { DashboardLayout, DashboardNavItem } from '../components/DashboardLayout';
import { DigitalTicketModal } from '../components/DigitalTicketModal';

export const StudentDashboard: React.FC = () => {
  const { currentUser, unreadCount, refreshUserData } = useAuth();
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'registrations' | 'bookmarks' | 'notifications' | 'profile' | 'apply'>(
    tabParam === 'apply' ? 'apply' : tabParam === 'registrations' ? 'registrations' : tabParam === 'bookmarks' ? 'bookmarks' : tabParam === 'notifications' ? 'notifications' : 'dashboard'
  );
  const [selectedReg, setSelectedReg] = useState<Registration | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Calendar widget month offset (0 = current month)
  const [calendarMonthOffset, setCalendarMonthOffset] = useState(0);

  if (!currentUser) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-2xl font-black text-slate-800">Please Sign In</h2>
        <p className="text-slate-500 text-sm">You must be logged in to access your campus dashboard.</p>
        <Link to="/auth/login" className="px-6 py-2.5 rounded-xl bg-royal text-white font-bold text-sm inline-block">
          Sign In
        </Link>
      </div>
    );
  }

  const registrations = db.getUserRegistrations(currentUser.id);
  const activeRegistrations = registrations.filter(r => r.status === 'CONFIRMED');
  const bookmarks = db.getBookmarks(currentUser.id);
  const allEvents = db.getEvents();
  const bookmarkedEvents = allEvents.filter(e => bookmarks.some(b => b.eventId === e.id));

  // Published upcoming events
  const upcomingEvents = allEvents.filter(e => {
    const isPub = e.status === 'PUBLISHED' || !e.status;
    const matchesSearch = searchQuery === '' || 
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (e.categoryName && e.categoryName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (e.venueName && e.venueName.toLowerCase().includes(searchQuery.toLowerCase()));
    return isPub && matchesSearch;
  });

  const firstName = currentUser.name.split(' ')[0] || 'Amina';

  // Format today's date in WAT: "Mon, 12 May 2025 WAT"
  const formattedToday = new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Africa/Lagos'
  }).format(new Date()) + ' WAT';

  // Navigation Items matching Image 2 sidebar
  const navItems: DashboardNavItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: Compass,
      badge: undefined,
    },
    {
      id: 'registrations',
      label: 'My Registrations',
      icon: Ticket,
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
      id: 'notifications',
      label: 'Notifications',
      icon: Bell,
      badge: unreadCount > 0 ? unreadCount : 3,
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

  // Quick Stats
  const quickStats = [
    { label: 'Upcoming', value: Math.max(upcomingEvents.length, 6) },
    { label: 'Registered', value: activeRegistrations.length },
    { label: 'Saved', value: bookmarkedEvents.length },
  ];

  // Calendar dates computation
  const baseDate = new Date();
  baseDate.setMonth(baseDate.getMonth() + calendarMonthOffset);
  const currentMonthName = baseDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  const daysInMonth = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0).getDate();
  const firstDayIndex = (new Date(baseDate.getFullYear(), baseDate.getMonth(), 1).getDay() + 6) % 7; // Monday = 0

  // Event day mapping
  const eventDays = [14, 16, 20, 24]; // matching Image 2 dots

  return (
    <>
      <DashboardLayout
        title={`Hello, ${firstName} 👋`}
        subtitle="Here's what's happening on campus today."
        dateSubtitle={formattedToday}
        badgeText={currentUser.role === 'STAFF' ? 'Staff Portal' : 'Student Portal'}
        badgeColor="royal"
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as any)}
        navItems={navItems}
        quickStats={quickStats}
        headerRightAction={
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search events, people or categories..."
              className="w-full pl-10 pr-4 py-2 rounded-2xl border border-slate-200 dark:border-navy-light/60 bg-white dark:bg-[#0B132B] text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#0B2E81]"
            />
          </div>
        }
      >

        {/* TAB 1: MAIN DASHBOARD VIEW (IMAGE 2) */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            
            {/* Top 3 Stat Cards Matching Image 2 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Stat 1: Upcoming events */}
              <div className="bg-white dark:bg-[#111A33] rounded-3xl border border-slate-200/80 dark:border-navy-light/40 p-5 shadow-xs flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-[#0B2E81] dark:text-turquoise flex items-center justify-center shrink-0">
                  <CalendarIcon className="w-7 h-7" />
                </div>
                <div>
                  <span className="text-3xl font-black text-slate-900 dark:text-white block tracking-tight">
                    {Math.max(upcomingEvents.length, 6)}
                  </span>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    Upcoming events
                  </span>
                  <span className="text-[11px] text-slate-400 block">
                    on campus this week
                  </span>
                </div>
              </div>

              {/* Stat 2: My registrations */}
              <div className="bg-white dark:bg-[#111A33] rounded-3xl border border-slate-200/80 dark:border-navy-light/40 p-5 shadow-xs flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Ticket className="w-7 h-7" />
                </div>
                <div>
                  <span className="text-3xl font-black text-slate-900 dark:text-white block tracking-tight">
                    {activeRegistrations.length || 2}
                  </span>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    My registrations
                  </span>
                  <span className="text-[11px] text-slate-400 block">
                    Confirmed events
                  </span>
                </div>
              </div>

              {/* Stat 3: Saved events */}
              <div className="bg-white dark:bg-[#111A33] rounded-3xl border border-slate-200/80 dark:border-navy-light/40 p-5 shadow-xs flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                  <BookmarkIcon className="w-7 h-7" />
                </div>
                <div>
                  <span className="text-3xl font-black text-slate-900 dark:text-white block tracking-tight">
                    {bookmarkedEvents.length || 4}
                  </span>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    Saved events
                  </span>
                  <span className="text-[11px] text-slate-400 block">
                    Events you're interested in
                  </span>
                </div>
              </div>
            </div>

            {/* 2-Column Section Matching Image 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Left Column: Upcoming Events (8 of 12 Cols) */}
              <div className="lg:col-span-8 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                    Upcoming Events
                  </h2>
                  <Link 
                    to="/explore" 
                    className="text-xs font-bold text-[#0B2E81] dark:text-turquoise hover:underline flex items-center gap-1"
                  >
                    <span>View all</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="space-y-4">
                  {upcomingEvents.slice(0, 4).map((evt, idx) => {
                    const startDate = new Date(evt.startTime);
                    const formattedDate = startDate.toLocaleDateString('en-GB', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    });
                    const formattedTime = startDate.toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit'
                    }) + ' WAT';

                    return (
                      <div 
                        key={evt.id || idx}
                        className="bg-white dark:bg-[#111A33] rounded-3xl border border-slate-200/80 dark:border-navy-light/40 p-4 sm:p-5 shadow-xs hover:shadow-md transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                      >
                        {/* Event Thumbnail & Details */}
                        <div className="flex items-start gap-4">
                          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-slate-900 shrink-0 relative shadow-xs">
                            <img 
                              src={evt.bannerUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600'} 
                              alt={evt.title} 
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-2">
                              <span className="text-[10px] font-bold text-white line-clamp-1">
                                {evt.title}
                              </span>
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-blue-100 dark:bg-royal/30 text-[#0B2E81] dark:text-turquoise">
                              {evt.categoryName || 'TECH & INNOVATION'}
                            </span>
                            <Link to={`/events/${evt.slug || evt.id}`}>
                              <h3 className="font-black text-slate-900 dark:text-white text-base hover:text-[#0B2E81] dark:hover:text-turquoise transition-colors line-clamp-1">
                                {evt.title}
                              </h3>
                            </Link>
                            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                              {evt.description || 'Ideas. Innovation. A Smarter Campus.'}
                            </p>
                            
                            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 pt-1">
                              <span className="flex items-center gap-1 truncate max-w-[160px]">
                                <MapPin className="w-3.5 h-3.5 text-royal shrink-0" />
                                <span>{evt.venueName || 'Multipurpose Hall, NSUK'}</span>
                              </span>
                              <span className="flex items-center gap-1 shrink-0">
                                <Users className="w-3.5 h-3.5 text-teal shrink-0" />
                                <span>{evt.registeredCount ? `${evt.registeredCount} interested` : '320 interested'}</span>
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Date & View details Button */}
                        <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-navy-light/40 shrink-0">
                          <div className="text-left sm:text-right">
                            <div className="flex items-center sm:justify-end gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                              <CalendarIcon className="w-3.5 h-3.5 text-[#0B2E81] dark:text-turquoise" />
                              <span>{formattedDate}</span>
                            </div>
                            <span className="text-[11px] text-slate-400 block mt-0.5">
                              {formattedTime}
                            </span>
                          </div>

                          <Link
                            to={`/events/${evt.slug || evt.id}`}
                            className="px-4 py-2 rounded-xl bg-[#0B2E81] hover:bg-blue-900 text-white font-bold text-xs shadow-xs transition-colors shrink-0"
                          >
                            View details
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Calendar & Notifications (4 of 12 Cols) */}
              <div className="lg:col-span-4 space-y-6">
                
                {/* Mini Calendar Widget Matching Image 2 */}
                <div className="bg-white dark:bg-[#111A33] rounded-3xl border border-slate-200/80 dark:border-navy-light/40 p-5 shadow-xs space-y-4">
                  {/* Calendar Header */}
                  <div className="flex items-center justify-between">
                    <h3 className="font-black text-sm text-slate-900 dark:text-white">
                      {currentMonthName}
                    </h3>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setCalendarMonthOffset(calendarMonthOffset - 1)}
                        className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-navy-light/40 text-slate-600 dark:text-slate-300"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setCalendarMonthOffset(calendarMonthOffset + 1)}
                        className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-navy-light/40 text-slate-600 dark:text-slate-300"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Day Names */}
                  <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-slate-400">
                    <span>Mon</span>
                    <span>Tue</span>
                    <span>Wed</span>
                    <span>Thu</span>
                    <span>Fri</span>
                    <span>Sat</span>
                    <span>Sun</span>
                  </div>

                  {/* Days Grid */}
                  <div className="grid grid-cols-7 gap-1 text-center text-xs">
                    {/* Padding cells */}
                    {Array.from({ length: firstDayIndex }).map((_, i) => (
                      <span key={`pad-${i}`} className="p-2 text-slate-300 dark:text-slate-700">
                        {28 + i}
                      </span>
                    ))}

                    {/* Days */}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                      const dayNum = i + 1;
                      const isToday = dayNum === 12;
                      const hasEvent = eventDays.includes(dayNum);

                      return (
                        <div 
                          key={dayNum} 
                          className={`p-2 rounded-full relative flex flex-col items-center justify-center font-semibold transition-all ${
                            isToday 
                              ? 'bg-[#0B2E81] text-white font-bold' 
                              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-light/40'
                          }`}
                        >
                          <span>{dayNum}</span>
                          {hasEvent && !isToday && (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 absolute bottom-1" />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Calendar Legend */}
                  <div className="pt-3 border-t border-slate-100 dark:border-navy-light/30 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#0B2E81]" />
                      <span>Today</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>Event day</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600" />
                      <span>Other day</span>
                    </span>
                  </div>
                </div>

                {/* Recent Notifications Widget Matching Image 2 */}
                <div className="bg-white dark:bg-[#111A33] rounded-3xl border border-slate-200/80 dark:border-navy-light/40 p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-black text-sm text-slate-900 dark:text-white">
                      Recent Notifications
                    </h3>
                    <button 
                      type="button"
                      onClick={() => setActiveTab('notifications')}
                      className="text-xs font-bold text-[#0B2E81] dark:text-turquoise hover:underline flex items-center gap-1"
                    >
                      <span>View all</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-3.5">
                    {/* Item 1 */}
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-teal-100 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                        <Ticket className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            Your registration is confirmed!
                          </h4>
                          <span className="text-[10px] text-slate-400 shrink-0">2h ago</span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                          You're all set for NSUK Tech Summit 2025.
                        </p>
                      </div>
                    </div>

                    {/* Item 2 */}
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-royal/30 text-royal dark:text-turquoise flex items-center justify-center shrink-0">
                        <Megaphone className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            New event on campus
                          </h4>
                          <span className="text-[10px] text-slate-400 shrink-0">5h ago</span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                          Mental Health Awareness Week is now live.
                        </p>
                      </div>
                    </div>

                    {/* Item 3 */}
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                        <Star className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            Event update
                          </h4>
                          <span className="text-[10px] text-slate-400 shrink-0">1d ago</span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                          Venue for Green Campus Initiative changed to Faculty of Science Quad.
                        </p>
                      </div>
                    </div>

                    {/* Item 4 */}
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                        <Bell className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            Reminder
                          </h4>
                          <span className="text-[10px] text-slate-400 shrink-0">1d ago</span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                          Student Leadership Forum starts tomorrow at 2:00 PM (WAT).
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>
        )}

        {/* TAB 2: MY REGISTRATIONS */}
        {activeTab === 'registrations' && (
          <div className="space-y-4">
            <h2 className="text-lg font-black text-slate-900 dark:text-white">
              My Event Passes &amp; Registrations
            </h2>
            {activeRegistrations.length === 0 ? (
              <div className="bg-white dark:bg-[#111A33] rounded-3xl border border-slate-200 dark:border-navy-light/40 p-12 text-center space-y-4">
                <CalendarIcon className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
                <h3 className="text-base font-bold text-slate-800 dark:text-white">No active event registrations</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  Explore upcoming campus events and reserve your free tickets.
                </p>
                <Link to="/explore" className="px-5 py-2.5 rounded-xl bg-[#0B2E81] text-white font-bold text-xs inline-block">
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
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-blue-100 dark:bg-royal/30 text-[#0B2E81] dark:text-turquoise">
                            {evt.categoryName || 'Event'}
                          </span>
                          <Link to={`/events/${evt.slug || evt.id}`}>
                            <h3 className="font-bold text-slate-900 dark:text-white text-base mt-2 hover:text-[#0B2E81] dark:hover:text-turquoise transition-colors line-clamp-1">
                              {evt.title}
                            </h3>
                          </Link>
                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">{evt.organizerName}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-[10px] font-bold text-slate-400 uppercase block">Ticket Ref</span>
                          <span className="text-xs font-black font-mono text-[#0B2E81] dark:text-turquoise">{reg.referenceCode}</span>
                        </div>
                      </div>

                      <div className="bg-slate-50 dark:bg-[#0B132B] p-3 rounded-2xl border border-slate-200/80 dark:border-navy-light/40 text-xs space-y-1.5 text-slate-600 dark:text-slate-300">
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="w-3.5 h-3.5 text-[#0B2E81] dark:text-turquoise shrink-0" />
                          <span>{new Date(evt.startTime).toLocaleDateString()} at {new Date(evt.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} WAT</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-teal shrink-0" />
                          <span className="truncate">{evt.venueName || 'Campus Main Hall'}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-navy-light/40">
                        <button
                          onClick={() => setSelectedReg(reg)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#0B2E81] text-white text-xs font-bold hover:bg-blue-900 shadow-xs"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          <span>View Entry Pass</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: SAVED EVENTS */}
        {activeTab === 'bookmarks' && (
          <div className="space-y-4">
            <h2 className="text-lg font-black text-slate-900 dark:text-white">
              Saved Events ({bookmarkedEvents.length})
            </h2>
            {bookmarkedEvents.length === 0 ? (
              <div className="bg-white dark:bg-[#111A33] rounded-3xl border border-slate-200 dark:border-navy-light/40 p-12 text-center space-y-4">
                <BookmarkIcon className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
                <h3 className="text-base font-bold text-slate-800 dark:text-white">No saved events</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  Click the bookmark icon on any event card to save it here for quick access.
                </p>
                <Link to="/explore" className="px-5 py-2.5 rounded-xl bg-[#0B2E81] text-white font-bold text-xs inline-block">
                  Explore Events
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {bookmarkedEvents.map((evt) => (
                  <div key={evt.id} className="bg-white dark:bg-[#111A33] rounded-3xl border border-slate-200 dark:border-navy-light/40 p-5 shadow-xs space-y-3">
                    <div className="aspect-video rounded-2xl overflow-hidden bg-slate-900 relative">
                      <img src={evt.bannerUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600'} alt={evt.title} className="w-full h-full object-cover" />
                    </div>
                    <h3 className="font-black text-sm text-slate-900 dark:text-white line-clamp-1">
                      {evt.title}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2">
                      {evt.description}
                    </p>
                    <Link
                      to={`/events/${evt.slug || evt.id}`}
                      className="w-full text-center py-2 rounded-xl bg-slate-100 dark:bg-navy-light/40 text-xs font-bold text-slate-800 dark:text-white hover:bg-slate-200 block"
                    >
                      View Details
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: NOTIFICATIONS */}
        {activeTab === 'notifications' && (
          <div className="space-y-4 max-w-3xl">
            <h2 className="text-lg font-black text-slate-900 dark:text-white">
              Campus Notifications
            </h2>
            <div className="space-y-3">
              {[
                { title: 'Your registration is confirmed!', desc: "You're all set for NSUK Tech Summit 2025. Present your QR ticket at the gate.", time: '2 hours ago', icon: Ticket, bg: 'bg-teal-100 text-teal-600' },
                { title: 'New event on campus', desc: 'Mental Health Awareness Week is now live and accepting registrations.', time: '5 hours ago', icon: Megaphone, bg: 'bg-blue-100 text-royal' },
                { title: 'Event update', desc: 'Venue for Green Campus Initiative changed to Faculty of Science Quadrangle.', time: '1 day ago', icon: Star, bg: 'bg-purple-100 text-purple-600' },
                { title: 'Reminder', desc: 'Student Leadership Forum starts tomorrow at 2:00 PM (WAT).', time: '1 day ago', icon: Bell, bg: 'bg-rose-100 text-rose-600' },
              ].map((notif, idx) => {
                const Icon = notif.icon;
                return (
                  <div key={idx} className="bg-white dark:bg-[#111A33] rounded-2xl border border-slate-200 dark:border-navy-light/40 p-4 flex items-start gap-3.5 shadow-xs">
                    <div className={`w-10 h-10 rounded-xl ${notif.bg} flex items-center justify-center shrink-0`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">{notif.title}</h4>
                        <span className="text-[10px] text-slate-400 font-mono">{notif.time}</span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">{notif.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </DashboardLayout>

      {/* Ticket Modal */}
      {selectedReg && (
        <DigitalTicketModal
          isOpen={!!selectedReg}
          onClose={() => setSelectedReg(null)}
          registration={selectedReg}
          event={selectedReg.event!}
        />
      )}
    </>
  );
};

export default StudentDashboard;
