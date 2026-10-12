import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Globe, 
  Bookmark as BookmarkIcon, 
  ArrowRight,
  Clock,
  Sparkles,
  AlertCircle
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

  // Derive status from dates & cancellation
  const now = new Date();
  const start = new Date(event.startTime);
  const end = new Date(event.endTime);

  const isCancelled = event.status === 'CANCELLED';
  const isHappeningNow = !isCancelled && now >= start && now <= end;
  const isCompleted = !isCancelled && now > end;
  const isUpcoming = !isCancelled && now < start;

  const capacity = event.capacity;
  const registered = event.registeredCount || 0;
  const isSoldOut = capacity ? registered >= capacity : false;
  const percentageFilled = capacity ? Math.min(100, Math.round((registered / capacity) * 100)) : null;

  return (
    <div className="group bg-white dark:bg-navy-card rounded-3xl overflow-hidden border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col hover:-translate-y-1">
      {/* Banner Image Container */}
      <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
        <img
          src={event.bannerUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800'}
          alt={event.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-black/20" />

        {/* Top Floating Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
          <span 
            className="px-3 py-1 rounded-full text-xs font-bold text-white shadow-md backdrop-blur-md"
            style={{ backgroundColor: event.categoryColor || '#1E40AF' }}
          >
            {event.categoryName || 'Event'}
          </span>

          <div className="flex items-center gap-2">
            {/* Format Pill */}
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold text-slate-900 bg-white/90 backdrop-blur-md shadow-xs flex items-center gap-1">
              {event.format === 'ONLINE' ? (
                <>
                  <Globe className="w-3 h-3 text-turquoise" /> Online
                </>
              ) : event.format === 'HYBRID' ? (
                <>
                  <Sparkles className="w-3 h-3 text-teal" /> Hybrid
                </>
              ) : (
                <>
                  <MapPin className="w-3 h-3 text-royal" /> Campus
                </>
              )}
            </span>

            {/* Bookmark button */}
            {currentUser && (
              <button
                onClick={handleBookmarkToggle}
                className={`p-2 rounded-full backdrop-blur-md transition-colors shadow-xs ${
                  isBookmarked 
                    ? 'bg-rose-500 text-white' 
                    : 'bg-white/80 hover:bg-white text-slate-700'
                }`}
                title={isBookmarked ? 'Remove bookmark' : 'Save event'}
              >
                <BookmarkIcon className="w-3.5 h-3.5 fill-current" />
              </button>
            )}
          </div>
        </div>

        {/* Bottom Floating Status on Banner */}
        <div className="absolute bottom-3 left-3">
          {isCancelled ? (
            <span className="px-2.5 py-1 rounded-lg text-xs font-extrabold bg-rose-600 text-white flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" /> CANCELLED
            </span>
          ) : isHappeningNow ? (
            <span className="px-3 py-1 rounded-lg text-xs font-black bg-emerald-500 text-white flex items-center gap-1.5 animate-pulse shadow-md">
              <span className="w-2 h-2 rounded-full bg-white animate-ping" />
              HAPPENING NOW
            </span>
          ) : isCompleted ? (
            <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-700/90 text-slate-200">
              Concluded
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-royal/90 text-white backdrop-blur-sm">
              Upcoming
            </span>
          )}
        </div>
      </div>

      {/* Event Details Body */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div className="space-y-2.5">
          {/* Date & Time in Africa/Lagos (WAT) */}
          <div className="flex items-center gap-2 text-xs font-semibold text-royal dark:text-turquoise">
            <Calendar className="w-3.5 h-3.5 text-royal dark:text-turquoise shrink-0" />
            <span>
              {new Date(event.startTime).toLocaleDateString('en-GB', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              })}
            </span>
            <span className="text-slate-300 dark:text-slate-600">&bull;</span>
            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>
              {new Date(event.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} WAT
            </span>
          </div>

          {/* Title */}
          <Link to={`/events/${event.slug}`}>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white group-hover:text-royal dark:group-hover:text-turquoise transition-colors line-clamp-2 leading-snug">
              {event.title}
            </h3>
          </Link>

          {/* Description snippet */}
          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
            {event.description}
          </p>

          {/* Venue & Location Snippet */}
          <div className="pt-1 flex items-start gap-1.5 text-xs text-slate-600 dark:text-slate-300 font-medium">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
            <span className="line-clamp-1">
              {event.venueName || (event.format === 'ONLINE' ? 'Virtual Meeting Room' : 'NSUK Main Campus')}
              {event.buildingHall ? ` &bull; ${event.buildingHall}` : ''}
            </span>
          </div>
        </div>

        {/* Capacity Meter & Footer Action */}
        <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
          {capacity ? (
            <div>
              <div className="flex justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                <span>
                  {isSoldOut ? (
                    <strong className="text-rose-600 dark:text-rose-400">Full Capacity</strong>
                  ) : (
                    <span>{capacity - registered} seats remaining</span>
                  )}
                </span>
                <span>{percentageFilled}% Booked</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isSoldOut 
                      ? 'bg-rose-500' 
                      : (percentageFilled || 0) > 80 
                      ? 'bg-amber-500' 
                      : 'bg-teal'
                  }`}
                  style={{ width: `${percentageFilled}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              <Users className="w-3.5 h-3.5" /> Open Seating / University Wide
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              By <strong className="text-slate-700 dark:text-slate-300">{event.organizerName.split(' ')[0]}</strong>
            </span>
            <Link
              to={`/events/${event.slug}`}
              className="inline-flex items-center gap-1 text-xs font-bold text-royal dark:text-turquoise hover:text-royal-hover dark:hover:text-cyan-300 group-hover:translate-x-0.5 transition-transform"
            >
              <span>View Details</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
export default EventCard;
