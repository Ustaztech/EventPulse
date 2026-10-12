import React from 'react';
import { X, Printer, Download, CheckCircle, ShieldCheck, Calendar, MapPin, Clock } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Registration, Event } from '../lib/types';

interface DigitalTicketModalProps {
  registration: Registration;
  event?: Event;
  isOpen: boolean;
  onClose: () => void;
}

export const DigitalTicketModal: React.FC<DigitalTicketModalProps> = ({
  registration,
  event,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const currentEvent = event || registration.event;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100 animate-in zoom-in-95">
        {/* Modal Top Bar */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-turquoise" />
            <span className="text-sm font-bold uppercase tracking-wider">NSUK Digital Event Pass</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Boarding Pass / Ticket Body */}
        <div className="p-6 space-y-6">
          <div className="relative bg-gradient-to-b from-blue-50/70 via-white to-teal-50/30 rounded-3xl border-2 border-dashed border-royal/30 p-6 shadow-sm overflow-hidden">
            {/* Watermark Logo in background */}
            <div className="absolute -right-8 -bottom-8 opacity-5 pointer-events-none">
              <svg width="240" height="240" viewBox="0 0 100 100">
                <rect x="14" y="16" width="72" height="74" rx="20" fill="#1E40AF" />
              </svg>
            </div>

            {/* Header of Pass */}
            <div className="flex items-start justify-between border-b border-slate-200 pb-4">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-royal bg-blue-100/70 px-2.5 py-0.5 rounded-full">
                  Digital Event Pass
                </span>
                <h4 className="font-extrabold text-slate-900 text-lg mt-1.5 leading-snug">
                  {currentEvent?.title || 'Campus Event'}
                </h4>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Organized by {currentEvent?.organizerName || 'Event Organizer'}
                </p>
              </div>
              <div className="text-right shrink-0 ml-3">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Pass Code</span>
                <span className="text-base font-black font-mono text-royal">
                  {registration.referenceCode}
                </span>
              </div>
            </div>

            {/* Attendee Details */}
            <div className="py-4 grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 font-bold uppercase text-[10px]">Attendee Name</span>
                <p className="font-bold text-slate-900 text-sm mt-0.5">{registration.userName}</p>
                <p className="text-slate-500">{registration.userEmail}</p>
              </div>
              <div>
                <span className="text-slate-400 font-bold uppercase text-[10px]">Status</span>
                <div className="mt-0.5">
                  {registration.status === 'ATTENDED' ? (
                    <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-100 font-extrabold px-2 py-0.5 rounded-md text-[11px]">
                      <CheckCircle className="w-3 h-3" /> Attended
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-royal bg-blue-100 font-extrabold px-2 py-0.5 rounded-md text-[11px]">
                      <CheckCircle className="w-3 h-3" /> Confirmed
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Event Time & Venue */}
            <div className="bg-white/80 p-3.5 rounded-2xl border border-slate-200/80 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-slate-700 font-medium">
                <Calendar className="w-4 h-4 text-royal shrink-0" />
                <span>
                  {currentEvent ? new Date(currentEvent.startTime).toLocaleDateString('en-GB', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  }) : 'Event Date'}
                </span>
                <span className="text-slate-300">&bull;</span>
                <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                <span>
                  {currentEvent ? new Date(currentEvent.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''} WAT
                </span>
              </div>
              <div className="flex items-start gap-2 text-slate-700 font-medium">
                <MapPin className="w-4 h-4 text-teal shrink-0 mt-0.5" />
                <span>
                  {currentEvent?.venueName || 'Virtual Event Room'} &bull; {currentEvent?.campusArea || 'Main Campus'}
                </span>
              </div>
            </div>

            {/* QR Code Validation Area */}
            <div className="pt-5 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200/80 mt-4">
              <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
                <QRCodeSVG
                  value={`EVENTPULSE:${registration.referenceCode}:${registration.userId}:${currentEvent?.id}`}
                  size={100}
                  level="H"
                  includeMargin={false}
                />
              </div>
              <div className="text-center sm:text-left text-xs text-slate-500 space-y-1">
                <p className="font-bold text-slate-800">Scan at Entrance</p>
                <p className="text-[11px] leading-relaxed">
                  Hold this QR code or show reference <strong>{registration.referenceCode}</strong> at the venue entrance scanner.
                </p>
                <p className="text-[10px] text-slate-400">
                  Registered: {new Date(registration.registeredAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between gap-3 pt-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Print Pass</span>
            </button>
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-royal hover:bg-royal-hover shadow-md transition-all"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default DigitalTicketModal;
