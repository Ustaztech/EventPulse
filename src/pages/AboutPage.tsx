import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, ShieldCheck, Mail, Users, Calendar, Award, ArrowRight } from 'lucide-react';
import { BrandLogo } from '../components/BrandLogo';
import { NSUK_CAMPUSES } from '../lib/nsuk-data';

export const AboutPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16 pb-20">
      {/* Hero */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <BrandLogo size="lg" className="justify-center mb-2" />
        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
          About EventPulse NSUK
        </h1>
        <p className="text-base text-slate-600 leading-relaxed">
          The official Campus Event Management and Notification System for Nasarawa State University, Keffi.
          Bridging students, faculty members, university organizers, and research hubs across all four campuses.
        </p>
      </div>

      {/* Institutional Mission */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white p-8 rounded-3xl border border-slate-200/90 shadow-sm space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-100 text-royal flex items-center justify-center font-bold">
            <Calendar className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Unified Event Directory</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Eliminates fragmented bulletin board flyers by gathering academic symposiums, guest lectures, sports galas, and student association programs in one centralized repository.
          </p>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-200/90 shadow-sm space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal flex items-center justify-center font-bold">
            <Mail className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Durable Notification Outbox</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Automated background scheduler dispatches timely confirmations, 24-hour departure alerts, 1-hour reminders, and venue change alerts even when users are away from the app.
          </p>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-200/90 shadow-sm space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-turquoise/20 text-navy flex items-center justify-center font-bold">
            <MapPin className="w-6 h-6 text-turquoise" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Verified Geographic Maps</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Every physical hall, faculty theatre, and conference room is linked to verified GPS coordinates and landmark guides, helping attendees navigate the campus without confusion.
          </p>
        </div>
      </div>

      {/* University Campuses */}
      <div className="bg-slate-50 p-8 sm:p-12 rounded-3xl border border-slate-200 space-y-6">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-black text-slate-900">Covering All NSUK Campuses</h2>
          <p className="text-xs text-slate-600 mt-1">
            Nasarawa State University operates across multiple campus facilities throughout Nasarawa State and the FCT:
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {NSUK_CAMPUSES.map((c) => (
            <div key={c.id} className="bg-white p-5 rounded-2xl border border-slate-200 space-y-1">
              <span className="text-[10px] font-mono font-bold text-royal uppercase">{c.code}</span>
              <h4 className="font-bold text-slate-900 text-sm">{c.name}</h4>
              <p className="text-xs text-slate-500">NSUK Network Node</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
export default AboutPage;
