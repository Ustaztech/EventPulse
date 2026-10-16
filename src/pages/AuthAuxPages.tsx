import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Mail, Lock, ArrowRight, AlertCircle, KeyRound, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { BrandLogo } from '../components/BrandLogo';
import { api } from '../lib/api';
import { useAuth } from '../lib/AuthContext';

export const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialEmail = searchParams.get('email') || '';
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState('');
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [resendStatus, setResendStatus] = useState<string | null>(null);

  const navigate = useNavigate();
  const { refreshUserData } = useAuth();

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!code.trim()) {
      setError('Please enter your 6-digit confirmation code.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.verifyEmail(code.trim(), email.trim() || undefined);
      setIsLoading(false);
      if (res.success) {
        setVerified(true);
        await refreshUserData();
        setTimeout(() => {
          navigate('/dashboard/student');
        }, 2000);
      } else {
        setError(res.message || 'Verification failed. Please check the code.');
      }
    } catch (err: any) {
      setIsLoading(false);
      setError(err?.message || 'Invalid or expired confirmation code.');
    }
  };

  const handleResend = async () => {
    if (!email) {
      setError('Please provide your registered campus email to resend verification.');
      return;
    }
    try {
      await api.forgotPassword(email);
      setResendStatus('Verification instructions have been re-dispatched to your email.');
      setTimeout(() => setResendStatus(null), 5000);
    } catch (err: any) {
      setError(err?.message || 'Failed to re-dispatch verification email.');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center space-y-2">
          <BrandLogo size="lg" className="justify-center" />
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-4">Verify Your Campus Email</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Enter the 6-digit confirmation code sent to your campus inbox to activate all platform permissions.
          </p>
        </div>

        <div className="bg-white dark:bg-[#111A33] p-8 rounded-3xl border border-slate-200 dark:border-navy-light/40 shadow-xl space-y-5 text-center">
          {error && (
            <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs font-bold text-rose-700 dark:text-rose-300 flex items-center gap-2 text-left">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {resendStatus && (
            <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 text-xs font-bold text-blue-700 dark:text-blue-300 text-left">
              {resendStatus}
            </div>
          )}

          {verified ? (
            <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-xs font-bold text-emerald-800 dark:text-emerald-300 space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
              <p className="text-base">Email Verified Successfully!</p>
              <p className="text-slate-500 font-normal">Redirecting to your student dashboard...</p>
            </div>
          ) : (
            <form onSubmit={handleVerify} className="space-y-4">
              {email && (
                <div className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-[#0B132B] p-2.5 rounded-xl border border-slate-200 dark:border-navy-light/60">
                  Target Account: <strong className="text-slate-800 dark:text-slate-200">{email}</strong>
                </div>
              )}

              <div className="space-y-1 text-left">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200">6-Digit Verification Code</label>
                <input
                  type="text"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="e.g. 849201"
                  className="w-full p-3 rounded-xl border border-slate-300 dark:border-navy-light/60 bg-white dark:bg-[#0B132B] text-slate-900 dark:text-white text-center font-mono font-bold text-xl tracking-widest focus:outline-none focus:ring-2 focus:ring-royal"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-royal to-teal hover:opacity-95 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {isLoading ? (
                  <span>Verifying Code...</span>
                ) : (
                  <>
                    <span>Confirm & Activate Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          <div className="pt-2 text-xs text-slate-500 dark:text-slate-400">
            Didn't receive the email?{' '}
            <button
              type="button"
              onClick={handleResend}
              className="font-bold text-royal dark:text-turquoise hover:underline"
            >
              Request new code
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  // Step 1: Request reset link state
  const [email, setEmail] = useState('');
  const [requestSent, setRequestSent] = useState(false);

  // Step 2: New password state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetCompleted, setResetCompleted] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Handle Step 1: Request Password Reset Link
  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await api.forgotPassword(email.trim());
      setIsLoading(false);
      setRequestSent(true);
    } catch (err: any) {
      setIsLoading(false);
      setError(err?.message || 'Failed to submit password recovery request.');
    }
  };

  // Handle Step 2: Set New Password with Token
  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters with letters and numbers.');
      return;
    }

    if (!token) {
      setError('Missing recovery token.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.resetPassword(token, newPassword);
      setIsLoading(false);
      if (res.success) {
        setResetCompleted(true);
      } else {
        setError(res.message || 'Failed to update password.');
      }
    } catch (err: any) {
      setIsLoading(false);
      setError(err?.message || 'Invalid or expired password reset link. Please request a new one.');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-3 sm:p-6 lg:p-8">
      <div className="max-w-md w-full space-y-5 sm:space-y-6">
        <div className="text-center space-y-2">
          <BrandLogo size="lg" className="justify-center" />
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-4">
            {token ? 'Create New Password' : 'Reset Your Password'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {token 
              ? 'Enter your new credentials below to restore account access.' 
              : 'Enter your registered email to receive a secure, single-use password recovery link.'
            }
          </p>
        </div>

        <div className="bg-white dark:bg-[#111A33] p-5 sm:p-8 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-navy-light/40 shadow-xl space-y-5">
          {error && (
            <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-xs font-bold text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 2 COMPLETED: Password successfully updated */}
          {resetCompleted ? (
            <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-xs font-bold text-emerald-800 dark:text-emerald-300 space-y-3 text-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
              <p className="text-base">Password Updated Successfully!</p>
              <p className="text-slate-600 dark:text-slate-300 font-normal">
                Your new credentials are now active. You may now proceed to sign in.
              </p>
              <div className="pt-2">
                <Link
                  to="/auth/login"
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-royal text-white font-bold text-sm shadow-md"
                >
                  <span>Sign In Now</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ) : token ? (
            /* STEP 2 FORM: User clicked link with ?token=... */
            <form onSubmit={handleResetSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200">New Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 8 characters..."
                    className="w-full pl-10 pr-11 py-3 min-h-[44px] rounded-xl border border-slate-200 dark:border-navy-light/60 bg-white dark:bg-[#0B132B] text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-royal/30 transition-all font-medium"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-0 top-0 bottom-0 px-3.5 flex items-center justify-center text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200">Confirm New Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password..."
                    className="w-full pl-10 pr-11 py-3 min-h-[44px] rounded-xl border border-slate-200 dark:border-navy-light/60 bg-white dark:bg-[#0B132B] text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-royal/30 transition-all font-medium"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-0 top-0 bottom-0 px-3.5 flex items-center justify-center text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full min-h-[46px] py-3.5 rounded-xl bg-royal hover:bg-royal-hover text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-70 mt-2 active:scale-[0.99]"
              >
                {isLoading ? <span>Updating Password...</span> : <span>Save New Password</span>}
              </button>
            </form>
          ) : requestSent ? (
            /* STEP 1 SENT: Confirmation of dispatch */
            <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-xs font-bold text-emerald-800 dark:text-emerald-300 space-y-2 text-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
              <p className="text-base">Recovery Link Dispatched!</p>
              <p className="text-slate-600 dark:text-slate-300 font-normal">
                If the email is registered in the system, recovery instructions containing a single-use reset link have been dispatched to your inbox.
              </p>
              <div className="pt-3">
                <Link to="/auth/login" className="text-royal dark:text-turquoise font-bold hover:underline">
                  Return to Sign In
                </Link>
              </div>
            </div>
          ) : (
            /* STEP 1 FORM: User requests reset link */
            <form onSubmit={handleRequestSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200">Registered Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full pl-10 pr-4 py-3 min-h-[44px] rounded-xl border border-slate-200 dark:border-navy-light/60 bg-white dark:bg-[#0B132B] text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-royal/30 font-medium placeholder-slate-400 transition-all"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full min-h-[46px] py-3.5 rounded-xl bg-royal hover:bg-royal-hover text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-70 mt-2 active:scale-[0.99]"
              >
                {isLoading ? (
                  <span>Dispatching Link...</span>
                ) : (
                  <>
                    <span>Send Password Reset Link</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          <div className="text-center pt-2 text-xs text-slate-500 dark:text-slate-400">
            Remembered your password?{' '}
            <Link to="/auth/login" className="font-bold text-royal dark:text-turquoise hover:underline py-1">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
