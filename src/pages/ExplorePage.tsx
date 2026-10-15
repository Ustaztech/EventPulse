import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  Search, 
  Calendar as CalendarIcon, 
  Grid, 
  MapPin, 
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Users,
  Building,
  GraduationCap,
  Layers,
  Filter
} from 'lucide-react';
import { db } from '../lib/storage';
import { EventCard } from '../components/EventCard';
import { CATEGORY_DEFINITIONS, NSUK_CAMPUSES } from '../lib/nsuk-data';
import { Event } from '../lib/types';

export const ExplorePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // URL Query Sync
  const initialSearch = searchParams.get('search') || '';
  const initialCategory = searchParams.get('category') || 'all';
  const initialView = searchParams.get('view') || 'grid';
  const initialDateOption = searchParams.get('dateOption') || 'any';
  const initialCampus = searchParams.get('campus') || 'all';
  const initialOrganizer = searchParams.get('organizer') || 'all';
  const initialFormat = searchParams.get('format') || 'all';

  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedDateOption, setSelectedDateOption] = useState(initialDateOption);
  const [selectedCampus, setSelectedCampus] = useState(initialCampus);
  const [selectedOrganizer, setSelectedOrganizer] = useState(initialOrganizer);
  const [selectedFormat, setSelectedFormat] = useState(initialFormat);
  const [selectedSort, setSelectedSort] = useState<'date-asc' | 'date-desc' | 'popular' | 'alpha'>('date-asc');
  const [activeView, setActiveView] = useState<'grid' | 'calendar'>(initialView === 'calendar' ? 'calendar' : 'grid');

  const [isLoading, setIsLoading] = useState(false);
  const [eventsList, setEventsList] = useState<Event[]>(() => db.getEvents());

  // Accordion toggle states
  const [catOpen, setCatOpen] = useState(true);
  const [dateOpen, setDateOpen] = useState(true);
  const [orgOpen, setOrgOpen] = useState(true);
  const [campusOpen, setCampusOpen] = useState(true);
  const [formatOpen, setFormatOpen] = useState(true);

  // Calendar State
  const [currentMonthDate, setCurrentMonthDate] = useState(new Date());

  // Sync state into URL query params
  useEffect(() => {
    const params: Record<string, string> = {};
    if (searchQuery) params.search = searchQuery;
    if (selectedCategory !== 'all') params.category = selectedCategory;
    if (selectedDateOption !== 'any') params.dateOption = selectedDateOption;
    if (selectedCampus !== 'all') params.campus = selectedCampus;
    if (selectedOrganizer !== 'all') params.organizer = selectedOrganizer;
    if (selectedFormat !== 'all') params.format = selectedFormat;
    if (activeView === 'calendar') params.view = 'calendar';
    setSearchParams(params, { replace: true });
  }, [
    searchQuery,
    selectedCategory,
    selectedDateOption,
    selectedCampus,
    selectedOrganizer,
    selectedFormat,
    activeView,
  ]);

  const loadEvents = async () => {
    setIsLoading(true);
    await db.syncFromBackend();
    setEventsList(db.getEvents());
    setIsLoading(false);
  };

  useEffect(() => {
    loadEvents();
  }, []);

  // Distinct Organisers List
  const uniqueOrganizers = useMemo(() => {
    const map = new Map<string, string>();
    eventsList.forEach(e => {
      if (e.organizerName) {
        map.set(e.organizerId, e.organizerName);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [eventsList]);

  // Filtering & Sorting Pipeline
  const filteredEvents = useMemo(() => {
    const now = new Date();

    return eventsList
      .filter((evt) => {
        const startTime = new Date(evt.startTime);
        const endTime = new Date(evt.endTime);

        // Date option filtering
        if (selectedDateOption === 'today') {
          const today = new Date();
          if (startTime.toDateString() !== today.toDateString()) return false;
        } else if (selectedDateOption === 'this_week') {
          const nextWeek = new Date();
          nextWeek.setDate(nextWeek.getDate() + 7);
          if (startTime < now || startTime > nextWeek) return false;
        } else if (selectedDateOption === 'this_month') {
          if (startTime.getMonth() !== now.getMonth() || startTime.getFullYear() !== now.getFullYear()) return false;
        }

        // Keyword Search
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchTitle = evt.title.toLowerCase().includes(q);
          const matchDesc = evt.description.toLowerCase().includes(q);
          const matchVenue = (evt.venueName || '').toLowerCase().includes(q);
          const matchOrganizer = (evt.organizerName || '').toLowerCase().includes(q);
          if (!matchTitle && !matchDesc && !matchVenue && !matchOrganizer) {
            return false;
          }
        }

        // Category Filter
        if (selectedCategory !== 'all') {
          if (evt.categoryId !== selectedCategory && evt.categorySlug !== selectedCategory) {
            return false;
          }
        }

        // Campus Filter
        if (selectedCampus !== 'all') {
          if (evt.campusArea !== selectedCampus) {
            return false;
          }
        }

        // Organiser Filter
        if (selectedOrganizer !== 'all') {
          if (evt.organizerId !== selectedOrganizer) {
            return false;
          }
        }

        // Format Filter
        if (selectedFormat !== 'all') {
          if (evt.format !== selectedFormat) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (selectedSort === 'date-asc') {
          return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
        }
        if (selectedSort === 'date-desc') {
          return new Date(b.startTime).getTime() - new Date(a.startTime).getTime();
        }
        if (selectedSort === 'popular') {
          return (b.registeredCount || 0) - (a.registeredCount || 0);
        }
        if (selectedSort === 'alpha') {
          return a.title.localeCompare(b.title);
        }
        return 0;
      });
  }, [
    eventsList,
    searchQuery,
    selectedCategory,
    selectedDateOption,
    selectedCampus,
    selectedOrganizer,
    selectedFormat,
    selectedSort,
  ]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedDateOption('any');
    setSelectedCampus('all');
    setSelectedOrganizer('all');
    setSelectedFormat('all');
    setSelectedSort('date-asc');
    setSearchParams({});
  };

  const hasActiveFilters = 
    Boolean(searchQuery) ||
    selectedCategory !== 'all' ||
    selectedDateOption !== 'any' ||
    selectedCampus !== 'all' ||
    selectedOrganizer !== 'all' ||
    selectedFormat !== 'all';

  // Calendar Helpers
  const currentYear = currentMonthDate.getFullYear();
  const currentMonth = currentMonthDate.getMonth();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();

  const prevMonth = () => setCurrentMonthDate(new Date(currentYear, currentMonth - 1, 1));
  const nextMonth = () => setCurrentMonthDate(new Date(currentYear, currentMonth + 1, 1));
  const goToToday = () => setCurrentMonthDate(new Date());

  const categories = [
    { slug: 'all', name: 'All Categories' },
    ...CATEGORY_DEFINITIONS
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 pb-20">
      
      {/* Dual Column Layout matching Image 4 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Filter Sidebar (3 cols) */}
        <aside className="lg:col-span-3 space-y-5">
          <div className="bg-white dark:bg-[#111A33] rounded-2xl border border-slate-200/90 dark:border-navy-light/40 p-5 shadow-xs space-y-6">
            
            {/* Search Events input */}
            <div>
              <label className="text-xs font-bold text-slate-900 dark:text-white block mb-2">
                Search Events
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for events, topics..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-navy-light/60 bg-white dark:bg-[#0B132B] text-slate-900 dark:text-white text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Category Filter */}
            <div className="border-t border-slate-100 dark:border-navy-light/40 pt-4">
              <button
                type="button"
                onClick={() => setCatOpen(!catOpen)}
                className="w-full flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white mb-2"
              >
                <span>Category</span>
                {catOpen ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
              </button>

              {catOpen && (
                <div className="space-y-1.5 pt-1">
                  {categories.map((c) => (
                    <label
                      key={c.slug}
                      className="flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-300 cursor-pointer hover:text-slate-900 dark:hover:text-white"
                    >
                      <input
                        type="radio"
                        name="category_filter"
                        checked={selectedCategory === c.slug}
                        onChange={() => setSelectedCategory(c.slug)}
                        className="w-3.5 h-3.5 text-blue-600 focus:ring-blue-500 rounded-full cursor-pointer"
                      />
                      <span>{c.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Date Filter */}
            <div className="border-t border-slate-100 dark:border-navy-light/40 pt-4">
              <button
                type="button"
                onClick={() => setDateOpen(!dateOpen)}
                className="w-full flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white mb-2"
              >
                <span>Date</span>
                {dateOpen ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
              </button>

              {dateOpen && (
                <div className="space-y-1.5 pt-1">
                  {[
                    { id: 'any', label: 'Any Date' },
                    { id: 'today', label: 'Today' },
                    { id: 'this_week', label: 'This Week' },
                    { id: 'this_month', label: 'This Month' },
                  ].map((d) => (
                    <label
                      key={d.id}
                      className="flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-300 cursor-pointer hover:text-slate-900 dark:hover:text-white"
                    >
                      <input
                        type="radio"
                        name="date_filter"
                        checked={selectedDateOption === d.id}
                        onChange={() => setSelectedDateOption(d.id)}
                        className="w-3.5 h-3.5 text-blue-600 focus:ring-blue-500 rounded-full cursor-pointer"
                      />
                      <span>{d.label}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Organiser Filter */}
            <div className="border-t border-slate-100 dark:border-navy-light/40 pt-4">
              <button
                type="button"
                onClick={() => setOrgOpen(!orgOpen)}
                className="w-full flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white mb-2"
              >
                <span>Organiser</span>
                {orgOpen ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
              </button>

              {orgOpen && (
                <div className="space-y-1.5 pt-1 max-h-40 overflow-y-auto">
                  <label className="flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-300 cursor-pointer hover:text-slate-900 dark:hover:text-white">
                    <input
                      type="radio"
                      name="org_filter"
                      checked={selectedOrganizer === 'all'}
                      onChange={() => setSelectedOrganizer('all')}
                      className="w-3.5 h-3.5 text-blue-600 focus:ring-blue-500 rounded-full cursor-pointer"
                    />
                    <span>All Organisers</span>
                  </label>
                  {uniqueOrganizers.map((org) => (
                    <label
                      key={org.id}
                      className="flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-300 cursor-pointer hover:text-slate-900 dark:hover:text-white truncate"
                    >
                      <input
                        type="radio"
                        name="org_filter"
                        checked={selectedOrganizer === org.id}
                        onChange={() => setSelectedOrganizer(org.id)}
                        className="w-3.5 h-3.5 text-blue-600 focus:ring-blue-500 rounded-full cursor-pointer"
                      />
                      <span className="truncate">{org.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Format Filter */}
            <div className="border-t border-slate-100 dark:border-navy-light/40 pt-4">
              <button
                type="button"
                onClick={() => setFormatOpen(!formatOpen)}
                className="w-full flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white mb-2"
              >
                <span>Format</span>
                {formatOpen ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
              </button>

              {formatOpen && (
                <div className="space-y-1.5 pt-1">
                  {[
                    { id: 'all', label: 'All Formats' },
                    { id: 'PHYSICAL', label: 'Physical' },
                    { id: 'ONLINE', label: 'Virtual' },
                    { id: 'HYBRID', label: 'Hybrid' },
                  ].map((f) => (
                    <label
                      key={f.id}
                      className="flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-300 cursor-pointer hover:text-slate-900 dark:hover:text-white"
                    >
                      <input
                        type="radio"
                        name="format_filter"
                        checked={selectedFormat === f.id}
                        onChange={() => setSelectedFormat(f.id)}
                        className="w-3.5 h-3.5 text-blue-600 focus:ring-blue-500 rounded-full cursor-pointer"
                      />
                      <span>{f.label}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Reset Button */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="w-full py-2 rounded-xl text-xs font-bold text-blue-600 dark:text-teal-300 hover:bg-blue-50 dark:hover:bg-navy-light/30 border border-blue-200 dark:border-navy-light transition-all"
              >
                Reset All Filters
              </button>
            )}

          </div>
        </aside>

        {/* Right Main Content Area (9 cols) */}
        <main className="lg:col-span-9 space-y-6">
          
          {/* Main Title & Subtitle matching Image 4 */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Explore Campus Events
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Discover workshops, sports, cultural events and more.
            </p>
          </div>

          {/* Search, Sort, and View Controls matching Image 4 */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search events, e.g. &quot;AI workshop&quot;, &quot;football&quot;, &quot;career&quot;..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-navy-light/60 bg-white dark:bg-[#111A33] text-slate-900 dark:text-white text-xs sm:text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-xs"
              />
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              {/* Sort Dropdown */}
              <select
                value={selectedSort}
                onChange={(e) => setSelectedSort(e.target.value as any)}
                aria-label="Sort events"
                className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-navy-light/60 bg-white dark:bg-[#111A33] text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-xs cursor-pointer"
              >
                <option value="date-asc">Date (Soonest)</option>
                <option value="date-desc">Date (Latest)</option>
                <option value="popular">Most Popular</option>
                <option value="alpha">Alphabetical</option>
              </select>

              {/* View Switcher: Grid vs Calendar */}
              <div className="flex items-center bg-slate-100 dark:bg-[#0B132B] p-1 rounded-xl border border-slate-200 dark:border-navy-light/60">
                <button
                  type="button"
                  onClick={() => setActiveView('grid')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    activeView === 'grid'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <Grid className="w-3.5 h-3.5" />
                  <span>Grid</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveView('calendar')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    activeView === 'calendar'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <CalendarIcon className="w-3.5 h-3.5" />
                  <span>Calendar</span>
                </button>
              </div>

              {/* Refresh */}
              <button
                type="button"
                onClick={loadEvents}
                disabled={isLoading}
                aria-label="Refresh events"
                className="p-2.5 rounded-xl border border-slate-200 dark:border-navy-light/60 bg-white dark:bg-[#111A33] text-slate-600 dark:text-slate-300 hover:bg-slate-50 shadow-xs"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Results count matching Image 4 */}
          <div className="text-xs font-bold text-slate-600 dark:text-slate-400">
            {filteredEvents.length} {filteredEvents.length === 1 ? 'event' : 'events'} found
          </div>

          {/* Grid View */}
          {activeView === 'grid' ? (
            <div>
              {filteredEvents.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-[#111A33] rounded-3xl border border-slate-200/90 dark:border-navy-light/40 p-8 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                    <Search className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-white">
                    No events matched your filters
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                    Try adjusting your search criteria, clearing category filters, or selecting any date.
                  </p>
                  {hasActiveFilters && (
                    <button
                      onClick={clearFilters}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-xs transition-all mt-2"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredEvents.map((evt) => (
                    <EventCard key={evt.id} event={evt} />
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Calendar View */
            <div className="bg-white dark:bg-[#111A33] rounded-3xl border border-slate-200 dark:border-navy-light/40 p-6 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    {currentMonthDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Campus events scheduled in WAT (UTC+1)</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={prevMonth} aria-label="Previous Month" className="p-2 rounded-xl border border-slate-200 dark:border-navy-light/60 hover:bg-slate-50 text-slate-700 dark:text-slate-200">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button onClick={goToToday} className="px-3.5 py-1.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-navy-light/60 hover:bg-slate-50 text-slate-700 dark:text-slate-200">
                    Today
                  </button>
                  <button onClick={nextMonth} aria-label="Next Month" className="p-2 rounded-xl border border-slate-200 dark:border-navy-light/60 hover:bg-slate-50 text-slate-700 dark:text-slate-200">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-slate-400 uppercase">
                <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
              </div>

              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: firstDayIndex }).map((_, i) => (
                  <div key={`empty-${i}`} className="min-h-[85px] rounded-xl bg-slate-50/50 dark:bg-slate-800/20" />
                ))}

                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const isToday = 
                    new Date().getDate() === day &&
                    new Date().getMonth() === currentMonth &&
                    new Date().getFullYear() === currentYear;

                  const dayEvents = filteredEvents.filter(e => {
                    const s = new Date(e.startTime);
                    return s.getDate() === day && s.getMonth() === currentMonth && s.getFullYear() === currentYear;
                  });

                  return (
                    <div
                      key={`day-${day}`}
                      className={`min-h-[85px] p-2 rounded-xl border transition-all flex flex-col justify-between ${
                        isToday
                          ? 'border-blue-600 bg-blue-50/30 dark:bg-blue-950/20 shadow-xs'
                          : 'border-slate-200 dark:border-navy-light/40 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold ${isToday ? 'text-blue-600 dark:text-teal-300' : 'text-slate-700 dark:text-slate-300'}`}>
                          {day}
                        </span>
                        {dayEvents.length > 0 && <span className="w-2 h-2 rounded-full bg-blue-600" />}
                      </div>

                      <div className="space-y-1 mt-1 overflow-y-auto max-h-[50px]">
                        {dayEvents.map(evt => (
                          <Link
                            key={evt.id}
                            to={`/events/${evt.slug}`}
                            className="block p-1 rounded text-[10px] font-semibold bg-blue-50 dark:bg-navy-light/40 text-blue-700 dark:text-teal-300 hover:bg-blue-600 hover:text-white transition-all truncate"
                          >
                            {evt.title}
                          </Link>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </main>
      </div>

    </div>
  );
};
export default ExplorePage;
