import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Calendar as CalendarIcon, 
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
  Info,
  Loader2,
  Laptop
} from 'lucide-react';
import { db } from '../lib/storage';
import { api } from '../lib/api';
import { Event, EventFeedback } from '../lib/types';
import { useAuth } from '../lib/AuthContext';
import { MapPreviewModal } from '../components/MapPreviewModal';
import { DigitalTicketModal } from '../components/DigitalTicketModal';

export const EventDetailsPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { currentUser, refreshUserData } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mapOpen, setMapOpen] = useState(false);
  const [ticketModalOpen, setTicketModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  
  // Dynamic event and feedback state
  const [eventData, setEventData] = useState<Event | null>(() => {
    return db.getEvents().find(e => e.slug === slug || e.id === slug) || null;
  });
  const [loadingEvent, setLoadingEvent] = useState(!eventData);
  const [serverFeedbacks, setServerFeedbacks] = useState<EventFeedback[]>([]);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  // Feedback state
  const [rating, setRating] = useState(5);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  // Error/Success state
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadEvent() {
      if (!slug) return;
      try {
        const res = await api.getEventBySlug(slug);
        if (res?.event && isMounted) {
          const mapped: Event = {
            id: res.event.id,
            title: res.event.title,
            slug: res.event.slug,
            description: res.event.description,
            bannerUrl: res.event.banner_url,
            categoryId: res.event.category_id,
            categoryName: res.event.category_name,
            categorySlug: res.event.category_slug,
            categoryColor: res.event.category_color,
            organizerId: res.event.organizer_id,
            organizerName: res.event.organizer_name,
            organizerContact: res.event.organizer_contact,
            targetAudience: res.event.target_audience,
            targetFaculty: res.event.target_faculty,
            targetDepartment: res.event.target_department,
            startTime: res.event.start_time,
            endTime: res.event.end_time,
            timezone: res.event.timezone || 'Africa/Lagos',
            format: res.event.format,
            venueName: res.event.venue_name,
            buildingHall: res.event.building_hall,
            roomNumber: res.event.room_number,
            campusArea: res.event.campus_area,
            address: res.event.address,
            landmark: res.event.landmark,
            latitude: res.event.latitude,
            longitude: res.event.longitude,
            directionsUrl: res.event.directions_url,
            onlinePlatform: res.event.online_platform,
            onlineJoinLink: res.event.online_join_link,
            restrictJoinLink: res.event.restrict_join_link === 1,
            requiresRegistration: res.event.requires_registration === 1,
            capacity: res.event.capacity,
            registeredCount: res.event.registered_count || 0,
            registrationDeadline: res.event.registration_deadline,
            accessibilityInfo: res.event.accessibility_info,
            arrivalInstructions: res.event.arrival_instructions,
            status: res.event.status,
            approvalFeedback: res.event.approval_feedback,
            createdAt: res.event.created_at,
            updatedAt: res.event.updated_at,
          };
          setEventData(mapped);

          // Fetch event feedback
          const fbRes = await api.getEventFeedback(res.event.id).catch(() => ({ feedbacks: [] }));
          if (fbRes?.feedbacks && isMounted) {
            setServerFeedbacks(fbRes.feedbacks.map(f => ({
              id: f.id,
              eventId: f.event_id,
              userId: f.user_id,
              userName: f.user_name || 'Attendee',
              rating: f.rating,
              comment: f.comment,
              createdAt: f.created_at,
            })));
          }
        }
      } catch (err: any) {
        console.error('Failed to load event details:', err);
      } finally {
        if (isMounted) setLoadingEvent(false);
      }
    }

    loadEvent();
    return () => { isMounted = false; };
  }, [slug]);

  const event = eventData || db.getEvents().find(e => e.slug === slug || e.id === slug);

  if (loadingEvent) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-royal mx-auto" />
        <p className="text-slate-500 text-sm">Loading event details...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-2xl font-black text-slate-800 dark:text-white">Event Not Found</h2>
        <p className="text-slate-500 text-sm">The event you are looking for does not exist or may have been unlisted.</p>
        <Link to="/explore" className="px-6 py-2.5 rounded-xl bg-royal text-white font-bold text-sm inline-block">
          Explore Campus Events
        </Link>
      </div>
    );
  }

  const start = new Date(event.startTime);
  const end = new Date(event.endTime);
  const now = new Date();
  const isHappeningNow = now >= start && now <= end;
  const isCompleted = now > end;
  const isCancelled = event.status === 'CANCELLED';

  const userRegistrations = currentUser ? db.getUserRegistrations(currentUser.id) : [];
  const currentRegistration = userRegistrations.find(r => r.eventId === event.id && r.status === 'CONFIRMED');
  const isRegistered = !!currentRegistration;

  const isBookmarked = currentUser 
    ? db.getBookmarks(currentUser.id).some(b => b.eventId === event.id) 
    : false;

  const capacity = event.capacity || 100;
  const registered = event.registeredCount || 42;
  const isFull = capacity ? registered >= capacity : false;
  const percentReserved = Math.min(100, Math.round((registered / capacity) * 100));

  const isDeadlinePassed = event.registrationDeadline 
    ? new Date(event.registrationDeadline) < now 
    : false;

  const handleRegister = async () => {
    if (!currentUser) {
      navigate(`/auth/login?redirect=${encodeURIComponent(location.pathname)}`);
      return;
    }

    setActionError(null);
    setIsRegistering(true);

    try {
      const res = await api.registerForEvent(event.id);
      if (res?.success) {
        refreshUserData();
        setTicketModalOpen(true);
      } else {
        setActionError((res as any)?.error || 'Registration failed. Please try again.');
      }
    } catch (err: any) {
      setActionError(err?.message || 'Failed to complete registration.');
    } finally {
      setIsRegistering(false);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleBookmark = () => {
    if (!currentUser) {
      navigate(`/auth/login?redirect=${encodeURIComponent(location.pathname)}`);
      return;
    }
    db.toggleBookmark(event.id, currentUser.id);
    refreshUserData();
  };

  // Formatted date string in WAT: e.g. "28 October 2026"
  const formattedDayMonthYear = start.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  // Formatted time string in WAT: e.g. "10:00 AM WAT"
  const formattedTimeWAT = start.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }) + ' WAT';

  return (
    <div className="bg-slate-50 dark:bg-[#070D1E] min-h-screen">
      
      {/* =========================================================================
          MOBILE SCREEN VIEW (MATCHING IMAGE 5 EXACTLY)
          Visible on small screens (< 768px: md:hidden)
          ========================================================================= */}
      <div className="md:hidden flex flex-col min-h-screen pb-24">
        {/* Full-width Hero Banner Image */}
        <div className="relative w-full aspect-[4/3] bg-slate-900 overflow-hidden">
          <img
            src={event.bannerUrl || 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=1200'}
            alt={event.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20" />

          {/* Floating Back Button Top Left */}
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="Go back"
            className="w-10 h-10 rounded-full bg-white text-slate-900 shadow-xl flex items-center justify-center absolute top-4 left-4 z-20 hover:bg-slate-100 transition-transform active:scale-95"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Floating Bookmark Button Top Right */}
          <button
            type="button"
            onClick={handleBookmark}
            aria-label="Bookmark event"
            className="w-10 h-10 rounded-full bg-white text-slate-900 shadow-xl flex items-center justify-center absolute top-4 right-4 z-20 hover:bg-slate-100 transition-transform active:scale-95"
          >
            <BookmarkIcon className={`w-5 h-5 ${isBookmarked ? 'fill-[#0B2E81] text-[#0B2E81]' : ''}`} />
          </button>
        </div>

        {/* Overlapping Bottom Sheet Card */}
        <div className="-mt-6 rounded-t-3xl bg-white dark:bg-[#111A33] px-5 pt-6 pb-6 shadow-2xl relative z-10 space-y-5 flex-1">
          {/* Category Pill with Icon */}
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-300 font-bold text-xs tracking-wide">
              <Laptop className="w-3.5 h-3.5" />
              <span>{event.categoryName || 'Technology'}</span>
            </span>
          </div>

          {/* Large Bold Event Title */}
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
            {event.title}
          </h1>

          {/* 3 Rounded Metadata Rows Matching Image 5 */}
          <div className="space-y-3 pt-1">
            {/* Row 1: Calendar Date & Time */}
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-slate-100 dark:bg-[#0B132B] flex items-center justify-center text-slate-700 dark:text-slate-300 shrink-0">
                <CalendarIcon className="w-5 h-5 text-slate-700 dark:text-slate-300" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  {formattedDayMonthYear}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {formattedTimeWAT}
                </p>
              </div>
            </div>

            {/* Row 2: Location & Venue */}
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-slate-100 dark:bg-[#0B132B] flex items-center justify-center text-slate-700 dark:text-slate-300 shrink-0">
                <MapPin className="w-5 h-5 text-slate-700 dark:text-slate-300" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  {event.venueName || 'Main Campus, Keffi'}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {event.campusArea || 'Nasarawa State University, Keffi (NSUK)'}
                </p>
              </div>
            </div>

            {/* Row 3: Organiser */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-slate-100 dark:bg-[#0B132B] flex items-center justify-center text-slate-700 dark:text-slate-300 shrink-0">
                  <Users className="w-5 h-5 text-slate-700 dark:text-slate-300" />
                </div>
                <div>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Organised by
                  </p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    {event.organizerName || 'Computing Society'}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>
          </div>

          {/* About this event Section */}
          <div className="pt-3 space-y-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              About this event
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
              {event.description}
            </p>
          </div>

          {/* Capacity Progress Box Matching Image 5 */}
          <div className="bg-slate-50 dark:bg-[#0B132B] border border-slate-200/70 dark:border-navy-light/40 rounded-2xl p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-600 flex items-center justify-center shrink-0">
                  <Users className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {registered} of {capacity} places reserved
                </span>
              </div>
              <span className="text-xs font-bold text-teal-600 font-mono">
                {percentReserved}%
              </span>
            </div>

            {/* Horizontal Teal Progress Bar */}
            <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
              <div 
                className="h-full rounded-full bg-teal-500 transition-all duration-500"
                style={{ width: `${percentReserved}%` }}
              />
            </div>
          </div>
        </div>

        {/* Fixed Sticky Bottom Register Button on Mobile Matching Image 5 */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 dark:bg-[#111A33]/95 backdrop-blur-md border-t border-slate-100 dark:border-navy-light/40 z-30">
          {isRegistered ? (
            <button
              onClick={() => setTicketModalOpen(true)}
              className="w-full py-3.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-xl flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Pass Confirmed &bull; View Ticket</span>
            </button>
          ) : (
            <button
              onClick={handleRegister}
              disabled={isRegistering || isFull}
              className="w-full py-3.5 px-6 rounded-xl bg-[#0B2E81] hover:bg-blue-900 text-white font-bold text-sm shadow-xl shadow-blue-900/20 flex items-center justify-center gap-2 transition-all disabled:opacity-60"
            >
              <span>{isRegistering ? 'Securing seat...' : isFull ? 'Capacity Full' : 'Register for free'}</span>
              <ArrowLeft className="w-4 h-4 rotate-180" />
            </button>
          )}
        </div>
      </div>


      {/* =========================================================================
          DESKTOP SCREEN VIEW
          Visible on larger screens (>= 768px: hidden md:block)
          ========================================================================= */}
      <div className="hidden md:block max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-20">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <Link to="/" className="hover:text-royal">Home</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link to="/explore" className="hover:text-royal">Events</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-800 dark:text-white truncate max-w-xs">{event.title}</span>
        </div>

        {/* 2-Column Desktop Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column (8 cols) */}
          <div className="lg:col-span-8 space-y-8">
            {/* Banner Container */}
            <div className="relative rounded-3xl overflow-hidden shadow-lg border border-slate-200/90 dark:border-navy-light/40 bg-slate-900 aspect-video max-h-[460px]">
              <img
                src={event.bannerUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200'}
                alt={event.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/30" />

              {/* Badges on Banner */}
              <div className="absolute top-4 left-4 flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold text-white shadow-md bg-[#0B2E81]">
                  {event.categoryName || 'Technology'}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-bold text-slate-900 bg-white/90 shadow-xs">
                  {event.format} Event
                </span>
              </div>
            </div>

            {/* Event Title & Metadata */}
            <div className="space-y-4">
              <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                {event.title}
              </h1>

              {/* Date, Time, Venue quick cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-[#111A33] p-4 rounded-2xl border border-slate-200/80 dark:border-navy-light/40 flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950 text-[#0B2E81] dark:text-turquoise shrink-0">
                    <CalendarIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Date & Schedule
                    </span>
                    <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                      {formattedDayMonthYear}
                    </p>
                    <p className="text-xs text-[#0B2E81] dark:text-turquoise font-semibold mt-0.5">
                      {formattedTimeWAT}
                    </p>
                  </div>
                </div>

                <div className="bg-white dark:bg-[#111A33] p-4 rounded-2xl border border-slate-200/80 dark:border-navy-light/40 flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400 shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Venue & Location
                    </span>
                    <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                      {event.venueName || 'Main Campus, Keffi'}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {event.campusArea || 'Nasarawa State University, Keffi (NSUK)'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Event Description Section */}
            <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-navy-light/40">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">About This Event</h2>
              <div className="prose prose-slate dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-line">
                {event.description}
              </div>
            </div>

            {/* Organizer Card */}
            <div className="bg-white dark:bg-[#111A33] p-6 rounded-3xl border border-slate-200/80 dark:border-navy-light/40 flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#0B2E81] text-white flex items-center justify-center font-black text-lg shadow-sm">
                  {event.organizerName.charAt(0)}
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Organised by
                  </span>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">{event.organizerName}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{event.organizerContact}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMapOpen(true)}
                className="text-xs font-bold text-[#0B2E81] dark:text-turquoise hover:underline flex items-center gap-1"
              >
                <Compass className="w-4 h-4" />
                <span>View Campus GPS & Map</span>
              </button>
            </div>
          </div>

          {/* Right Action Column (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white dark:bg-[#111A33] rounded-3xl p-6 border border-slate-200/90 dark:border-navy-light/40 shadow-xl space-y-6 sticky top-24">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                  Admission
                </span>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-2xl font-black text-slate-900 dark:text-white">
                    Free Registration
                  </span>
                  {isBookmarked && (
                    <span className="text-[11px] font-bold text-[#0B2E81] bg-blue-50 dark:bg-royal/30 px-2.5 py-1 rounded-full">
                      Saved
                    </span>
                  )}
                </div>
              </div>

              {/* Capacity Meter */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-300">
                  <span>Reserved:</span>
                  <strong className="text-slate-900 dark:text-white">{registered} / {capacity} places</strong>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-teal-500 transition-all duration-500"
                    style={{ width: `${percentReserved}%` }}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                {isRegistered ? (
                  <button
                    onClick={() => setTicketModalOpen(true)}
                    className="w-full py-3.5 rounded-xl font-bold text-sm bg-emerald-600 hover:bg-emerald-700 text-white shadow-md flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Pass Confirmed &bull; View Ticket</span>
                  </button>
                ) : (
                  <button
                    onClick={handleRegister}
                    disabled={isRegistering || isFull}
                    className="w-full py-3.5 rounded-xl font-bold text-sm bg-[#0B2E81] hover:bg-blue-900 text-white shadow-lg shadow-blue-900/20 transition-all flex items-center justify-center gap-2 disabled:opacity-75"
                  >
                    <span>{isRegistering ? 'Securing seat...' : isFull ? 'Capacity Full' : 'Register for free'}</span>
                    <ArrowLeft className="w-4 h-4 rotate-180" />
                  </button>
                )}

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={handleBookmark}
                    className={`py-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      isBookmarked 
                        ? 'border-blue-300 text-[#0B2E81] bg-blue-50' 
                        : 'border-slate-200 dark:border-navy-light/60 text-slate-700 dark:text-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <BookmarkIcon className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-current' : ''}`} />
                    <span>{isBookmarked ? 'Saved' : 'Save Event'}</span>
                  </button>

                  <button
                    onClick={handleShare}
                    className="py-2.5 rounded-xl border border-slate-200 dark:border-navy-light/60 text-slate-700 dark:text-slate-200 hover:bg-slate-50 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>{copiedLink ? 'Copied Link!' : 'Share Event'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Map Preview Modal */}
      {mapOpen && (
        <MapPreviewModal
          isOpen={mapOpen}
          onClose={() => setMapOpen(false)}
          event={event}
        />
      )}

      {/* Digital Ticket Modal */}
      {ticketModalOpen && currentRegistration && (
        <DigitalTicketModal
          isOpen={ticketModalOpen}
          onClose={() => setTicketModalOpen(false)}
          registration={currentRegistration}
          event={event}
        />
      )}
    </div>
  );
};

export default EventDetailsPage;
