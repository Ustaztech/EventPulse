import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  Calendar as CalendarIcon, 
  Grid, 
  MapPin, 
  Sparkles, 
  ArrowUpDown,
  X,
  ChevronLeft,
  ChevronRight,
  Clock,
  UserCheck,
  Building,
  RefreshCw,
  AlertCircle
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
  const initialTimeline = searchParams.get('timeline') || 'upcoming';
  const initialCampus = searchParams.get('campus') || 'all';
  const initialOrganizer = searchParams.get('organizer') || 'all';
  const initialFormat = searchParams.get('format') || 'all';
  const initialStartDate = searchParams.get('startDate') || '';
  const initialEndDate = searchParams.get('endDate') || '';

  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedTimeline, setSelectedTimeline] = useState<'upcoming' | 'ongoing' | 'past' | 'cancelled' | 'all'>(
    (initialTimeline as any) || 'upcoming'
  );
  const [selectedCampus, setSelectedCampus] = useState(initialCampus);
  const [selectedOrganizer, setSelectedOrganizer] = useState(initialOrganizer);
  const [selectedFormat, setSelectedFormat] = useState(initialFormat);
  const [startDateFilter, setStartDateFilter] = useState(initialStartDate);
  const [endDateFilter, setEndDateFilter] = useState(initialEndDate);
  const [selectedSort, setSelectedSort] = useState<'date-asc' | 'date-desc' | 'popular' | 'alpha'>('date-asc');
  const [activeView, setActiveView] = useState<'grid' | 'calendar'>(initialView === 'calendar' ? 'calendar' : 'grid');

  const [isLoading, setIsLoading] = useState(false);
  const [eventsList, setEventsList] = useState<Event[]>(() => db.getEvents());

  // Calendar State
  const [currentMonthDate, setCurrentMonthDate] = useState(new Date());

  // Sync state into URL query params
  useEffect(() => {
    const params: Record<string, string> = {};
    if (searchQuery) params.search = searchQuery;
    if (selectedCategory !== 'all') params.category = selectedCategory;
    if (selectedTimeline !== 'upcoming') params.timeline = selectedTimeline;
    if (selectedCampus !== 'all') params.campus = selectedCampus;
    if (selectedOrganizer !== 'all') params.organizer = selectedOrganizer;
    if (selectedFormat !== 'all') params.format = selectedFormat;
    if (startDateFilter) params.startDate = startDateFilter;
    if (endDateFilter) params.endDate = endDateFilter;
    if (activeView === 'calendar') params.view = 'calendar';
    setSearchParams(params, { replace: true });
  }, [
    searchQuery,
    selectedCategory,
    selectedTimeline,
    selectedCampus,
    selectedOrganizer,
    selectedFormat,
    startDateFilter,
    endDateFilter,
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

  // Distinct Organisers List for Filter Dropdown
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
        // Timeline Filter & Upcoming Exclusion
        const startTime = new Date(evt.startTime);
        const endTime = new Date(evt.endTime);

        if (selectedTimeline === 'upcoming') {
          // Strictly upcoming: Must NOT be cancelled and must NOT be in the past
          if (evt.status === 'CANCELLED' || endTime < now) {
            return false;
          }
        } else if (selectedTimeline === 'ongoing') {
          if (evt.status === 'CANCELLED' || now < startTime || now > endTime) {
            return false;
          }
        } else if (selectedTimeline === 'past') {
          if (endTime >= now || evt.status === 'CANCELLED') {
            return false;
          }
        } else if (selectedTimeline === 'cancelled') {
          if (evt.status !== 'CANCELLED') {
            return false;
          }
        } else {
          // 'all': Show published events
          if (evt.status !== 'PUBLISHED' && evt.status !== 'CANCELLED') {
            return false;
          }
        }

        // Keyword Search
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matches = 
            evt.title.toLowerCase().includes(q) ||
            evt.description.toLowerCase().includes(q) ||
            evt.venueName?.toLowerCase().includes(q) ||
            evt.categoryName?.toLowerCase().includes(q) ||
            evt.organizerName.toLowerCase().includes(q);
          if (!matches) return false;
        }

        // Category Filter (supports slug, ID, or display name consistently)
        if (selectedCategory !== 'all') {
          const catLower = selectedCategory.toLowerCase();
          const matchSlug = evt.categorySlug?.toLowerCase() === catLower;
          const matchId = evt.categoryId.toLowerCase() === catLower;
          const matchName = evt.categoryName?.toLowerCase() === catLower;

          // Also check against canonical definitions
          const def = CATEGORY_DEFINITIONS.find(c => c.slug === catLower || c.name.toLowerCase() === catLower);
          const matchDef = def && (
            evt.categoryId === def.slug ||
            evt.categoryName?.toLowerCase() === def.name.toLowerCase() ||
            evt.categorySlug?.toLowerCase() === def.slug
          );

          if (!matchSlug && !matchId && !matchName && !matchDef) {
            return false;
          }
        }

        // Organiser Filter
        if (selectedOrganizer !== 'all') {
          if (evt.organizerId !== selectedOrganizer && evt.organizerName.toLowerCase() !== selectedOrganizer.toLowerCase()) {
            return false;
          }
        }

        // Campus Filter
        if (selectedCampus !== 'all') {
          const campusMatch = evt.campusArea?.toLowerCase().includes(selectedCampus.toLowerCase()) ||
                              evt.venueName?.toLowerCase().includes(selectedCampus.toLowerCase());
          if (!campusMatch) return false;
        }

        // Format Filter
        if (selectedFormat !== 'all' && evt.format !== selectedFormat) {
          return false;
        }

        // Date Range Filter
        if (startDateFilter) {
          const filterStart = new Date(startDateFilter);
          if (startTime < filterStart) return false;
        }
        if (endDateFilter) {
          const filterEnd = new Date(`${endDateFilter}T23:59:59`);
          if (startTime > filterEnd) return false;
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
    selectedTimeline,
    selectedCampus,
    selectedOrganizer,
    selectedFormat,
    startDateFilter,
    endDateFilter,
    selectedSort,
  ]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedTimeline('upcoming');
    setSelectedCampus('all');
    setSelectedOrganizer('all');
    setSelectedFormat('all');
    setStartDateFilter('');
    setEndDateFilter('');
    setSelectedSort('date-asc');
    setSearchParams({});
  };

  const hasActiveFilters = 
    Boolean(searchQuery) ||
    selectedCategory !== 'all' ||
    selectedTimeline !== 'upcoming' ||
    selectedCampus !== 'all' ||
    selectedOrganizer !== 'all' ||
    selectedFormat !== 'all' ||
    Boolean(startDateFilter) ||
    Boolean(endDateFilter);

  // --- Calendar Generator Helpers ---
  const currentYear = currentMonthDate.getFullYear();
  const currentMonth = currentMonthDate.getMonth();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();

  const prevMonth = () => {
    setCurrentMonthDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonthDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const goToToday = () => {
    setCurrentMonthDate(new Date());
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-20">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6 transition-colors duration-200">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Explore Campus Events
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Discover academic symposia, workshops, sports galas, and student association programs across NSUK.
          </p>
        </div>

        {/* View Switcher (Grid vs Calendar) */}
        <div className="flex items-center gap-2">
          <button
            onClick={loadEvents}
            disabled={isLoading}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
            title="Refresh Events"
            aria-label="Refresh events from database"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setActiveView('grid')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeView === 'grid'
                  ? 'bg-white dark:bg-navy-card text-royal dark:text-turquoise shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Grid View</span>
            </button>
            <button
              onClick={() => setActiveView('calendar')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeView === 'calendar'
                  ? 'bg-white dark:bg-navy-card text-royal dark:text-turquoise shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>Calendar View</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Filter Console */}
      <div className="bg-white dark:bg-navy-card p-5 sm:p-6 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4 transition-colors duration-200">
        {/* Row 1: Keyword, Category, Organiser, Sort */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Keyword Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search title, speaker, hall..."
              className="w-full pl-10 pr-8 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-royal/30"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Dropdown */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs sm:text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-royal/30 font-medium"
            >
              <option value="all">All Categories (8)</option>
              {CATEGORY_DEFINITIONS.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Dedicated Organiser Filter */}
          <div>
            <select
              value={selectedOrganizer}
              onChange={(e) => setSelectedOrganizer(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs sm:text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-royal/30 font-medium"
            >
              <option value="all">All Organisers</option>
              {uniqueOrganizers.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By Dropdown */}
          <div>
            <select
              value={selectedSort}
              onChange={(e) => setSelectedSort(e.target.value as any)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs sm:text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-royal/30 font-medium"
            >
              <option value="date-asc">Date: Upcoming First</option>
              <option value="date-desc">Date: Latest First</option>
              <option value="popular">Most Popular</option>
              <option value="alpha">Title (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Row 2: Timeline, Campus, Format, Date Range */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          {/* Timeline Filter */}
          <div>
            <select
              value={selectedTimeline}
              onChange={(e) => setSelectedTimeline(e.target.value as any)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-semibold focus:outline-none focus:ring-2 focus:ring-royal/30"
            >
              <option value="upcoming">Timeline: Upcoming Events Only</option>
              <option value="ongoing">Timeline: Happening Now (Ongoing)</option>
              <option value="past">Timeline: Past Events</option>
              <option value="cancelled">Timeline: Cancelled Events</option>
              <option value="all">Timeline: All Timelines</option>
            </select>
          </div>

          {/* Campus Filter */}
          <div>
            <select
              value={selectedCampus}
              onChange={(e) => setSelectedCampus(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-semibold focus:outline-none focus:ring-2 focus:ring-royal/30"
            >
              <option value="all">All Campuses</option>
              {NSUK_CAMPUSES.map((camp) => (
                <option key={camp.id} value={camp.name}>
                  {camp.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range Start */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-400 shrink-0">From:</span>
            <input
              type="date"
              value={startDateFilter}
              onChange={(e) => setStartDateFilter(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-royal/30"
            />
          </div>

          {/* Date Range End */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-400 shrink-0">To:</span>
            <input
              type="date"
              value={endDateFilter}
              onChange={(e) => setEndDateFilter(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-royal/30"
            />
          </div>
        </div>

        {/* Format Badges & Clear Filter Button */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Format:</span>
            {[
              { label: 'All Formats', val: 'all' },
              { label: 'Campus Physical', val: 'PHYSICAL' },
              { label: 'Online Meeting', val: 'ONLINE' },
              { label: 'Hybrid Format', val: 'HYBRID' }
            ].map((f) => (
              <button
                key={f.val}
                onClick={() => setSelectedFormat(f.val)}
                className={`px-3 py-1 rounded-full font-semibold transition-all text-xs ${
                  selectedFormat === f.val
                    ? 'bg-royal text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 ml-auto"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear All Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {activeView === 'grid' ? (
        <div>
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-semibold mb-4 px-1">
            <span>
              Showing <strong>{filteredEvents.length}</strong> {selectedTimeline === 'upcoming' ? 'upcoming' : ''} event{filteredEvents.length === 1 ? '' : 's'}
            </span>
          </div>

          {filteredEvents.length === 0 ? (
            <div className="bg-white dark:bg-navy-card rounded-3xl border border-slate-200 dark:border-slate-800 p-12 text-center space-y-4">
              <div className="w-16 h-16 bg-blue-50 dark:bg-slate-800 text-royal dark:text-turquoise rounded-2xl flex items-center justify-center mx-auto">
                <Search className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                {eventsList.length === 0 ? 'No campus events published yet' : 'No events matched your selected criteria'}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                {eventsList.length === 0
                  ? 'There are currently no confirmed campus events published on the platform. Accredited organisers can propose events from their dashboard.'
                  : 'Try clearing your category, date range, or timeline filters to discover other scheduled campus activities.'}
              </p>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="px-6 py-2.5 rounded-xl font-bold text-sm bg-royal text-white hover:bg-royal-hover shadow-sm transition-all"
                >
                  Reset Search Filters
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
        <div className="bg-white dark:bg-navy-card rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
          {/* Calendar Month Navigation Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">
                {currentMonthDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Times displayed in Africa/Lagos (WAT, UTC+1)</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={prevMonth}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                aria-label="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={goToToday}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
              >
                Today
              </button>
              <button
                onClick={nextMonth}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                aria-label="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Day of Week Headers */}
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          {/* Month Grid */}
          <div className="grid grid-cols-7 gap-2">
            {/* Empty Offset Days */}
            {Array.from({ length: firstDayIndex }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[90px] rounded-2xl bg-slate-50/50 dark:bg-slate-800/20 border border-transparent" />
            ))}

            {/* Days of the Month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const cellDate = new Date(currentYear, currentMonth, day);
              const isToday = 
                new Date().getDate() === day &&
                new Date().getMonth() === currentMonth &&
                new Date().getFullYear() === currentYear;

              // Events occurring on this calendar day
              const dayEvents = filteredEvents.filter(e => {
                const s = new Date(e.startTime);
                return s.getDate() === day && s.getMonth() === currentMonth && s.getFullYear() === currentYear;
              });

              return (
                <div
                  key={`day-${day}`}
                  className={`min-h-[90px] sm:min-h-[110px] p-2 rounded-2xl border transition-all flex flex-col justify-between ${
                    isToday
                      ? 'border-royal dark:border-turquoise bg-blue-50/40 dark:bg-royal/10 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold ${isToday ? 'text-royal dark:text-turquoise' : 'text-slate-700 dark:text-slate-300'}`}>
                      {day}
                    </span>
                    {dayEvents.length > 0 && (
                      <span className="w-2 h-2 rounded-full bg-teal-500" />
                    )}
                  </div>

                  <div className="space-y-1 mt-1 overflow-y-auto max-h-[70px]">
                    {dayEvents.map(evt => (
                      <Link
                        key={evt.id}
                        to={`/events/${evt.slug}`}
                        className="block p-1 rounded-md text-[10px] font-semibold bg-royal/10 dark:bg-royal/20 text-royal dark:text-turquoise hover:bg-royal hover:text-white transition-all truncate"
                        title={`${evt.title} (${new Date(evt.startTime).toLocaleTimeString('en-NG', { timeZone: 'Africa/Lagos' })})`}
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
    </div>
  );
};
