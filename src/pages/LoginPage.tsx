import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Lock, 
  Mail, 
  ArrowRight, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  Sparkles,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { BrandLogo } from '../components/BrandLogo';
import { db } from '../lib/storage';
import { getDefaultDashboardRoute } from '../lib/rbac';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectParam = searchParams.get('redirect');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await login(email, password, rememberMe);
      setIsLoading(false);
      if (!res.success) {
        setError(res.error || 'Authentication failed. Please check your credentials.');
      } else {
        if (redirectParam) {
          navigate(decodeURIComponent(redirectParam));
        } else {
          const loggedUser = db.getCurrentUser();
          navigate(getDefaultDashboardRoute(loggedUser));
        }
      }
    } catch (err: any) {
      setIsLoading(false);
      setError(err?.message || 'Network error occurred during login.');
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center bg-slate-50 dark:bg-navy-dark py-12 px-4 sm:px-6 transition-colors">
      <div className="max-w-md w-full space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <BrandLogo size="lg" className="justify-center" />
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-2">
            Welcome Back
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Sign in to manage event passes, registrations, and notifications.
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white dark:bg-[#111A33] rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200/90 dark:border-navy-light/40 space-y-5">
          
          {/* Error Alert */}
          {error && (
            <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs font-bold text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. user@eventpulse.com.ng"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-navy-light/60 bg-white dark:bg-[#0B132B] text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-royal/30 font-medium placeholder-slate-400"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block">
                  Password
                </label>
                <Link 
                  to="/auth/reset-password" 
                  className="text-xs font-semibold text-royal dark:text-turquoise hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password..."
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-navy-light/60 bg-white dark:bg-[#0B132B] text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-royal/30 font-medium placeholder-slate-400"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between pt-1 text-xs">
              <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600 dark:text-slate-300 font-medium">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 dark:border-navy-light text-royal focus:ring-royal/30 cursor-pointer"
                />
                <span>Remember me</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-royal to-teal hover:opacity-95 text-white font-bold text-sm shadow-md shadow-royal/20 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Signing in...</span>
                </span>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Sign Up Link & Distinct Admin Login */}
          <div className="pt-2 text-center text-xs text-slate-600 dark:text-slate-300 space-y-2">
            <div>
              Don't have an account?{' '}
              <Link to="/auth/register" className="font-bold text-royal dark:text-turquoise hover:underline">
                Create an Account
              </Link>
            </div>
            <div className="pt-1 border-t border-slate-100 dark:border-navy-light/40">
              <Link to="/auth/admin-login" className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Dedicated Administrator Portal Sign In</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Footer Support Note */}
        <p className="text-[11px] text-center text-slate-400">
          EventPulse Platform &bull; Support: <span className="font-semibold text-slate-600 dark:text-slate-300">support@eventpulse.com.ng</span>
        </p>

      </div>
    </div>
  );
};
export default LoginPage;
