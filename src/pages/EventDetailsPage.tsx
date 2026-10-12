import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Globe, 
  Users, 
  Share2, 
  Bookmark as BookmarkIcon, 
  CheckCircle, 
  AlertCircle, 
  Compass, 
  ShieldCheck, 
  MessageSquare, 
  Star, 
  ArrowLeft,
  ExternalLink,
  Lock,
  ChevronRight,
  Info
} from 'lucide-react';
import { db } from '../lib/storage';
import { useAuth } from '../lib/AuthContext';
import { MapPreviewModal } from '../components/MapPreviewModal';
import { DigitalTicketModal } from '../components/DigitalTicketModal';

export const EventDetailsPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { currentUser, refreshUserData } = useAuth();
  const navigate = useNavigate();

  const [mapOpen, setMapOpen] = useState(false);
  const [ticketModalOpen, setTicketModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  
  // Feedback state
  const [rating, setRating] = useState(5);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  // Error/Success state
  const [actionError, setActionError] = useState<string | null>(null);

  const event = db.getEvents().find(e => e.slug === slug);

  if (!event) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-2xl font-black text-slate-800">Event Not Found</h2>
        <p className="text-slate-500 text-sm">The requested campus event may have been moved or removed.</p>
        <Link to="/explore" className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-royal text-white font-bold text-sm">
          <ArrowLeft className="w-4 h-4" /> Back to Explore
        </Link>
      </div>
    );
  }

  // Derive dates & status
  const now = new Date();
  const start = new Date(event.startTime);
  const end = new Date(event.endTime);
  const isCancelled = event.status === 'CANCELLED';
  const isHappeningNow = !isCancelled && now >= start && now <= end;
  const isCompleted = !isCancelled && now > end;

  // Check user registration
  const userRegistrations = currentUser ? db.getUserRegistrations(currentUser.id) : [];
  const currentRegistration = userRegistrations.find(r => r.eventId === event.id && r.status !== 'CANCELLED');
  const isRegistered = !!currentRegistration;

  // Bookmark status
  const isBookmarked = currentUser ? db.getBookmarks(currentUser.id).some(b => b.eventId === event.id) : false;

  // Capacity calculation
  const capacity = event.capacity;
  const registered = event.registeredCount || 0;
  const isFull = capacity ? registered >= capacity : false;
  const isDeadlinePassed = event.registrationDeadline ? now > new Date(event.registrationDeadline) : false;

  // Feedbacks
  const feedbacks = db.getEventFeedbacks(event.id);

  const handleRegister = () => {
    if (!currentUser) {
      navigate('/auth/login');
      return;
    }
    setActionError(null);
    const res = db.registerForEvent(event.id, currentUser);
    if (!res.success) {
      setActionError(res.error || 'Failed to register.');
    } else {
      refreshUserData();
      setTicketModalOpen(true);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleBookmark = () => {
    if (!currentUser) {
      navigate('/auth/login');
      return;
    }
    db.toggleBookmark(event.id, currentUser.id);
    refreshUserData();
  };

  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !feedbackText.trim()) return;
    db.addFeedback({
      eventId: event.id,
      userId: currentUser.id,
      userName: currentUser.name,
      rating,
      comment: feedbackText.trim()
    });
    setFeedbackText('');
    setFeedbackSubmitted(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-20">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
        <Link to="/" className="hover:text-royal">Home</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link to="/explore" className="hover:text-royal">Events</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-800 truncate max-w-xs">{event.title}</span>
      </div>

      {/* Main Grid: Left Event Details (8 cols), Right Action Card (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (8 cols) */}
        <div className="lg:col-span-8 space-y-8">
          {/* Banner Container */}
          <div className="relative rounded-3xl overflow-hidden shadow-lg border border-slate-200/90 bg-slate-900 aspect-video max-h-[460px]">
            <img
              src={event.bannerUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200'}
              alt={event.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/30" />

            {/* Badges on Banner */}
            <div className="absolute top-4 left-4 flex items-center gap-2">
              <span
                className="px-3 py-1 rounded-full text-xs font-bold text-white shadow-md backdrop-blur-md"
                style={{ backgroundColor: event.categoryColor || '#1E40AF' }}
              >
                {event.categoryName || 'Event'}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold text-slate-900 bg-white/90 backdrop-blur-md shadow-xs">
                {event.format} Event
              </span>
            </div>

            {/* Status bottom badge */}
            <div className="absolute bottom-4 left-4">
              {isCancelled ? (
                <span className="px-3.5 py-1.5 rounded-xl text-xs font-black bg-rose-600 text-white flex items-center gap-1.5 shadow-md">
                  <AlertCircle className="w-4 h-4" /> EVENT CANCELLED
                </span>
              ) : isHappeningNow ? (
                <span className="px-3.5 py-1.5 rounded-xl text-xs font-black bg-emerald-500 text-white flex items-center gap-2 animate-pulse shadow-md">
                  <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
                  HAPPENING NOW ON CAMPUS
                </span>
              ) : isCompleted ? (
                <span className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300">
                  Event Concluded
                </span>
              ) : (
                <span className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-royal text-white shadow-md">
                  Upcoming Event
                </span>
              )}
            </div>
          </div>

          {/* Event Title & Metadata */}
          <div className="space-y-4">
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
              {event.title}
            </h1>

            {/* Date, Time, Venue quick cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-50 dark:bg-navy-card p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-950 text-royal dark:text-turquoise shrink-0">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Date & Schedule
                  </span>
                  <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                    {start.toLocaleDateString('en-GB', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                  <p className="text-xs text-royal dark:text-turquoise font-semibold mt-0.5">
                    {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – {end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} WAT (UTC+1)
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-navy-card p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-teal-100 dark:bg-teal-950 text-teal dark:text-teal-400 shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Venue & Location
                  </span>
                  <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                    {event.venueName || (event.format === 'ONLINE' ? 'Virtual Meeting' : 'NSUK Main Campus')}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {event.campusArea || 'Main Campus, Keffi'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Event Description Section */}
          <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">About This Event</h2>
            <div className="prose prose-slate max-w-none text-slate-700 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-line">
              {event.description}
            </div>
          </div>

          {/* Location & Directions Detail Card */}
          <div className="bg-white dark:bg-navy-card rounded-3xl p-6 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-royal dark:text-turquoise" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Location & Campus Directions</h3>
              </div>
              <button
                onClick={() => setMapOpen(true)}
                className="text-xs font-bold text-royal dark:text-turquoise hover:underline flex items-center gap-1"
              >
                <span>Interactive Map & GPS</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1 text-slate-600 dark:text-slate-300">
                <p><strong>Building/Hall:</strong> {event.buildingHall || 'Central Hall'}</p>
                <p><strong>Room / Stage:</strong> {event.roomNumber || 'Main Stage / Open Seating'}</p>
                <p><strong>Campus Area:</strong> {event.campusArea || 'Main Campus, Keffi'}</p>
              </div>
              <div className="space-y-1 text-slate-600 dark:text-slate-300">
                <p><strong>Address:</strong> {event.address || 'Along Keffi-Akwanga Expressway, Keffi'}</p>
                {event.landmark && <p className="text-teal font-semibold"><strong>Landmark:</strong> {event.landmark}</p>}
                {event.latitude && event.longitude && (
                  <p className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                    GPS Coordinates: {event.latitude.toFixed(4)}°N, {event.longitude.toFixed(4)}°E
                  </p>
                )}
              </div>
            </div>

            {/* Online Join Link Card (Restricted to registered participants) */}
            {(event.format === 'ONLINE' || event.format === 'HYBRID') && (
              <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-slate-800/80 border border-blue-200/70 dark:border-slate-700 space-y-2 mt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-royal dark:text-turquoise font-bold text-xs">
                    <Globe className="w-4 h-4 text-turquoise" />
                    <span>Virtual Meeting Platform: {event.onlinePlatform || 'Online Room'}</span>
                  </div>
                  {event.restrictJoinLink && !isRegistered && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 rounded flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Registered Attendees Only
                    </span>
                  )}
                </div>

                {event.restrictJoinLink && !isRegistered ? (
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    The online join link will be unlocked immediately after you confirm your registration below.
                  </p>
                ) : (
                  <div className="flex items-center gap-3 pt-1">
                    <a
                      href={event.onlineJoinLink || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-royal text-white hover:bg-royal-hover shadow-xs"
                    >
                      <span>Join Live Meeting Room</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">{event.onlineJoinLink}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Organizer Card */}
          <div className="bg-slate-50 dark:bg-navy-card p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-royal to-teal text-white flex items-center justify-center font-black text-lg shadow-sm">
                {event.organizerName.charAt(0)}
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Event Organizer
                </span>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">{event.organizerName}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">{event.organizerContact}</p>
              </div>
            </div>
            <div className="text-xs text-slate-400 font-medium">
              Target Audience: <strong className="text-slate-700 dark:text-slate-300">{event.targetAudience.replace('_', ' ')}</strong>
            </div>
          </div>

          {/* Community Feedback & Reviews Section */}
          <div className="space-y-4 pt-4 border-t border-slate-200">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-royal" />
              <h3 className="text-lg font-bold text-slate-900">Attendee Feedback & Ratings</h3>
            </div>

            {/* Feedback Submission Form */}
            {currentUser && isRegistered && !feedbackSubmitted && (
              <form onSubmit={handleFeedbackSubmit} className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
                <p className="text-xs font-bold text-slate-700">Submit Your Event Review:</p>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setRating(s)}
                      className={`p-1 ${s <= rating ? 'text-amber-400' : 'text-slate-300'}`}
                    >
                      <Star className="w-5 h-5 fill-current" />
                    </button>
                  ))}
                  <span className="text-xs font-semibold text-slate-500 ml-2">{rating}/5 Stars</span>
                </div>
                <textarea
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="Share your thoughts on the speakers, logistics, venue, or presentation..."
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-royal"
                  rows={2}
                  required
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-royal text-white hover:bg-royal-hover"
                >
                  Submit Feedback
                </button>
              </form>
            )}

            {/* Feedback List */}
            <div className="space-y-3">
              {feedbacks.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No feedback submitted yet for this event.</p>
              ) : (
                feedbacks.map((fb) => (
                  <div key={fb.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-xs">{fb.userName}</span>
                      <div className="flex text-amber-400">
                        {Array.from({ length: fb.rating }).map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-current" />
                        ))}
                      </div>
                    </div>
                    {fb.comment && <p className="text-xs text-slate-600">{fb.comment}</p>}
                    <span className="text-[10px] text-slate-400 block pt-1">
                      {new Date(fb.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Sticky Column: Registration & Action Box (4 cols) */}
        <div className="lg:col-span-4 sticky top-28 space-y-4">
          <div className="bg-white dark:bg-navy-card rounded-3xl p-6 border border-slate-200/90 dark:border-slate-800 shadow-xl space-y-5 transition-colors duration-200">
            {/* Top Seating & Status Indicators */}
            <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                Admission
              </span>
              <div className="flex items-center justify-between mt-1">
                <span className="text-2xl font-black text-slate-900 dark:text-white">
                  {event.requiresRegistration ? 'Free Registration' : 'Open Admission'}
                </span>
                {isBookmarked && (
                  <span className="text-[11px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/40 px-2.5 py-1 rounded-full">
                    Saved
                  </span>
                )}
              </div>
            </div>

            {/* Capacity Meter */}
            {capacity && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-300">
                  <span>Capacity Filled:</span>
                  <strong className="text-slate-900 dark:text-white">{registered} / {capacity} seats</strong>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isFull ? 'bg-rose-500' : 'bg-teal'
                    }`}
                    style={{ width: `${Math.min(100, (registered / capacity) * 100)}%` }}
                  />
                </div>
                {isFull && (
                  <p className="text-xs font-bold text-rose-600 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> Full Seating Capacity Reached
                  </p>
                )}
              </div>
            )}

            {/* Error notice */}
            {actionError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              {isRegistered ? (
                <div className="space-y-2">
                  <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-center text-xs text-emerald-800 font-bold space-y-1">
                    <div className="flex items-center justify-center gap-1 text-emerald-700">
                      <CheckCircle className="w-4 h-4" />
                      <span>Registration Confirmed</span>
                    </div>
                    <p className="font-mono text-emerald-900 text-sm">Pass Ref: {currentRegistration.referenceCode}</p>
                  </div>
                  <button
                    onClick={() => setTicketModalOpen(true)}
                    className="w-full py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-royal to-teal hover:opacity-95 text-white shadow-md flex items-center justify-center gap-2"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>View Digital Pass & QR</span>
                  </button>
                </div>
              ) : isCancelled ? (
                <button
                  disabled
                  className="w-full py-3 rounded-xl font-bold text-sm bg-slate-100 text-slate-400 cursor-not-allowed"
                >
                  Event Cancelled
                </button>
              ) : isCompleted ? (
                <button
                  disabled
                  className="w-full py-3 rounded-xl font-bold text-sm bg-slate-100 text-slate-400 cursor-not-allowed"
                >
                  Registration Closed
                </button>
              ) : isFull ? (
                <button
                  disabled
                  className="w-full py-3 rounded-xl font-bold text-sm bg-slate-100 text-slate-400 cursor-not-allowed"
                >
                  Capacity Reached
                </button>
              ) : isDeadlinePassed ? (
                <button
                  disabled
                  className="w-full py-3 rounded-xl font-bold text-sm bg-slate-100 text-slate-400 cursor-not-allowed"
                >
                  Deadline Passed
                </button>
              ) : (
                <button
                  onClick={handleRegister}
                  className="w-full py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-royal to-teal hover:opacity-95 text-white shadow-lg shadow-royal/20 transition-all flex items-center justify-center gap-2"
                >
                  <span>Register for Event</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}

              {/* Bookmark & Share secondary buttons */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={handleBookmark}
                  className={`py-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    isBookmarked 
                      ? 'border-rose-300 text-rose-600 bg-rose-50' 
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <BookmarkIcon className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-current' : ''}`} />
                  <span>{isBookmarked ? 'Saved' : 'Save Event'}</span>
                </button>

                <button
                  onClick={handleShare}
                  className="py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>{copiedLink ? 'Copied Link!' : 'Share Event'}</span>
                </button>
              </div>
            </div>

            {/* Registration perks */}
            <div className="pt-4 border-t border-slate-100 text-xs text-slate-500 space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-teal shrink-0" />
                <span>Instant email confirmation with reference pass</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-teal shrink-0" />
                <span>Automated 24h & 1h start reminders</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-teal shrink-0" />
                <span>Direct alerts if venue or schedule changes</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Map Modal */}
      <MapPreviewModal
        event={event}
        isOpen={mapOpen}
        onClose={() => setMapOpen(false)}
      />

      {/* Digital Pass Modal */}
      {currentRegistration && (
        <DigitalTicketModal
          registration={currentRegistration}
          event={event}
          isOpen={ticketModalOpen}
          onClose={() => setTicketModalOpen(false)}
        />
      )}
    </div>
  );
};
export default EventDetailsPage;
