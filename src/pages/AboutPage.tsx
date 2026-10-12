import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, ShieldCheck, Mail, Users, Calendar, Award, ArrowRight, Sparkles, Bell, QrCode } from 'lucide-react';
import { BrandLogo } from '../components/BrandLogo';
import { NSUK_CAMPUSES } from '../lib/nsuk-data';

export const AboutPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16 pb-20">
      {/* Hero */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <BrandLogo size="lg" className="justify-center mb-2" />
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-royal/30 text-royal dark:text-turquoise text-xs font-bold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Campus Event Discovery & Notification Platform</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
          About EventPulse
        </h1>
        <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed">
          EventPulse is an intelligent campus event management system created to solve fragmented bulletin boards, missed departmental symposiums, and paper ticket chaos. Designed for modern higher institutions, featuring Nasarawa State University, Keffi (NSUK) as our flagship implementation case study.
        </p>
      </div>

      {/* Core Platform Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white dark:bg-[#111A33] p-8 rounded-3xl border border-slate-200/90 dark:border-navy-light/40 shadow-sm space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-royal/30 text-royal dark:text-turquoise flex items-center justify-center font-bold">
            <Calendar className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Unified Event Directory</h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Eliminates lost paper flyers by gathering academic defenses, guest lectures, sports championships, and student organization programs in one unified, searchable directory.
          </p>
        </div>

        <div className="bg-white dark:bg-[#111A33] p-8 rounded-3xl border border-slate-200/90 dark:border-navy-light/40 shadow-sm space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-teal-100 dark:bg-teal-950/60 text-teal dark:text-teal-300 flex items-center justify-center font-bold">
            <Mail className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Gmail-Style Smart Mailbox</h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Integrated in-app notification engine with durable email dispatch dispatches instant digital passes, 24h reminders, and urgent organizer broadcasts directly to your dashboard inbox.
          </p>
        </div>

        <div className="bg-white dark:bg-[#111A33] p-8 rounded-3xl border border-slate-200/90 dark:border-navy-light/40 shadow-sm space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-turquoise/20 text-navy flex items-center justify-center font-bold">
            <QrCode className="w-6 h-6 text-turquoise" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Digital Ticket Passes</h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Instant digital ticket generation with verified check-in reference codes, QR scanner entry support, and GPS venue navigation to every campus hall.
          </p>
        </div>
      </div>

      {/* Flagship Case Study: NSUK */}
      <div className="bg-slate-50 dark:bg-[#0B132B] p-8 sm:p-12 rounded-3xl border border-slate-200 dark:border-navy-light/40 space-y-6">
        <div className="max-w-2xl">
          <span className="text-xs font-bold uppercase tracking-wider text-royal dark:text-turquoise block">
            Implementation Case Study
          </span>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            Nasarawa State University, Keffi (NSUK)
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
            EventPulse incorporates the spatial layout, multi-campus facilities, and academic departments of NSUK as a real-world case study for higher education event logistics:
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {NSUK_CAMPUSES.map((c) => (
            <div key={c.id} className="bg-white dark:bg-[#111A33] p-5 rounded-2xl border border-slate-200 dark:border-navy-light/40 space-y-1">
              <span className="text-[10px] font-mono font-bold text-royal dark:text-turquoise uppercase">{c.code}</span>
              <h4 className="font-bold text-slate-900 dark:text-white text-sm">{c.name}</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">Campus Case Study Hub</p>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-slate-200 dark:border-navy-light/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Have questions or interested in deploying EventPulse? Reach out to our team at{' '}
            <strong className="text-slate-700 dark:text-slate-200">support@eventpulse.com.ng</strong>
          </div>
          <Link
            to="/explore"
            className="px-5 py-2.5 rounded-xl bg-royal text-white font-bold text-xs hover:bg-royal-hover transition-colors flex items-center gap-1.5 shrink-0"
          >
            <span>Explore Campus Events</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};
export default AboutPage;
