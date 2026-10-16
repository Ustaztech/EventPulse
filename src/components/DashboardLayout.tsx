import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Compass, 
  Ticket, 
  Bookmark, 
  Bell, 
  User as UserIcon, 
  Search,
  Menu, 
  X, 
  LogOut, 
  Shield, 
  Briefcase, 
  GraduationCap
} from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { ThemeToggle } from '../lib/ThemeContext';

export interface DashboardNavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number | string;
  badgeVariant?: 'amber' | 'emerald' | 'rose' | 'teal' | 'royal' | 'purple' | 'default';
}

interface DashboardLayoutProps {
  title: string;
  subtitle: string;
  dateSubtitle?: string;
  badgeText?: string;
  badgeColor?: 'royal' | 'teal' | 'amber' | 'emerald' | 'purple';
  activeTab: string;
  onTabChange: (tabId: string) => void;
  navItems: DashboardNavItem[];
  quickStats?: { label: string; value: number | string }[];
  headerActions?: React.ReactNode;
  headerRightAction?: React.ReactNode;
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  title,
  subtitle,
  dateSubtitle,
  activeTab,
  onTabChange,
  navItems,
  headerActions,
  headerRightAction,
  children,
}) => {
  const { currentUser, unreadCount, logout } = useAuth();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  if (!currentUser) return <>{children}</>;

  // Sidebar content matching Image 2
  const renderSidebarContent = () => (
    <div className="flex flex-col h-full justify-between space-y-6">
      <div className="space-y-6">
        {/* Top Brand Logo matching Image 2 */}
        <div className="flex items-center gap-3 px-2 pt-1">
          <div className="w-10 h-10 rounded-2xl bg-blue-600/10 border border-blue-600/20 p-2 flex items-center justify-center shrink-0">
            <svg viewBox="0 0 100 100" fill="none" className="w-full h-full">
              <rect x="25" y="8" width="9" height="18" rx="4.5" fill="#1D4ED8" />
              <rect x="66" y="8" width="9" height="18" rx="4.5" fill="#1D4ED8" />
              <rect x="14" y="17" width="72" height="72" rx="18" stroke="#1D4ED8" strokeWidth="8" fill="transparent" />
              <path d="M20 54H34L44 28L54 74L65 48L72 54H80" stroke="#0D9488" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="min-w-0">
            <span className="font-black text-xl tracking-tight text-slate-900 dark:text-white block">EventPulse</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-teal-600 dark:text-teal-400 block">NSUK CAMPUS EVENTS</span>
          </div>
        </div>

        {/* Navigation Items matching Image 2 */}
        <nav className="space-y-1.5 pt-2">
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
                className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all text-left ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-light/30'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <Icon className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-blue-700 dark:text-blue-300' : 'text-slate-400 dark:text-slate-400'
                  }`} />
                  <span className="truncate">{item.label}</span>
                </div>

                {item.badge !== undefined && (
                  <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center shrink-0">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Role switching if applicable */}
        {(currentUser.role === 'ADMIN' || currentUser.role === 'ORGANIZER') && (
          <div className="pt-2 border-t border-slate-100 dark:border-navy-light/30 space-y-1 text-xs">
            <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Workspaces</span>
            {currentUser.role === 'ADMIN' && (
              <Link
                to="/dashboard/admin"
                className="flex items-center gap-2.5 px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-light/30 font-medium"
              >
                <Shield className="w-4 h-4 text-purple-600" />
                <span>Admin Console</span>
              </Link>
            )}
            <Link
              to="/dashboard/organizer"
              className="flex items-center gap-2.5 px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-light/30 font-medium"
            >
              <Briefcase className="w-4 h-4 text-teal-600" />
              <span>Organizer Workspace</span>
            </Link>
          </div>
        )}
      </div>

      {/* Bottom NSUK Campus Brand Card matching Image 2 */}
      <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-navy-light/30">
        <div className="rounded-2xl overflow-hidden border border-slate-200/80 dark:border-navy-light/40 bg-slate-50 dark:bg-navy-light/20 p-3 space-y-2.5">
          <div className="h-20 w-full rounded-xl overflow-hidden relative">
            <img 
              src="/assets/nsuk_gate.jpg" 
              alt="Nasarawa State University, Keffi" 
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h4 className="font-bold text-xs text-slate-900 dark:text-white">
              Nasarawa State University, Keffi
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Events. People. A Brighter Campus.
            </p>
            <div className="w-6 h-1 bg-teal-500 rounded-full mt-2" />
          </div>
        </div>

        {/* Theme and Logout Controls */}
        <div className="flex items-center justify-between px-2 pt-1">
          <ThemeToggle />
          <button
            onClick={() => {
              logout();
              navigate('/');
            }}
            className="flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 dark:text-rose-400 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-navy-dark transition-colors pb-16">
      
      {/* Mobile Top Header */}
      <div className="lg:hidden sticky top-[65px] z-40 bg-white dark:bg-[#111A33] border-b border-slate-200 dark:border-navy-light/40 px-4 py-3 flex items-center justify-between shadow-xs">
        <button
          type="button"
          onClick={() => setMobileSidebarOpen(true)}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-navy-light/60 bg-white dark:bg-[#0B132B] text-xs font-bold text-slate-700 dark:text-slate-200"
        >
          <Menu className="w-4 h-4 text-blue-600" />
          <span>Menu</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-800 dark:text-white truncate max-w-[140px]">
            {currentUser.name}
          </span>
        </div>
      </div>

      {/* Mobile Horizontal Quick-Tab Navigation Strip */}
      <div className="lg:hidden sticky top-[114px] z-30 bg-white/95 dark:bg-[#111A33]/95 backdrop-blur-md border-b border-slate-200/80 dark:border-navy-light/40 px-3 py-2 overflow-x-auto shadow-xs">
        <div className="flex items-center gap-1.5 min-w-max">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-navy-light/30 text-slate-700 dark:text-slate-300'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-rose-500 text-white">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileSidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs animate-in fade-in"
          onClick={() => setMobileSidebarOpen(false)}
        >
          <div 
            className="w-80 max-w-[85vw] h-full bg-white dark:bg-[#111A33] p-6 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-navy-light/30 mb-4">
              <span className="font-bold text-xs uppercase tracking-wider text-slate-400">
                Menu
              </span>
              <button
                type="button"
                onClick={() => setMobileSidebarOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-navy-light/40"
              >
                <X className="w-5 h-5 text-slate-600 dark:text-slate-300" />
              </button>
            </div>
            {renderSidebarContent()}
          </div>
        </div>
      )}

      {/* Main Dual-Column Layout Matching Image 2 */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          
          {/* Desktop Left Sidebar Column (3 cols out of 12) - White card matching Image 2 */}
          <aside className="hidden lg:block lg:col-span-3 sticky top-24">
            <div className="bg-white dark:bg-[#111A33] rounded-3xl border border-slate-200/80 dark:border-navy-light/40 p-6 shadow-sm">
              {renderSidebarContent()}
            </div>
          </aside>

          {/* Main Dashboard Content Column (9 cols out of 12) */}
          <main className="lg:col-span-9 space-y-6 min-w-0">
            
            {/* Top Bar matching Image 2 */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  {title}
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  {subtitle}
                </p>
              </div>

              {/* Right Side Header Tools: Date & Search input matching Image 2 */}
              <div className="flex items-center flex-wrap sm:flex-nowrap gap-3 shrink-0">
                {dateSubtitle && (
                  <div className="text-right hidden md:block">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200 block">
                      {dateSubtitle}
                    </span>
                  </div>
                )}
                {headerRightAction}
                {headerActions}
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
