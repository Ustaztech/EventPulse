import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Search, 
  Sparkles, 
  Calendar, 
  MapPin, 
  ArrowRight, 
  Users, 
  Bell, 
  ShieldCheck, 
  BookOpen, 
  Code, 
  Trophy, 
  Briefcase,
  Layers,
  ChevronRight
} from 'lucide-react';
import { db } from '../lib/storage';
import { EventCard } from '../components/EventCard';
import { CATEGORY_DEFINITIONS, NSUK_CAMPUSES } from '../lib/nsuk-data';
import { useAuth } from '../lib/AuthContext';

export const HomePage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const allEvents = db.getEvents().filter(e => e.status === 'PUBLISHED');
  
  // Happening Now filter
  const now = new Date();
  const happeningNow = allEvents.filter(e => {
    const s = new Date(e.startTime);
    const end = new Date(e.endTime);
    return now >= s && now <= end;
  });

  // Upcoming featured events
  const upcomingEvents = allEvents.filter(e => new Date(e.startTime) > now);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/explore?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/explore');
    }
  };

  return (
    <div className="space-y-16 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50/80 via-white to-slate-50 dark:from-navy-dark dark:via-navy dark:to-slate-900 pt-12 pb-20 lg:pt-20 lg:pb-28 border-b border-slate-200/70 dark:border-slate-800 transition-colors duration-200">
        {/* Abstract Background Glows */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-royal/10 dark:bg-royal/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-80 h-80 bg-teal/15 dark:bg-teal/20 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            {/* Pill Tag */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white dark:bg-navy-card border border-slate-200 dark:border-slate-700 shadow-sm text-xs font-bold text-slate-800 dark:text-slate-200 animate-in fade-in">
              <span className="w-2 h-2 rounded-full bg-teal-accent animate-ping" />
              <span className="text-royal dark:text-turquoise font-extrabold">EventPulse</span>
              <span className="text-slate-300 dark:text-slate-600">&bull;</span>
              <span className="text-slate-600 dark:text-slate-300">Campus Event Discovery & Notification Platform</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.15]">
              Stay Connected. <br />
              <span className="bg-gradient-to-r from-royal via-turquoise to-teal bg-clip-text text-transparent">
                Never Miss an Event.
              </span>
            </h1>

            {/* Sub-headline */}
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
              The intelligent campus platform for discovering academic defenses, faculty symposiums, athletic tournaments, and student life activities (NSUK Pilot Case Study).
            </p>

            {/* Global Search Bar */}
            <form 
              onSubmit={handleSearchSubmit}
              className="max-w-2xl mx-auto bg-white dark:bg-navy-card p-2 sm:p-2.5 rounded-2xl shadow-xl border border-slate-200/90 dark:border-slate-700 flex flex-col sm:flex-row items-center gap-2"
            >
              <div className="flex items-center gap-3 w-full px-3 py-1 flex-1">
                <Search className="w-5 h-5 text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search events by title, faculty, topic, or venue..."
                  className="w-full text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 bg-transparent focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="w-full sm:w-auto px-7 py-3 rounded-xl bg-gradient-to-r from-royal to-teal hover:opacity-95 text-white font-bold text-sm shadow-md transition-all shrink-0 flex items-center justify-center gap-2"
              >
                <span>Find Events</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Quick Popular Topics */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Popular:</span>
              {['Tech Summit', 'Debate Championship', 'Sports Cup', 'Faculty of Law', 'Career Fair'].map((tag) => (
                <button
                  key={tag}
                  onClick={() => navigate(`/explore?search=${encodeURIComponent(tag)}`)}
                  className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium transition-colors"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* NSUK Institutional Metric Strip */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div className="bg-white/80 dark:bg-navy-card/90 backdrop-blur-md p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center shadow-xs">
              <span className="text-2xl sm:text-3xl font-black text-royal dark:text-turquoise block">10+</span>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">University Faculties</span>
            </div>
            <div className="bg-white/80 dark:bg-navy-card/90 backdrop-blur-md p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center shadow-xs">
              <span className="text-2xl sm:text-3xl font-black text-teal block">100%</span>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Verified Venues & Maps</span>
            </div>
            <div className="bg-white/80 dark:bg-navy-card/90 backdrop-blur-md p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center shadow-xs">
              <span className="text-2xl sm:text-3xl font-black text-turquoise block">4</span>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Campuses Connected</span>
            </div>
            <div className="bg-white/80 dark:bg-navy-card/90 backdrop-blur-md p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center shadow-xs">
              <span className="text-2xl sm:text-3xl font-black text-navy dark:text-white block">24/7</span>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Automated Outbox Alerts</span>
            </div>
          </div>
        </div>
      </section>

      {/* Happening Now Spotlight (if any event is active) */}
      {happeningNow.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-emerald-500/10 via-teal/10 to-royal/10 border-2 border-emerald-500/30 rounded-3xl p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <span className="relative flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
                </span>
                <div>
                  <h2 className="text-2xl font-black text-slate-900">Happening Now on Campus</h2>
                  <p className="text-xs text-slate-600">Live sessions underway right now at NSUK venues.</p>
                </div>
              </div>
              <Link
                to="/explore"
                className="text-xs font-bold text-teal hover:underline flex items-center gap-1"
              >
                <span>View Full Schedule</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {happeningNow.map((evt) => (
                <EventCard key={evt.id} event={evt} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured & Upcoming Events */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-royal font-bold text-xs uppercase tracking-wider mb-1">
              <Calendar className="w-4 h-4" />
              <span>Campus Calendar</span>
            </div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">
              Upcoming NSUK Events
            </h2>
          </div>
          <Link
            to="/explore"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-300 hover:border-royal text-royal hover:bg-blue-50/50 text-sm font-bold transition-all"
          >
            <span>Explore All Events</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {upcomingEvents.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4 max-w-xl mx-auto shadow-xs">
            <div className="w-16 h-16 bg-blue-50 text-royal rounded-2xl flex items-center justify-center mx-auto">
              <Calendar className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">No Upcoming Events Yet</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              Be the first to publish a campus symposium, faculty workshop, sports tournament, or cultural day for the NSUK community.
            </p>
            {currentUser && (currentUser.role === 'ADMIN' || currentUser.role === 'ORGANIZER') ? (
              <Link
                to="/dashboard/organizer?action=new"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-royal to-teal text-white font-bold text-xs shadow-md"
              >
                <span>Publish First Event</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <Link
                to="/auth/register"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-royal text-white font-bold text-xs shadow-md"
              >
                <span>Create Account to Host Events</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingEvents.slice(0, 6).map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </section>

      {/* Browse by Categories */}
      <section className="bg-slate-100/70 dark:bg-slate-900/60 py-16 border-y border-slate-200/80 dark:border-slate-800 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Explore by Category
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">
              Filter campus activities tailored to your academic pursuits, professional development, and social life.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {CATEGORY_DEFINITIONS.map((cat) => {
              const count = allEvents.filter(e => e.categoryId === cat.slug || e.categoryName?.toLowerCase() === cat.name.toLowerCase()).length;
              return (
                <Link
                  key={cat.slug}
                  to={`/explore?category=${cat.slug}`}
                  className="group bg-white dark:bg-navy-card p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:border-royal dark:hover:border-turquoise shadow-xs hover:shadow-md transition-all hover:-translate-y-1"
                >
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white mb-3 shadow-xs"
                    style={{ backgroundColor: cat.color }}
                  >
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm group-hover:text-royal dark:group-hover:text-turquoise transition-colors">
                    {cat.name}
                  </h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                    {count} {count === 1 ? 'event' : 'events'}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Campus Hubs & Venues Overview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-navy via-navy-light to-navy rounded-3xl p-8 sm:p-12 text-white overflow-hidden relative shadow-2xl">
          <div className="max-w-2xl space-y-4 relative z-10">
            <span className="text-xs font-bold uppercase tracking-wider text-turquoise bg-white/10 px-3 py-1 rounded-full">
              Physical & Hybrid Events
            </span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
              Four Connected Campuses Across Nasarawa & FCT
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Every event venue comes with verified geographic coordinates, landmarks, building numbers, and one-click Google Maps directions. Never get lost looking for a lecture hall or sports arena.
            </p>
            <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
              {NSUK_CAMPUSES.map((c) => (
                <div key={c.id} className="flex items-center gap-2 text-slate-200 font-medium">
                  <MapPin className="w-4 h-4 text-turquoise shrink-0" />
                  <span>{c.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Organizer Call-To-Action */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-royal to-teal rounded-3xl p-8 sm:p-12 text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl">
          <div className="space-y-3 max-w-xl text-center md:text-left">
            <h2 className="text-3xl font-black tracking-tight">
              Hosting an Event at NSUK?
            </h2>
            <p className="text-sm text-blue-100 leading-relaxed">
              Departments, student associations, research centres, and accredited student bodies can manage registrations, check attendance with QR codes, and broadcast updates directly to verified participants.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
            <Link
              to="/dashboard/organizer"
              className="px-6 py-3.5 rounded-xl font-bold text-sm bg-white text-royal hover:bg-blue-50 shadow-md transition-all text-center w-full sm:w-auto"
            >
              Access Organiser Portal
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
export default HomePage;
