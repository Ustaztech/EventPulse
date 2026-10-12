import React from 'react';
import { X, MapPin, Navigation, Compass, AlertCircle, ExternalLink } from 'lucide-react';
import { Event } from '../lib/types';

interface MapPreviewModalProps {
  event: Event;
  isOpen: boolean;
  onClose: () => void;
}

export const MapPreviewModal: React.FC<MapPreviewModalProps> = ({ event, isOpen, onClose }) => {
  if (!isOpen) return null;

  const hasCoords = event.latitude !== undefined && event.longitude !== undefined;
  const directionsUrl = event.directionsUrl || (hasCoords 
    ? `https://www.google.com/maps/dir/?api=1&destination=${event.latitude},${event.longitude}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${event.venueName || 'NSUK'} Nasarawa State University Keffi`)}`
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-100 animate-in zoom-in-95">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-navy to-royal text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-turquoise" />
            <h3 className="text-lg font-bold">Venue & Campus Directions</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Map Simulation Graphic with Pin */}
          <div className="relative h-60 w-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-inner flex items-center justify-center">
            {/* Visual stylised vector campus map background */}
            <svg className="w-full h-full opacity-60" viewBox="0 0 600 300" preserveAspectRatio="none">
              <rect width="600" height="300" fill="#f8fafc" />
              {/* Roads & Pathways */}
              <path d="M0 120 Q 300 180 600 110" stroke="#cbd5e1" strokeWidth="24" fill="none" />
              <path d="M150 0 L 150 300" stroke="#e2e8f0" strokeWidth="16" fill="none" />
              <path d="M420 0 L 420 300" stroke="#e2e8f0" strokeWidth="16" fill="none" />
              <path d="M0 220 L 600 220" stroke="#e2e8f0" strokeWidth="12" fill="none" />
              {/* Greenery / Campus Lawns */}
              <rect x="40" y="30" width="80" height="60" rx="8" fill="#dcfce7" />
              <rect x="180" y="40" width="120" height="70" rx="8" fill="#dcfce7" />
              <rect x="450" y="30" width="100" height="70" rx="8" fill="#dcfce7" />
              <rect x="220" y="190" width="160" height="70" rx="8" fill="#e0f2fe" />
            </svg>

            {/* Central Animated Pin */}
            <div className="absolute flex flex-col items-center animate-bounce">
              <div className="bg-royal text-white p-3 rounded-full shadow-xl ring-4 ring-white">
                <MapPin className="w-6 h-6 fill-current text-turquoise" />
              </div>
              <span className="mt-1 bg-navy text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-md">
                {event.venueName || 'NSUK Venue'}
              </span>
            </div>

            {/* Verified Coordinates Tag */}
            {hasCoords && (
              <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-700 shadow-sm flex items-center gap-1.5 font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Verified: {event.latitude?.toFixed(4)}°N, {event.longitude?.toFixed(4)}°E
              </div>
            )}
          </div>

          {/* Location Information Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Venue Location
              </span>
              <p className="font-bold text-slate-900 text-base">{event.venueName || 'Campus Venue'}</p>
              {event.buildingHall && (
                <p className="text-slate-600 text-xs mt-0.5">
                  Building: <strong>{event.buildingHall}</strong>
                  {event.roomNumber ? ` &bull; Room ${event.roomNumber}` : ''}
                </p>
              )}
              <p className="text-slate-500 text-xs mt-1">Campus: {event.campusArea || 'Main Campus, Keffi'}</p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Landmarks & Address
              </span>
              <p className="text-slate-700 text-xs font-medium">
                {event.address || 'Along Keffi-Akwanga Expressway, Keffi, Nasarawa State'}
              </p>
              {event.landmark && (
                <div className="mt-2 text-xs text-teal-800 bg-teal-50 p-2 rounded-lg border border-teal-200 flex items-center gap-1.5">
                  <Navigation className="w-3.5 h-3.5 text-teal shrink-0" />
                  <span>Landmark: <strong>{event.landmark}</strong></span>
                </div>
              )}
            </div>
          </div>

          {/* Arrival & Accessibility Instructions */}
          {(event.accessibilityInfo || event.arrivalInstructions) && (
            <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200/80 text-xs text-amber-900 space-y-1.5">
              <div className="font-bold flex items-center gap-1.5 text-amber-950">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span>Attendance & Accessibility Instructions</span>
              </div>
              {event.accessibilityInfo && <p>&bull; {event.accessibilityInfo}</p>}
              {event.arrivalInstructions && <p>&bull; {event.arrivalInstructions}</p>}
            </div>
          )}

          {/* Get Directions CTA */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100"
            >
              Close
            </button>
            <a
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-royal to-teal hover:opacity-95 shadow-md transition-all"
            >
              <Navigation className="w-4 h-4" />
              <span>Get Directions on Google Maps</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-70" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
export default MapPreviewModal;
