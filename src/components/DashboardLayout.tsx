import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Menu, 
  X, 
  ChevronRight, 
  LogOut, 
  Bell, 
  Settings, 
  Calendar, 
  Compass, 
  Shield, 
  Briefcase, 
  GraduationCap, 
  Building,
  User as UserIcon,
  Sparkles,
  ExternalLink,
  ChevronLeft,
  Mail
} from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { ThemeToggle } from '../lib/ThemeContext';
import { BrandLogo } from './BrandLogo';

export interface DashboardNavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  badge?: number | string;
  badgeVariant?: 'default' | 'amber' | 'emerald' | 'rose' | 'royal' | 'teal';
}

interface DashboardLayoutProps {
  title: string;
  subtitle: string;
  badgeText: string;
  badgeColor?: 'royal' | 'teal' | 'purple';
  activeTab: string;
  onTabChange: (tabId: any) => void;
  navItems: DashboardNavItem[];
  quickStats?: Array<{ label: string; value: number | string }>;
  headerActions?: React.ReactNode;
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  title,
  subtitle,
  badgeText,
  badgeColor = 'royal',
  activeTab,
  onTabChange,
  navItems,
  quickStats = [],
  headerActions,
  children,
}) => {
  const { currentUser, unreadCount, logout } = useAuth();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  if (!currentUser) return <>{children}</>;

  const getRoleBadgeClasses = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800/60';
      case 'ORGANIZER':
        return 'bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border-teal-200 dark:border-teal-800/60';
      case 'STAFF':
        return 'bg-blue-100 dark:bg-royal/30 text-royal dark:text-turquoise border-blue-200 dark:border-royal/50';
      default:
        return 'bg-slate-100 dark:bg-navy-light/40 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-navy-light/60';
    }
  };

  const getBadgeVariantClasses = (variant: string = 'default') => {
    switch (variant) {
      case 'amber':
        return 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300';
      case 'emerald':
        return 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300';
      case 'rose':
        return 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300';
      case 'teal':
        return 'bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300';
      case 'royal':
        return 'bg-blue-100 dark:bg-royal/30 text-royal dark:text-turquoise';
      default:
        return 'bg-slate-100 dark:bg-navy-light/60 text-slate-700 dark:text-slate-300';
    }
  };

  const getHeaderBadgeClasses = () => {
    switch (badgeColor) {
      case 'purple':
        return 'bg-purple-400/20 text-purple-200 border-purple-400/30';
      case 'teal':
        return 'bg-teal-400/20 text-teal-200 border-teal-400/30';
      default:
        return 'bg-turquoise/20 text-turquoise border-turquoise/30';
    }
  };

  const getHeaderGradient = () => {
    switch (badgeColor) {
      case 'purple':
        return 'from-navy-dark via-navy to-purple-950';
      case 'teal':
        return 'from-navy via-navy-light to-teal';
      default:
        return 'from-navy via-royal to-teal';
    }
  };

  // Reusable Sidebar content
  const renderSidebarContent = () => (
    <div className="flex flex-col h-full justify-between">
      <div className="space-y-6">
        {/* User Mini Profile Card */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-navy-dark/70 border border-slate-200/80 dark:border-navy-light/40 space-y-3">
          <div className="flex items-center gap-3">
            <img
              src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
              alt={currentUser.name}
              className="w-11 h-11 rounded-xl object-cover ring-2 ring-royal/30 dark:ring-turquoise/30 shadow-xs shrink-0"
            />
            <div className="min-w-0 flex-1">
              <h4 className="font-bold text-slate-900 dark:text-white text-xs truncate">
                {currentUser.name}
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {currentUser.email}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-navy-light/30 text-[10px]">
            <span className={`px-2 py-0.5 rounded-full font-black uppercase border ${getRoleBadgeClasses(currentUser.role)}`}>
              {currentUser.role}
            </span>
            <span className="font-mono text-slate-500 dark:text-slate-400 font-semibold truncate max-w-[120px]">
              {currentUser.matricOrStaffId || 'NSUK ID'}
            </span>
          </div>
        </div>

        {/* Dashboard Navigation Tabs */}
        <div className="space-y-1.5">
          <div className="px-2 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Navigation Menu
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onTabChange(item.id);
                    setMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left group ${
                    isActive
                      ? 'bg-royal text-white shadow-md shadow-royal/20 ring-1 ring-royal'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-light/30 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                      isActive ? 'text-white' : 'text-slate-400 dark:text-slate-400'
                    }`} />
                    <span className="truncate">{item.label}</span>
                  </div>

                  {item.badge !== undefined && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 ${
                      isActive ? 'bg-white/20 text-white' : getBadgeVariantClasses(item.badgeVariant)
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Role Hub Switching (If User has Multi-Role Privileges) */}
        {(currentUser.role === 'ADMIN' || currentUser.role === 'ORGANIZER') && (
          <div className="space-y-1.5 pt-2">
            <div className="px-2 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Workspace Switcher
            </div>
            <div className="space-y-1 text-xs font-semibold">
              {currentUser.role === 'ADMIN' && (
                <Link
                  to="/dashboard/admin"
                  onClick={() => setMobileSidebarOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all ${
                    location.pathname === '/dashboard/admin'
                      ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-900 dark:text-purple-300 font-bold'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-navy-light/20'
                  }`}
                >
                  <Shield className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                  <span>Admin Console</span>
                </Link>
              )}

              <Link
                to="/dashboard/organizer"
                onClick={() => setMobileSidebarOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all ${
                  location.pathname === '/dashboard/organizer'
                    ? 'bg-teal-100 dark:bg-teal-950/60 text-teal-900 dark:text-teal-300 font-bold'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-navy-light/20'
                }`}
              >
                <Briefcase className="w-4 h-4 text-teal shrink-0" />
                <span>Organizer Workspace</span>
              </Link>

              <Link
                to="/dashboard/student"
                onClick={() => setMobileSidebarOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all ${
                  location.pathname === '/dashboard/student'
                    ? 'bg-blue-100 dark:bg-royal/30 text-royal dark:text-turquoise font-bold'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-navy-light/20'
                }`}
              >
                <GraduationCap className="w-4 h-4 text-royal dark:text-turquoise shrink-0" />
                <span>Member Passes & Tickets</span>
              </Link>
            </div>
          </div>
        )}

        {/* General University Shortcuts */}
        <div className="space-y-1.5 pt-2">
          <div className="px-2 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Campus Shortcuts
          </div>
          <div className="space-y-1 text-xs font-semibold">
            <Link
              to="/explore"
              onClick={() => setMobileSidebarOpen(false)}
              className="flex items-center justify-between px-3 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-navy-light/20 transition-all"
            >
              <div className="flex items-center gap-2.5">
                <Compass className="w-4 h-4 text-slate-400 shrink-0" />
                <span>Browse All Events</span>
              </div>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </Link>

            <Link
              to="/explore?view=calendar"
              onClick={() => setMobileSidebarOpen(false)}
              className="flex items-center justify-between px-3 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-navy-light/20 transition-all"
            >
              <div className="flex items-center gap-2.5">
                <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                <span>Academic Calendar</span>
              </div>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </Link>

            <Link
              to="/notifications"
              onClick={() => setMobileSidebarOpen(false)}
              className="flex items-center justify-between px-3 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-navy-light/20 transition-all group"
            >
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-royal dark:text-turquoise shrink-0" />
                <span className="font-bold">Campus Mailbox</span>
              </div>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black animate-pulse">
                  {unreadCount}
                </span>
              )}
            </Link>

            <Link
              to="/profile"
              onClick={() => setMobileSidebarOpen(false)}
              className="flex items-center justify-between px-3 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-navy-light/20 transition-all"
            >
              <div className="flex items-center gap-2.5">
                <Settings className="w-4 h-4 text-slate-400 shrink-0" />
                <span>Profile Preferences</span>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Sidebar Footer Controls */}
      <div className="pt-6 mt-6 border-t border-slate-200 dark:border-navy-light/40 space-y-3">
        <div className="flex items-center justify-between px-2">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Theme Preference</span>
          <ThemeToggle />
        </div>

        <button
          onClick={() => {
            logout();
            navigate('/');
          }}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900/40 transition-all"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out of Portal</span>
        </button>

        <p className="text-[10px] text-center text-slate-400 dark:text-slate-500 pt-1">
          EventPulse &bull; Campus Event Management v1.0.0
        </p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50/70 dark:bg-navy-dark transition-colors pb-16">
      {/* Mobile Top Navigation Bar for Dashboards */}
      <div className="lg:hidden sticky top-[65px] z-40 bg-white/95 dark:bg-[#111A33]/95 backdrop-blur-md border-b border-slate-200/80 dark:border-navy-light/40 px-4 py-3 flex items-center justify-between shadow-xs">
        <button
          type="button"
          onClick={() => setMobileSidebarOpen(true)}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-navy-light/60 bg-white dark:bg-[#0B132B] text-xs font-bold text-slate-700 dark:text-slate-200 shadow-xs"
        >
          <Menu className="w-4 h-4 text-royal dark:text-turquoise" />
          <span>Dashboard Menu</span>
        </button>

        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${getRoleBadgeClasses(currentUser.role)}`}>
            {currentUser.role}
          </span>
          <span className="text-xs font-bold text-slate-800 dark:text-white truncate max-w-[140px]">
            {currentUser.name}
          </span>
        </div>
      </div>

      {/* Mobile Drawer Backdrop */}
      {mobileSidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs animate-in fade-in"
          onClick={() => setMobileSidebarOpen(false)}
        >
          <div 
            className="w-80 max-w-[85vw] h-full bg-white dark:bg-[#111A33] border-r border-slate-200 dark:border-navy-light/40 p-5 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-navy-light/40 mb-4">
              <span className="font-bold text-xs uppercase tracking-wider text-royal dark:text-turquoise">
                Dashboard Navigation
              </span>
              <button
                type="button"
                onClick={() => setMobileSidebarOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {renderSidebarContent()}
          </div>
        </div>
      )}

      {/* Main Container Dual-Column Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Desktop Left Sidebar Column (3 cols out of 12) */}
          <aside className="hidden lg:block lg:col-span-3 sticky top-24">
            <div className="bg-white dark:bg-[#111A33] rounded-3xl border border-slate-200/90 dark:border-navy-light/40 p-5 shadow-xl shadow-slate-200/40 dark:shadow-none">
              {renderSidebarContent()}
            </div>
          </aside>

          {/* Main Dashboard Content Column (9 cols out of 12) */}
          <main className="lg:col-span-9 space-y-6 min-w-0">
            {/* Top Institutional Banner */}
            <div className={`bg-gradient-to-r ${getHeaderGradient()} rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden`}>
              {/* Ambient Glows */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-turquoise/15 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal/15 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${getHeaderBadgeClasses()}`}>
                    {badgeText}
                  </span>
                  <span className="text-xs text-slate-300">EventPulse Campus Hub</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                  {title}
                </h1>
                <p className="text-xs text-slate-300 max-w-xl font-light leading-relaxed">
                  {subtitle}
                </p>
              </div>

              {/* Quick Numbers / Stat Chips */}
              {quickStats.length > 0 && (
                <div className="relative z-10 grid grid-cols-2 sm:grid-cols-3 gap-2.5 shrink-0">
                  {quickStats.map((stat, idx) => (
                    <div 
                      key={idx}
                      className="bg-white/10 backdrop-blur-md px-3.5 py-2.5 rounded-2xl border border-white/20 text-center min-w-[85px]"
                    >
                      <span className="text-lg font-black block leading-none">{stat.value}</span>
                      <span className="text-[10px] text-slate-200 uppercase font-semibold mt-1 block">{stat.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Optional Header Actions */}
            {headerActions && (
              <div className="flex items-center justify-end">
                {headerActions}
              </div>
            )}

            {/* Injected Tab Body Content */}
            <div className="space-y-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};
