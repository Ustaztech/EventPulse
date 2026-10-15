import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Heart,
  ArrowRight,
  Clock,
  Sparkles,
  UserCheck
} from 'lucide-react';
import { Event } from '../lib/types';
import { db } from '../lib/storage';
import { useAuth } from '../lib/AuthContext';

interface EventCardProps {
  event: Event;
  onBookmarkChanged?: () => void;
}

export const EventCard: React.FC<EventCardProps> = ({ event, onBookmarkChanged }) => {
  const { currentUser } = useAuth();
  const [isBookmarked, setIsBookmarked] = useState<boolean>(() => {
    if (!currentUser) return false;
    return db.getBookmarks(currentUser.id).some(b => b.eventId === event.id);
  });

  const handleBookmarkToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!currentUser) return;
    const newState = db.toggleBookmark(event.id, currentUser.id);
    setIsBookmarked(newState);
    if (onBookmarkChanged) onBookmarkChanged();
  };

  const getCategoryBadgeColor = (category?: string) => {
    const cat = (category || '').toLowerCase();
    if (cat.includes('workshop')) return 'bg-purple-600 text-white';
    if (cat.includes('sport')) return 'bg-teal-600 text-white';
    if (cat.includes('career')) return 'bg-amber-600 text-white';
    if (cat.includes('cultural')) return 'bg-rose-600 text-white';
    if (cat.includes('academic')) return 'bg-blue-600 text-white';
    return 'bg-blue-700 text-white';
  };

  const registered = event.registeredCount || 0;

  return (
    <div className="group bg-white dark:bg-[#111A33] rounded-2xl overflow-hidden border border-slate-200/90 dark:border-navy-light/40 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col hover:-translate-y-1">
      {/* Banner Image Container */}
      <div className="relative h-44 sm:h-48 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
        <img
          src={event.bannerUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800'}
          alt={event.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-black/20" />

        {/* Floating Category Pill on top-left (Image 4 style) */}
        <div className="absolute top-3 left-3">
          <span className={`px-3 py-1 rounded-md text-[11px] font-bold tracking-wide shadow-sm ${getCategoryBadgeColor(event.categoryName)}`}>
            {event.categoryName || 'General'}
          </span>
        </div>

        {/* Floating Heart Button on top-right (Image 4 style) */}
        <div className="absolute top-3 right-3">
          <button
            onClick={handleBookmarkToggle}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors shadow-sm ${
              isBookmarked 
                ? 'bg-rose-500 text-white' 
                : 'bg-white/90 hover:bg-white text-slate-600 dark:text-slate-800'
            }`}
            title={isBookmarked ? 'Remove bookmark' : 'Save event'}
            aria-label="Save event"
          >
            <Heart className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>

      {/* Event Details Body */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-2">
          {/* Date & Time Row */}
          <div className="flex items-center flex-wrap gap-x-2 gap-y-1 text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300 font-semibold">
              <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              {new Date(event.startTime).toLocaleDateString('en-GB', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              })}
            </span>
            <span>&bull;</span>
            <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
              <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              {new Date(event.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(event.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (WAT)
            </span>
          </div>

          {/* Title */}
          <Link to={`/events/${event.slug}`}>
            <h3 className="font-bold text-base text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-teal-300 transition-colors line-clamp-2 leading-snug">
              {event.title}
            </h3>
          </Link>

          {/* Snippet */}
          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
            {event.description}
          </p>

          {/* Venue Location */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 pt-1">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="line-clamp-1 font-medium">
              {event.venueName || 'Main Campus Venue'}
              {event.buildingHall ? `, ${event.buildingHall}` : ''}
            </span>
          </div>

          {/* Organizer */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
            <UserCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="line-clamp-1 font-medium">
              {event.organizerName || 'Campus Community'}
            </span>
          </div>
        </div>

        {/* Card Footer matching Image 4 */}
        <div className="pt-3 border-t border-slate-100 dark:border-navy-light/40 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 font-medium">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              <span>{registered > 0 ? `${registered} interested` : 'Open'}</span>
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
              Free
            </span>
          </div>

          <Link
            to={`/events/${event.slug}`}
            className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors flex items-center gap-1 shrink-0 shadow-xs"
          >
            <span>View Details</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
};
export default EventCard;
