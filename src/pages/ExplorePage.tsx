import React, { useState, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  Calendar as CalendarIcon, 
  Grid, 
  List, 
  MapPin, 
  Globe, 
  Sparkles, 
  ArrowUpDown,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { db } from '../lib/storage';
import { EventCard } from '../components/EventCard';
import { CATEGORY_DEFINITIONS, NSUK_CAMPUSES } from '../lib/nsuk-data';
import { Event } from '../lib/types';

export const ExplorePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const initialSearch = searchParams.get('search') || '';
  const initialCategory = searchParams.get('category') || 'all';
  const initialView = searchParams.get('view') || 'grid';

  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedFormat, setSelectedFormat] = useState('all');
  const [selectedAudience, setSelectedAudience] = useState('all');
  const [selectedSort, setSelectedSort] = useState<'date-asc' | 'date-desc' | 'popular' | 'alpha'>('date-asc');
  const [activeView, setActiveView] = useState<'grid' | 'calendar'>(initialView === 'calendar' ? 'calendar' : 'grid');

  // Calendar State
  const [currentMonthDate, setCurrentMonthDate] = useState(new Date());

  const allEvents = db.getEvents().filter(e => e.status === 'PUBLISHED');

  // Filtering & Sorting pipeline
  const filteredEvents = useMemo(() => {
    return allEvents
      .filter((evt) => {
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

        // Category Filter
        if (selectedCategory !== 'all') {
          if (evt.categoryId !== selectedCategory && evt.categoryName?.toLowerCase() !== selectedCategory.toLowerCase()) {
            return false;
          }
        }

        // Format Filter
        if (selectedFormat !== 'all' && evt.format !== selectedFormat) {
          return false;
        }

        // Target Audience Filter
        if (selectedAudience !== 'all' && evt.targetAudience !== selectedAudience) {
          return false;
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
  }, [allEvents, searchQuery, selectedCategory, selectedFormat, selectedAudience, selectedSort]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedFormat('all');
    setSelectedAudience('all');
    setSelectedSort('date-asc');
    setSearchParams({});
  };

  // --- Calendar Generator Helpers ---
  const daysInMonth = new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() + 1, 0).getDate();
  const firstDayIndex = new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth(), 1).getDay();

  const prevMonth = () => {
    setCurrentMonthDate(new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonthDate(new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() + 1, 1));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6 transition-colors duration-200">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Explore Campus Events
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Discover academic lectures, student workshops, hackathons, and athletic games across NSUK.
          </p>
        </div>

        {/* View Switcher (Grid vs Calendar) */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl self-start md:self-auto border border-slate-200 dark:border-slate-700">
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

      {/* Filter and Search Bar Controls */}
      <div className="bg-white dark:bg-navy-card p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4 transition-colors duration-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Keyword Search */}
          <div className="md:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by keyword, faculty, speaker, venue..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-royal/30"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Category Dropdown */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-royal/30"
            >
              <option value="all">All Categories</option>
              {CATEGORY_DEFINITIONS.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By Dropdown */}
          <div>
            <select
              value={selectedSort}
              onChange={(e) => setSelectedSort(e.target.value as any)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-royal/30"
            >
              <option value="date-asc">Date: Upcoming First</option>
              <option value="date-desc">Date: Latest First</option>
              <option value="popular">Most Registrations</option>
              <option value="alpha">Alphabetical (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Secondary Filter Badges */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Format:</span>
            {[
              { label: 'All Formats', val: 'all' },
              { label: 'Campus Physical', val: 'PHYSICAL' },
              { label: 'Online Meeting', val: 'ONLINE' },
              { label: 'Hybrid Format', val: 'HYBRID' }
            ].map((f) => (
              <button
                key={f.val}
                onClick={() => setSelectedFormat(f.val)}
                className={`px-3 py-1 rounded-full font-semibold transition-all ${
                  selectedFormat === f.val
                    ? 'bg-royal text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {(searchQuery || selectedCategory !== 'all' || selectedFormat !== 'all' || selectedAudience !== 'all') && (
            <button
              onClick={clearFilters}
              className="text-xs font-bold text-rose-600 hover:underline flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" /> Clear All Filters
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area: Grid View or Calendar View */}
      {activeView === 'grid' ? (
        <div>
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-4 px-1">
            <span>Showing <strong>{filteredEvents.length}</strong> events</span>
          </div>

          {filteredEvents.length === 0 ? (
            <div className="bg-white dark:bg-navy-card rounded-3xl border border-slate-200 dark:border-slate-800 p-12 text-center space-y-4">
              <div className="w-16 h-16 bg-blue-50 dark:bg-slate-800 text-royal dark:text-turquoise rounded-2xl flex items-center justify-center mx-auto">
                <Search className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">No events matched your criteria</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                Try searching with fewer filters or explore another campus category.
              </p>
              <button
                onClick={clearFilters}
                className="px-6 py-2.5 rounded-xl font-bold text-sm bg-royal text-white hover:bg-royal-hover shadow-sm"
              >
                Reset Search Filters
              </button>
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
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black text-slate-900 dark:text-white">
              {currentMonthDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={prevMonth}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentMonthDate(new Date())}
                className="px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
              >
                Today
              </button>
              <button
                onClick={nextMonth}
                className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Days of week */}
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider py-2 border-b border-slate-100 dark:border-slate-800">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          {/* Calendar Matrix Grid */}
          <div className="grid grid-cols-7 gap-2">
            {/* Blank leading slots */}
            {Array.from({ length: firstDayIndex }).map((_, i) => (
              <div key={`blank-${i}`} className="h-28 rounded-2xl bg-slate-50/50 dark:bg-slate-900/40 border border-transparent" />
            ))}

            {/* Days in current month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateObj = new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth(), day);
              const dateStr = dateObj.toISOString().split('T')[0];
              
              const dayEvents = filteredEvents.filter(e => e.startTime.startsWith(dateStr));
              const isToday = new Date().toDateString() === dateObj.toDateString();

              return (
                <div
                  key={`day-${day}`}
                  className={`h-28 sm:h-32 p-2 rounded-2xl border transition-all flex flex-col justify-between overflow-hidden ${
                    isToday 
                      ? 'border-royal bg-blue-50/40 dark:bg-blue-950/40 ring-1 ring-royal' 
                      : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                      isToday ? 'bg-royal text-white' : 'text-slate-800 dark:text-slate-200'
                    }`}>
                      {day}
                    </span>
                    {dayEvents.length > 0 && (
                      <span className="text-[10px] font-extrabold text-teal">
                        {dayEvents.length} {dayEvents.length === 1 ? 'event' : 'events'}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 overflow-y-auto max-h-20 scrollbar-none">
                    {dayEvents.map(evt => (
                      <Link
                        key={evt.id}
                        to={`/events/${evt.slug}`}
                        className="block text-[11px] font-bold p-1 rounded-md text-slate-800 dark:text-slate-200 truncate bg-blue-50 dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-slate-700 border border-blue-200 dark:border-slate-700 transition-colors"
                        title={evt.title}
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
export default ExplorePage;
