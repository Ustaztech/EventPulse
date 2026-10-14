import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Lock, Mail, KeyRound, ArrowRight, AlertCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { BrandLogo } from '../components/BrandLogo';

export const AdminLoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { adminLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await adminLogin(email.trim(), password, mfaCode.trim() || undefined);
      setIsLoading(false);
      if (!res.success) {
        setError(res.error || 'Administrator authentication failed.');
      } else {
        navigate('/dashboard/admin');
      }
    } catch (err: any) {
      setIsLoading(false);
      setError(err?.message || 'Network error communicating with authentication service.');
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center bg-slate-50 dark:bg-navy-dark py-12 px-4 sm:px-6 transition-colors">
      <div className="max-w-md w-full space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <BrandLogo size="lg" className="justify-center" />
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-xs font-bold mt-2">
            <Shield className="w-3.5 h-3.5" />
            <span>Administrative Security Console</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
            Administrator Sign In
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Authorised university event management administrators and system supervisors only.
          </p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-[#111A33] rounded-3xl p-6 sm:p-8 shadow-xl border border-purple-200/60 dark:border-purple-900/40 space-y-5">
          {error && (
            <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs font-bold text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block">
                Administrator Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@eventpulse.com.ng"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-navy-light/60 bg-white dark:bg-[#0B132B] text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30 font-medium placeholder-slate-400"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter administrator password..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-navy-light/60 bg-white dark:bg-[#0B132B] text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30 font-medium placeholder-slate-400"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block">
                  Security MFA Code (Optional)
                </label>
                <span className="text-[10px] text-slate-400">If enabled on account</span>
              </div>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value)}
                  placeholder="6-digit code (e.g. 123456)"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-navy-light/60 bg-white dark:bg-[#0B132B] text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30 font-mono tracking-wider"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-95 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-70 mt-2"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Authenticating Console...</span>
                </span>
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  <span>Authenticate as Administrator</span>
                </>
              )}
            </button>
          </form>

          <div className="pt-2 text-center text-xs border-t border-slate-100 dark:border-navy-light/40">
            <Link to="/auth/login" className="inline-flex items-center gap-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Standard Campus Login</span>
            </Link>
          </div>
        </div>

        <p className="text-[11px] text-center text-slate-400">
          EventPulse Campus Operations &bull; Administrator security sessions are logged and monitored.
        </p>

      </div>
    </div>
  );
};
export default AdminLoginPage;
