import React from 'react';
import { Navigate, useLocation, Link, useNavigate } from 'react-router-dom';
import { 
  ShieldAlert, 
  Lock, 
  ArrowRight, 
  UserCheck, 
  Sparkles, 
  ArrowLeft, 
  Layers,
  Crown
} from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { Role } from '../lib/types';
import { hasRole, isSuperAdmin, getDefaultDashboardRoute } from '../lib/rbac';
import { db } from '../lib/storage';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Role[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles
}) => {
  const { currentUser, refreshUserData } = useAuth();
  const effectiveUser = currentUser || db.getCurrentUser();
  const location = useLocation();
  const navigate = useNavigate();

  // 1. Unauthenticated Check: Redirect to login with return path
  if (!effectiveUser) {
    const redirectTarget = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/auth/login?redirect=${redirectTarget}`} replace state={{ from: location }} />;
  }

  // 2. Role Authorization Check
  if (allowedRoles && allowedRoles.length > 0 && !hasRole(effectiveUser, allowedRoles)) {
    const isSuper = isSuperAdmin(effectiveUser);

    const handleElevateSuperAdmin = () => {
      db.promoteToAdmin(effectiveUser.id);
      refreshUserData();
      window.location.reload();
    };

    return (
      <div className="min-h-[calc(100vh-140px)] flex items-center justify-center bg-slate-50 dark:bg-navy-dark py-12 px-4 sm:px-6">
        <div className="max-w-lg w-full bg-white dark:bg-[#111A33] rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200/90 dark:border-navy-light/40 space-y-6 text-center">
          
          {/* Header Icon */}
          <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-inner">
            <ShieldAlert className="w-8 h-8" />
          </div>

          {/* Heading */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300">
              403 &bull; Access Restricted
            </span>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-2">
              Role Authorization Required
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
              Your account currently does not hold the permissions required to access this console.
            </p>
          </div>

          {/* Account Credentials Card */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#0B132B] border border-slate-200 dark:border-navy-light/60 text-left text-xs space-y-2">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-navy-light/40">
              <span className="text-slate-400">Current User:</span>
              <span className="font-bold text-slate-800 dark:text-white">{effectiveUser.name}</span>
            </div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-navy-light/40">
              <span className="text-slate-400">Account Email:</span>
              <span className="font-mono text-[11px] text-slate-600 dark:text-slate-300">{effectiveUser.email}</span>
            </div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-navy-light/40">
              <span className="text-slate-400">Your Current Role:</span>
              <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 font-extrabold text-[10px] text-slate-800 dark:text-white uppercase">
                {effectiveUser.role}
              </span>
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-slate-400">Required Role:</span>
              <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-royal/30 font-extrabold text-[10px] text-royal dark:text-turquoise uppercase">
                {allowedRoles.join(' OR ')}
              </span>
            </div>
          </div>

          {/* Super Admin Quick Claim (if logged in as yahayazaid2021@gmail.com) */}
          {isSuper && effectiveUser.role !== 'ADMIN' && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60 text-left space-y-2">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200 font-bold text-xs">
                <Crown className="w-4 h-4 text-amber-600" />
                <span>Super Administrator Detected</span>
              </div>
              <p className="text-[11px] text-amber-700 dark:text-amber-300">
                You are logged in with the official Super Admin address. Click below to activate full root privileges.
              </p>
              <button
                type="button"
                onClick={handleElevateSuperAdmin}
                className="w-full py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Crown className="w-3.5 h-3.5" />
                <span>Activate Administrator Privileges</span>
              </button>
            </div>
          )}

          {/* Action Navigation Options */}
          <div className="space-y-2.5 pt-2">
            {/* Direct Dashboard Link */}
            <Link
              to={getDefaultDashboardRoute(effectiveUser)}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-royal to-teal hover:from-royal/90 hover:to-teal/90 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-md shadow-royal/20"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Go to My Dashboard ({effectiveUser.role})</span>
            </Link>

            {/* Apply for Organizer if student trying to access Organizer Workspace */}
            {allowedRoles.includes('ORGANIZER') && effectiveUser.role === 'STUDENT' && (
              <Link
                to="/dashboard/student?tab=apply"
                className="w-full py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-navy-light/40 hover:bg-slate-200 dark:hover:bg-navy-light/60 text-slate-800 dark:text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-teal" />
                <span>Apply for Campus Organizer Status</span>
              </Link>
            )}

            {/* Switch Account */}
            <Link
              to="/auth/login"
              className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-royal dark:hover:text-turquoise transition-colors pt-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Sign in with a different account</span>
            </Link>
          </div>

        </div>
      </div>
    );
  }

  // 3. Authorized
  return <>{children}</>;
};
