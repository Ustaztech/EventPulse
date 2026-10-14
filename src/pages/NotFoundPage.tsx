import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, Calendar, Home, LifeBuoy, ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-16 bg-slate-50 dark:bg-navy-dark">
      <div className="max-w-xl w-full text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 mb-6 shadow-sm border border-teal-500/20">
          <Compass className="w-10 h-10 animate-spin-slow" />
        </div>
        
        <span className="px-3 py-1 text-xs font-semibold uppercase tracking-wider text-teal-700 bg-teal-100 dark:bg-teal-900/40 dark:text-teal-300 rounded-full">
          Error 404 • Resource Not Found
        </span>
        
        <h1 className="mt-4 text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Page or Event Not Found
        </h1>
        
        <p className="mt-3 text-slate-600 dark:text-slate-300 text-base leading-relaxed">
          The campus page, event link, or administrative URL you are trying to reach does not exist, has been rescheduled, or was moved.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/explore"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-medium shadow-md transition-all duration-150"
          >
            <Calendar className="w-4 h-4" />
            Discover Campus Events
          </Link>
          <Link
            to="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium transition-all duration-150"
          >
            <Home className="w-4 h-4" />
            Return to Homepage
          </Link>
        </div>

        <div className="mt-10 pt-6 border-t border-slate-200 dark:border-slate-800 flex items-center justify-center gap-6 text-xs text-slate-500 dark:text-slate-400">
          <Link to="/contact" className="inline-flex items-center gap-1 hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
            <LifeBuoy className="w-3.5 h-3.5" />
            Report Issue / Contact Support
          </Link>
          <span>•</span>
          <button 
            onClick={() => window.history.back()} 
            className="inline-flex items-center gap-1 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
