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
  Mail,
  Home
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
  const location = useLocation();
  const navigate = useNavigate();

  if (!currentUser) return <>{children}</>;

  const getRoleBadgeClasses = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-500/20 text-purple-200 border-purple-400/30';
      case 'ORGANIZER':
        return 'bg-teal-500/20 text-teal-200 border-teal-400/30';
      case 'STAFF':
        return 'bg-blue-500/20 text-blue-200 border-blue-400/30';
      default:
        return 'bg-white/10 text-white border-white/20';
    }
  };

  const getBadgeVariantClasses = (variant: string = 'default') => {
    switch (variant) {
      case 'amber':
        return 'bg-amber-400/20 text-amber-200';
      case 'emerald':
        return 'bg-emerald-400/20 text-emerald-200';
      case 'rose':
        return 'bg-rose-400/20 text-rose-200';
      case 'teal':
        return 'bg-teal-400/20 text-teal-200';
      case 'royal':
        return 'bg-blue-400/20 text-blue-200';
      default:
        return 'bg-white/15 text-white';
    }
  };

  // Reusable Sidebar content matching Image 2
  const renderSidebarContent = () => (
    <div className="flex flex-col h-full justify-between text-white space-y-6">
      <div className="space-y-6">
        {/* Top Brand Logo matching Image 2 */}
        <div className="flex items-center gap-3 px-2 pt-1">
          <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 p-2 flex items-center justify-center shrink-0">
            <svg viewBox="0 0 100 100" fill="none" className="w-full h-full">
              <rect x="25" y="8" width="9" height="18" rx="4.5" fill="#FFFFFF" />
              <rect x="66" y="8" width="9" height="18" rx="4.5" fill="#FFFFFF" />
              <rect x="14" y="17" width="72" height="72" rx="18" stroke="#FFFFFF" strokeWidth="8" fill="transparent" />
              <path d="M20 54H34L44 28L54 74L65 48L72 54H80" stroke="#2DD4BF" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="min-w-0">
            <span className="font-black text-lg tracking-tight text-white block">EventPulse</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-teal-300 block">Campus Events</span>
          </div>
        </div>

        {/* User Mini Profile */}
        <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 space-y-2">
          <div className="flex items-center gap-2.5">
            <img
              src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
              alt={currentUser.name}
              className="w-10 h-10 rounded-xl object-cover ring-2 ring-white/30 shrink-0"
            />
            <div className="min-w-0 flex-1">
              <h4 className="font-bold text-white text-xs truncate">
                {currentUser.name}
              </h4>
              <p className="text-[11px] text-blue-200/90 truncate">
                {currentUser.email}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-white/10 text-[10px]">
            <span className={`px-2 py-0.5 rounded-full font-black uppercase border ${getRoleBadgeClasses(currentUser.role)}`}>
              {currentUser.role}
            </span>
            <span className="font-mono text-blue-200 font-semibold truncate max-w-[120px]">
              {currentUser.matricOrStaffId || 'Campus ID'}
            </span>
          </div>
        </div>

        {/* Dashboard Navigation Tabs */}
        <div className="space-y-1">
          <div className="px-2 text-[10px] font-black uppercase tracking-wider text-blue-300/80 mb-1">
            Menu
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
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left group ${
                    isActive
                      ? 'bg-white/20 text-white shadow-xs ring-1 ring-white/25'
                      : 'text-blue-100 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                      isActive ? 'text-teal-300' : 'text-blue-200'
                    }`} />
                    <span className="truncate">{item.label}</span>
                  </div>

                  {item.badge !== undefined && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 ${
                      isActive ? 'bg-white/25 text-white' : getBadgeVariantClasses(item.badgeVariant)
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Workspace Hub Switching */}
        {(currentUser.role === 'ADMIN' || currentUser.role === 'ORGANIZER') && (
          <div className="space-y-1 pt-2">
            <div className="px-2 text-[10px] font-black uppercase tracking-wider text-blue-300/80 mb-1">
              Switch Workspace
            </div>
            <div className="space-y-1 text-xs font-semibold">
              {currentUser.role === 'ADMIN' && (
                <Link
                  to="/dashboard/admin"
                  onClick={() => setMobileSidebarOpen(false)}
                  className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl transition-all ${
                    location.pathname === '/dashboard/admin'
                      ? 'bg-white/20 text-white font-bold'
                      : 'text-blue-100 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Shield className="w-4 h-4 text-purple-300 shrink-0" />
                  <span>Admin Console</span>
                </Link>
              )}

              <Link
                to="/dashboard/organizer"
                onClick={() => setMobileSidebarOpen(false)}
                className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl transition-all ${
                  location.pathname === '/dashboard/organizer'
                    ? 'bg-white/20 text-white font-bold'
                    : 'text-blue-100 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Briefcase className="w-4 h-4 text-teal-300 shrink-0" />
                <span>Organizer Workspace</span>
              </Link>

              <Link
                to="/dashboard/student"
                onClick={() => setMobileSidebarOpen(false)}
                className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl transition-all ${
                  location.pathname === '/dashboard/student'
                    ? 'bg-white/20 text-white font-bold'
                    : 'text-blue-100 hover:bg-white/10 hover:text-white'
                }`}
              >
                <GraduationCap className="w-4 h-4 text-blue-300 shrink-0" />
                <span>Student / Staff Hub</span>
              </Link>
            </div>
          </div>
        )}

        {/* Campus Shortcuts */}
        <div className="space-y-1 pt-2">
          <div className="px-2 text-[10px] font-black uppercase tracking-wider text-blue-300/80 mb-1">
            Shortcuts
          </div>
          <div className="space-y-1 text-xs font-semibold">
            <Link
              to="/explore"
              onClick={() => setMobileSidebarOpen(false)}
              className="flex items-center justify-between px-3.5 py-2 rounded-xl text-blue-100 hover:bg-white/10 hover:text-white transition-all"
            >
              <div className="flex items-center gap-2.5">
                <Compass className="w-4 h-4 text-blue-300 shrink-0" />
                <span>Browse All Events</span>
              </div>
              <ExternalLink className="w-3 h-3 text-blue-300" />
            </Link>

            <Link
              to="/notifications"
              onClick={() => setMobileSidebarOpen(false)}
              className="flex items-center justify-between px-3.5 py-2 rounded-xl text-blue-100 hover:bg-white/10 hover:text-white transition-all"
            >
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-teal-300 shrink-0" />
                <span>Mailing System</span>
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
              className="flex items-center justify-between px-3.5 py-2 rounded-xl text-blue-100 hover:bg-white/10 hover:text-white transition-all"
            >
              <div className="flex items-center gap-2.5">
                <Settings className="w-4 h-4 text-blue-300 shrink-0" />
                <span>Profile Settings</span>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Sidebar Footer Controls matching Image 2 */}
      <div className="pt-4 border-t border-white/15 space-y-3">
        <div className="flex items-center justify-between px-2">
          <span className="text-[11px] font-bold text-blue-200">Theme</span>
          <ThemeToggle />
        </div>

        <button
          onClick={() => {
            logout();
            navigate('/');
          }}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-rose-300 hover:bg-rose-500/20 border border-rose-400/30 transition-all"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>

        <p className="text-[10px] text-center text-blue-200/60 pt-1">
          EventPulse &bull; Campus Life
        </p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-navy-dark transition-colors pb-16">
      
      {/* Mobile Top Navigation Bar */}
      <div className="lg:hidden sticky top-[65px] z-40 bg-white dark:bg-[#111A33] border-b border-slate-200 dark:border-navy-light/40 px-4 py-3 flex items-center justify-between shadow-xs">
        <button
          type="button"
          onClick={() => setMobileSidebarOpen(true)}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-navy-light/60 bg-white dark:bg-[#0B132B] text-xs font-bold text-slate-700 dark:text-slate-200 shadow-xs"
        >
          <Menu className="w-4 h-4 text-blue-600 dark:text-teal-300" />
          <span>Workspace Menu</span>
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
            className="w-80 max-w-[85vw] h-full bg-[#0B2E81] text-white p-6 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-white/15 mb-4">
              <span className="font-bold text-xs uppercase tracking-wider text-teal-300">
                Workspace Navigation
              </span>
              <button
                type="button"
                onClick={() => setMobileSidebarOpen(false)}
                className="p-1 rounded-lg text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {renderSidebarContent()}
          </div>
        </div>
      )}

      {/* Main Dual-Column Layout matching Image 2 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Desktop Left Sidebar Column matching Image 2 deep blue theme */}
          <aside className="hidden lg:block lg:col-span-3 sticky top-24">
            <div className="bg-[#0B2E81] rounded-3xl border border-blue-900/50 p-6 shadow-xl shadow-blue-950/20">
              {renderSidebarContent()}
            </div>
          </aside>

          {/* Main Dashboard Content Column (9 cols out of 12) */}
          <main className="lg:col-span-9 space-y-6 min-w-0">
            
            {/* Top Workspace Header matching Image 2 */}
            <div className="bg-white dark:bg-[#111A33] rounded-3xl p-6 sm:p-7 border border-slate-200/90 dark:border-navy-light/40 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/40">
                    {badgeText}
                  </span>
                  <span className="text-xs text-slate-400">&bull; EventPulse Campus Hub</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  {title}
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
                  {subtitle}
                </p>
              </div>

              {/* Right Side Header Tools matching Image 2 */}
              <div className="flex items-center gap-3 shrink-0">
                {headerActions}

                {/* Notifications Bell */}
                <Link
                  to="/notifications"
                  aria-label="View notifications"
                  className="relative p-2.5 rounded-xl border border-slate-200 dark:border-navy-light/60 bg-white dark:bg-[#0B132B] text-slate-600 dark:text-slate-300 hover:bg-slate-50 shadow-xs"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-white dark:ring-[#111A33]" />
                  )}
                </Link>

                {/* User Profile Pill matching Image 2 */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-navy-light/60 bg-white dark:bg-[#0B132B] shadow-xs">
                  <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center justify-center shrink-0">
                    {currentUser.name.slice(0, 2).toUpperCase()}
                  </div>
                  <span className="text-xs font-bold text-slate-800 dark:text-white max-w-[100px] truncate">
                    {currentUser.name}
                  </span>
                </div>
              </div>
            </div>

            {/* Injected Content Tabs */}
            <div className="space-y-6">
              {children}
            </div>

          </main>
        </div>
      </div>

    </div>
  );
};
export default DashboardLayout;
