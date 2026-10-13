import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, Mail, Lock, ArrowRight, ShieldCheck, KeyRound } from 'lucide-react';
import { BrandLogo } from '../components/BrandLogo';

export const VerifyEmailPage: React.FC = () => {
  const [code, setCode] = useState('');
  const [verified, setVerified] = useState(false);
  const navigate = useNavigate();

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setVerified(true);
    setTimeout(() => {
      navigate('/dashboard/student');
    }, 2000);
  };

  const handleSimulateAutoCode = () => {
    setCode('EP-9482');
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center space-y-2">
          <BrandLogo size="lg" className="justify-center" />
          <h2 className="text-2xl font-black text-slate-900 mt-4">Verify Your Campus Email</h2>
          <p className="text-xs text-slate-500">
            A 6-digit confirmation code was sent to your campus email address.
          </p>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl space-y-5 text-center">
          {verified ? (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 space-y-1">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <p className="text-sm">Email Verified Successfully!</p>
              <p className="text-slate-500">Redirecting to your student dashboard...</p>
            </div>
          ) : (
            <form onSubmit={handleVerify} className="space-y-4">
              <div className="space-y-1 text-left">
                <label className="text-xs font-bold text-slate-700">Verification Code</label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Enter 6-digit code..."
                  className="w-full p-3 rounded-xl border border-slate-300 text-center font-mono font-bold text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-royal"
                  required
                />
              </div>

              {/* Simulation Sandbox Button */}
              <div className="bg-blue-50 p-3 rounded-xl border border-blue-200 text-left">
                <button
                  type="button"
                  onClick={handleSimulateAutoCode}
                  className="text-xs font-bold text-royal hover:underline flex items-center gap-1.5"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Sandbox: Fill test code (EP-9482)</span>
                </button>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-royal to-teal hover:opacity-95 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
              >
                <span>Confirm & Proceed</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          <div className="pt-2 text-xs text-slate-500">
            Didn't receive email?{' '}
            <button
              onClick={() => alert('New verification email simulated!')}
              className="font-bold text-royal hover:underline"
            >
              Resend verification
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ResetPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [dispatched, setDispatched] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDispatched(true);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center space-y-2">
          <BrandLogo size="lg" className="justify-center" />
          <h2 className="text-2xl font-black text-slate-900 mt-4">Reset Password</h2>
          <p className="text-xs text-slate-500">
            Enter your email to receive secure recovery credentials.
          </p>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl space-y-5">
          {dispatched ? (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 space-y-2 text-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <p className="text-sm">Recovery Link Dispatched!</p>
              <p className="text-slate-600">Please check your inbox or the Admin Email Outbox Inspector to reset your credentials.</p>
              <div className="pt-2">
                <Link to="/auth/login" className="text-royal font-bold hover:underline">
                  Return to Sign In
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Registered Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@nsuk.edu.ng"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-royal/30"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-royal hover:bg-royal-hover text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
              >
                <span>Send Password Reset Link</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          <div className="text-center pt-2 text-xs text-slate-500">
            Remembered your password?{' '}
            <Link to="/auth/login" className="font-bold text-royal hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
