import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  Calendar as CalendarIcon, 
  Bookmark as BookmarkIcon, 
  Ticket, 
  MapPin, 
  Bell, 
  ChevronRight, 
  Search, 
  Users, 
  Compass, 
  ChevronLeft, 
  Megaphone, 
  Star, 
  User as UserIcon,
  CheckCircle,
  QrCode,
  Download
} from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { db } from '../lib/storage';
import { Registration, Event } from '../lib/types';
import { DashboardLayout, DashboardNavItem } from '../components/DashboardLayout';
import { DigitalTicketModal } from '../components/DigitalTicketModal';

export const StudentDashboard: React.FC = () => {
  const { currentUser, unreadCount } = useAuth();
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'explore' | 'registrations' | 'bookmarks' | 'notifications' | 'profile'>(
    tabParam === 'registrations' ? 'registrations' : tabParam === 'bookmarks' ? 'bookmarks' : tabParam === 'notifications' ? 'notifications' : tabParam === 'profile' ? 'profile' : 'dashboard'
  );
  const [selectedReg, setSelectedReg] = useState<Registration | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [calendarMonthOffset, setCalendarMonthOffset] = useState(0);

  if (!currentUser) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-2xl font-black text-slate-800">Please Sign In</h2>
        <p className="text-slate-500 text-sm">You must be logged in to access your campus dashboard.</p>
        <Link to="/auth/login" className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm inline-block">
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

  const firstName = currentUser.name.split(' ')[0] || 'Amina';

  // Navigation Items exactly matching Image 2 sidebar
  const navItems: DashboardNavItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: Compass,
    },
    {
      id: 'explore',
      label: 'Explore events',
      icon: Search,
    },
    {
      id: 'registrations',
      label: 'My registrations',
      icon: Ticket,
    },
    {
      id: 'bookmarks',
      label: 'Saved events',
      icon: BookmarkIcon,
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: Bell,
      badge: unreadCount > 0 ? unreadCount : 3,
      badgeVariant: 'rose',
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: UserIcon,
    },
  ];

  // Curated events matching Image 2
  const mockImageEvents = [
    {
      id: 'evt-tech-summit-2025',
      slug: 'nsuk-tech-summit-2025',
      title: 'NSUK Tech Summit 2025',
      category: 'TECH & INNOVATION',
      categoryBadgeColor: 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-300',
      description: 'Ideas. Innovation. A Smarter Campus.',
      venue: 'Multipurpose Hall, NSUK',
      attendance: '320 interested',
      date: 'Wed, 14 May 2025',
      time: '10:00 AM – 2:00 PM WAT',
      image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600',
    },
    {
      id: 'evt-green-campus',
      slug: 'green-campus-initiative',
      title: 'Green Campus Initiative',
      category: 'ENVIRONMENT',
      categoryBadgeColor: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300',
      description: 'A cleaner, greener NSUK starts with us.',
      venue: 'Faculty of Science Quadrangle',
      attendance: '198 interested',
      date: 'Fri, 16 May 2025',
      time: '9:00 AM – 12:00 PM WAT',
      image: '/assets/green_campus.jpg',
    },
    {
      id: 'evt-student-leadership',
      slug: 'student-leadership-forum',
      title: 'Student Leadership Forum',
      category: 'ACADEMIC',
      categoryBadgeColor: 'bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-300',
      description: 'Real Conversations. Stronger Leaders.',
      venue: 'University Auditorium',
      attendance: '275 interested',
      date: 'Tue, 20 May 2025',
      time: '2:00 PM – 5:00 PM WAT',
      image: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=600',
    },
  ];

  return (
    <>
      <DashboardLayout
        title={`Hello, ${firstName} 👋`}
        subtitle="Here's what's happening on campus today."
        dateSubtitle="Mon, 12 May 2025 WAT"
        activeTab={activeTab}
        onTabChange={(id) => {
          if (id === 'explore') {
            window.location.href = '/explore';
          } else {
            setActiveTab(id as any);
          }
        }}
        navItems={navItems}
        headerRightAction={
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search events, people or categories..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-navy-light/60 bg-white dark:bg-[#0B132B] text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-sm"
            />
          </div>
        }
      >

        {/* TAB 1: MAIN DASHBOARD VIEW - EXACT MATCH TO IMAGE 2 */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            
            {/* Top 3 Stat Cards Matching Image 2 */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Card 1: Upcoming events */}
              <div className="bg-white dark:bg-[#111A33] rounded-3xl border border-slate-200/80 dark:border-navy-light/40 p-5 shadow-sm flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <CalendarIcon className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-3xl font-black text-slate-900 dark:text-white block tracking-tight">
                    6
                  </span>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    Upcoming events
                  </span>
                  <span className="text-[11px] text-slate-400 block">
                    on campus this week
                  </span>
                </div>
              </div>

              {/* Card 2: My registrations */}
              <div className="bg-white dark:bg-[#111A33] rounded-3xl border border-slate-200/80 dark:border-navy-light/40 p-5 shadow-sm flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                  <Ticket className="w-6 h-6" />
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

              {/* Card 3: Saved events */}
              <div className="bg-white dark:bg-[#111A33] rounded-3xl border border-slate-200/80 dark:border-navy-light/40 p-5 shadow-sm flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                  <BookmarkIcon className="w-6 h-6" />
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
              
              {/* Left Column: Upcoming Events (8 of 12 cols) */}
              <div className="lg:col-span-8 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                    Upcoming Events
                  </h2>
                  <Link 
                    to="/explore" 
                    className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <span>View all</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="space-y-4">
                  {mockImageEvents.map((evt) => (
                    <div 
                      key={evt.id}
                      className="bg-white dark:bg-[#111A33] rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-navy-light/40 p-4 sm:p-5 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                    >
                      {/* Left: Thumbnail and Details */}
                      <div className="flex items-start gap-4 min-w-0 w-full sm:w-auto">
                        <div className="w-24 h-24 sm:w-28 sm:h-24 rounded-2xl overflow-hidden bg-slate-900 shrink-0 relative shadow-sm">
                          <img 
                            src={evt.image} 
                            alt={evt.title} 
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <div className="space-y-1.5 min-w-0 flex-1">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${evt.categoryBadgeColor}`}>
                            {evt.category}
                          </span>
                          <Link to="/explore">
                            <h3 className="font-black text-slate-900 dark:text-white text-sm sm:text-base hover:text-blue-600 transition-colors line-clamp-1">
                              {evt.title}
                            </h3>
                          </Link>
                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                            {evt.description}
                          </p>
                          
                          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 pt-0.5">
                            <span className="flex items-center gap-1 truncate max-w-[170px]">
                              <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                              <span className="truncate">{evt.venue}</span>
                            </span>
                            <span className="flex items-center gap-1 shrink-0">
                              <Users className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                              <span>{evt.attendance}</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Date, Time & View Details Button */}
                      <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-navy-light/40 shrink-0">
                        <div className="text-left sm:text-right">
                          <div className="flex items-center sm:justify-end gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                            <CalendarIcon className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                            <span>{evt.date}</span>
                          </div>
                          <span className="text-[11px] text-slate-400 block mt-0.5">
                            {evt.time}
                          </span>
                        </div>

                        <Link
                          to="/explore"
                          className="px-4 py-2 rounded-xl bg-[#1D4ED8] hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors shrink-0"
                        >
                          View details
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Calendar Widget & Recent Notifications (4 of 12 cols) */}
              <div className="lg:col-span-4 space-y-6">
                
                {/* Calendar Widget matching Image 2 */}
                <div className="bg-white dark:bg-[#111A33] rounded-3xl border border-slate-200/80 dark:border-navy-light/40 p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-black text-sm text-slate-900 dark:text-white">
                      May 2025
                    </h3>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setCalendarMonthOffset(calendarMonthOffset - 1)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-navy-light/40 text-slate-600 dark:text-slate-300"
                        aria-label="Previous month"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setCalendarMonthOffset(calendarMonthOffset + 1)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-navy-light/40 text-slate-600 dark:text-slate-300"
                        aria-label="Next month"
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

                  {/* Calendar Grid matching Image 2 */}
                  <div className="grid grid-cols-7 gap-1 text-center text-xs">
                    {/* Previous Month Pad Days */}
                    <span className="p-2 text-slate-300 dark:text-slate-600">28</span>
                    <span className="p-2 text-slate-300 dark:text-slate-600">29</span>
                    <span className="p-2 text-slate-300 dark:text-slate-600">30</span>
                    <span className="p-2 text-slate-700 dark:text-slate-300">1</span>
                    <span className="p-2 text-slate-700 dark:text-slate-300">2</span>
                    <span className="p-2 text-slate-700 dark:text-slate-300">3</span>
                    <span className="p-2 text-slate-700 dark:text-slate-300">4</span>

                    {/* Week 2 */}
                    <span className="p-2 text-slate-700 dark:text-slate-300">5</span>
                    <span className="p-2 text-slate-700 dark:text-slate-300">6</span>
                    <span className="p-2 text-slate-700 dark:text-slate-300">7</span>
                    <span className="p-2 text-slate-700 dark:text-slate-300">8</span>
                    <span className="p-2 text-slate-700 dark:text-slate-300">9</span>
                    <span className="p-2 text-slate-700 dark:text-slate-300">10</span>
                    <span className="p-2 text-slate-700 dark:text-slate-300">11</span>

                    {/* Week 3: 12 is Today, 14 & 16 are event days */}
                    <div className="p-2 rounded-full bg-[#1D4ED8] text-white font-bold flex items-center justify-center">
                      12
                    </div>
                    <span className="p-2 text-slate-700 dark:text-slate-300">13</span>
                    <div className="p-2 relative flex flex-col items-center justify-center text-slate-700 dark:text-slate-300">
                      <span>14</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-500 absolute bottom-0.5" />
                    </div>
                    <span className="p-2 text-slate-700 dark:text-slate-300">15</span>
                    <div className="p-2 relative flex flex-col items-center justify-center text-slate-700 dark:text-slate-300">
                      <span>16</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-500 absolute bottom-0.5" />
                    </div>
                    <span className="p-2 text-slate-700 dark:text-slate-300">17</span>
                    <span className="p-2 text-slate-700 dark:text-slate-300">18</span>

                    {/* Week 4: 20 is event day */}
                    <span className="p-2 text-slate-700 dark:text-slate-300">19</span>
                    <div className="p-2 relative flex flex-col items-center justify-center text-slate-700 dark:text-slate-300">
                      <span>20</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-500 absolute bottom-0.5" />
                    </div>
                    <span className="p-2 text-slate-700 dark:text-slate-300">21</span>
                    <span className="p-2 text-slate-700 dark:text-slate-300">22</span>
                    <span className="p-2 text-slate-700 dark:text-slate-300">23</span>
                    <span className="p-2 text-slate-700 dark:text-slate-300">24</span>
                    <span className="p-2 text-slate-700 dark:text-slate-300">25</span>

                    {/* Week 5 */}
                    <span className="p-2 text-slate-700 dark:text-slate-300">26</span>
                    <span className="p-2 text-slate-700 dark:text-slate-300">27</span>
                    <span className="p-2 text-slate-700 dark:text-slate-300">28</span>
                    <span className="p-2 text-slate-700 dark:text-slate-300">29</span>
                    <span className="p-2 text-slate-700 dark:text-slate-300">30</span>
                    <span className="p-2 text-slate-700 dark:text-slate-300">31</span>
                    <span className="p-2 text-slate-300 dark:text-slate-600">1</span>
                  </div>

                  {/* Calendar Legend matching Image 2 */}
                  <div className="pt-3 border-t border-slate-100 dark:border-navy-light/30 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#1D4ED8]" />
                      <span>Today</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-teal-500" />
                      <span>Event day</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600" />
                      <span>Other day</span>
                    </span>
                  </div>
                </div>

                {/* Recent Notifications Widget matching Image 2 */}
                <div className="bg-white dark:bg-[#111A33] rounded-3xl border border-slate-200/80 dark:border-navy-light/40 p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-black text-sm text-slate-900 dark:text-white">
                      Recent Notifications
                    </h3>
                    <button 
                      type="button"
                      onClick={() => setActiveTab('notifications')}
                      className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                    >
                      <span>View all</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    {/* Item 1 */}
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                        <Ticket className="w-5 h-5" />
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
                      <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                        <Megaphone className="w-5 h-5" />
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
                      <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                        <Star className="w-5 h-5" />
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
                      <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                        <Bell className="w-5 h-5" />
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

        {/* TAB 2: REGISTRATIONS VIEW */}
        {activeTab === 'registrations' && (
          <div className="space-y-4">
            <h2 className="text-lg font-black text-slate-900 dark:text-white">My Registrations</h2>
            {activeRegistrations.length === 0 ? (
              <div className="bg-white dark:bg-[#111A33] rounded-3xl p-8 text-center border border-slate-200/80 dark:border-navy-light/40 space-y-3">
                <Ticket className="w-12 h-12 text-slate-300 mx-auto" />
                <h3 className="font-bold text-slate-800 dark:text-white">No active registrations</h3>
                <p className="text-xs text-slate-400">Browse campus events and reserve your digital pass.</p>
                <Link to="/explore" className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs inline-block">
                  Explore Events
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeRegistrations.map((reg) => (
                  <div key={reg.id} className="bg-white dark:bg-[#111A33] rounded-2xl border border-slate-200/80 dark:border-navy-light/40 p-5 shadow-xs space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-teal-50 text-teal-600">CONFIRMED</span>
                        <h4 className="font-bold text-slate-900 dark:text-white mt-1">{reg.event?.title || 'Campus Event'}</h4>
                        <p className="text-xs text-slate-400 font-mono mt-0.5">Ref: {reg.referenceCode}</p>
                      </div>
                      <button
                        onClick={() => setSelectedReg(reg)}
                        className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-600 text-xs font-bold hover:bg-blue-100 flex items-center gap-1.5"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>Ticket</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: BOOKMARKS VIEW */}
        {activeTab === 'bookmarks' && (
          <div className="space-y-4">
            <h2 className="text-lg font-black text-slate-900 dark:text-white">Saved Events</h2>
            {bookmarkedEvents.length === 0 ? (
              <div className="bg-white dark:bg-[#111A33] rounded-3xl p-8 text-center border border-slate-200/80 dark:border-navy-light/40 space-y-3">
                <BookmarkIcon className="w-12 h-12 text-slate-300 mx-auto" />
                <h3 className="font-bold text-slate-800 dark:text-white">No saved events yet</h3>
                <p className="text-xs text-slate-400">Bookmark events to track them and receive reminders.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {bookmarkedEvents.map((evt) => (
                  <div key={evt.id} className="bg-white dark:bg-[#111A33] rounded-2xl border border-slate-200/80 dark:border-navy-light/40 p-5 shadow-xs space-y-2">
                    <h4 className="font-bold text-slate-900 dark:text-white">{evt.title}</h4>
                    <p className="text-xs text-slate-500 line-clamp-2">{evt.description}</p>
                    <Link to={`/events/${evt.slug || evt.id}`} className="text-xs font-bold text-blue-600 hover:underline inline-block pt-1">
                      View details &rarr;
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: NOTIFICATIONS VIEW */}
        {activeTab === 'notifications' && (
          <div className="space-y-4">
            <h2 className="text-lg font-black text-slate-900 dark:text-white">All Notifications</h2>
            <div className="bg-white dark:bg-[#111A33] rounded-3xl border border-slate-200/80 dark:border-navy-light/40 p-5 space-y-3">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-navy-light/20 flex items-start gap-3">
                <Ticket className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Your registration is confirmed!</h4>
                  <p className="text-xs text-slate-500 mt-0.5">You're all set for NSUK Tech Summit 2025.</p>
                  <span className="text-[10px] text-slate-400 mt-1 block">2 hours ago</span>
                </div>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-navy-light/20 flex items-start gap-3">
                <Megaphone className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">New event on campus</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Mental Health Awareness Week is now live.</p>
                  <span className="text-[10px] text-slate-400 mt-1 block">5 hours ago</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: PROFILE VIEW */}
        {activeTab === 'profile' && (
          <div className="bg-white dark:bg-[#111A33] rounded-3xl border border-slate-200/80 dark:border-navy-light/40 p-6 space-y-4">
            <h2 className="text-lg font-black text-slate-900 dark:text-white">Profile Details</h2>
            <div className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
              <p><strong>Name:</strong> {currentUser.name}</p>
              <p><strong>Email:</strong> {currentUser.email}</p>
              <p><strong>Role:</strong> {currentUser.role}</p>
              <p><strong>Account Type:</strong> {currentUser.userType}</p>
              {currentUser.department && <p><strong>Department:</strong> {currentUser.department}</p>}
              {currentUser.faculty && <p><strong>Faculty:</strong> {currentUser.faculty}</p>}
            </div>
          </div>
        )}

      </DashboardLayout>

      {/* Digital Ticket Modal */}
      {selectedReg && (
        <DigitalTicketModal
          registration={selectedReg}
          isOpen={!!selectedReg}
          onClose={() => setSelectedReg(null)}
        />
      )}
    </>
  );
};
export default StudentDashboard;
