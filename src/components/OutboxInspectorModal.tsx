import React, { useState } from 'react';
import { X, Mail, RefreshCw, Send, CheckCircle2, Clock, AlertTriangle, Eye, ArrowRight } from 'lucide-react';
import { EmailOutboxJob } from '../lib/types';
import { db } from '../lib/storage';

interface OutboxInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OutboxInspectorModal: React.FC<OutboxInspectorModalProps> = ({ isOpen, onClose }) => {
  const [jobs, setJobs] = useState<EmailOutboxJob[]>(() => db.getOutboxJobs());
  const [selectedJob, setSelectedJob] = useState<EmailOutboxJob | null>(null);
  const [testEmail, setTestEmail] = useState('');
  const [testSuccess, setTestSuccess] = useState(false);

  if (!isOpen) return null;

  const refreshJobs = () => {
    setJobs([...db.getOutboxJobs()]);
  };

  const handleRetry = (jobId: string) => {
    db.retryOutboxJob(jobId);
    setTimeout(refreshJobs, 1200);
  };

  const handleSendTest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmail) return;

    db.enqueueOutboxJob({
      recipientEmail: testEmail,
      recipientName: 'NSUK Test Recipient',
      subject: 'Test Announcement: NSUK EventPulse Delivery Check',
      bodyHtml: `
        <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px;border:1px solid #cbd5e1;border-radius:12px;">
          <h2 style="color:#1E40AF;">EventPulse - Email Delivery Test</h2>
          <p>This is a transactional email test dispatched from the EventPulse Outbox Engine.</p>
          <div style="background:#f0fdf4;padding:12px;border-radius:6px;color:#166534;">
            Status: Connection Active & Verified.
          </div>
          <p style="font-size:12px;color:#64748b;margin-top:20px;">Nasarawa State University, Keffi</p>
        </div>
      `,
      bodyText: 'EventPulse Email Delivery Test. Connection Active & Verified.',
      notificationType: 'ANNOUNCEMENT',
      idempotencyKey: `test-outbox-${Date.now()}`
    });

    setTestSuccess(true);
    setTestEmail('');
    setTimeout(() => {
      setTestSuccess(false);
      refreshJobs();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-slate-100 flex flex-col animate-in zoom-in-95">
        {/* Header */}
        <div className="px-6 py-4 bg-navy text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-turquoise" />
            <h3 className="text-lg font-bold">Email Outbox & Delivery Inspector</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={refreshJobs}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
              title="Refresh queue"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Test Dispatch Bar */}
        <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <form onSubmit={handleSendTest} className="flex items-center gap-2 flex-1 max-w-md">
            <input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="Enter recipient to test email sandbox..."
              className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs w-full focus:outline-none focus:ring-1 focus:ring-royal"
              required
            />
            <button
              type="submit"
              className="px-3 py-1.5 rounded-lg bg-royal text-white font-bold hover:bg-royal-hover flex items-center gap-1 shrink-0"
            >
              <Send className="w-3 h-3" />
              <span>Send Test</span>
            </button>
          </form>

          {testSuccess && (
            <span className="text-emerald-600 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Enqueued successfully!
            </span>
          )}

          <div className="text-slate-500 font-medium">
            Total Jobs: <strong>{jobs.length}</strong>
          </div>
        </div>

        {/* Main Split Body */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200">
          {/* Left: Jobs List */}
          <div className="overflow-y-auto p-4 space-y-2 max-h-[500px]">
            {jobs.length === 0 ? (
              <p className="text-center text-slate-400 py-8 text-sm">No outbox jobs recorded.</p>
            ) : (
              jobs.map((job) => (
                <div
                  key={job.id}
                  onClick={() => setSelectedJob(job)}
                  className={`p-3.5 rounded-2xl border text-xs cursor-pointer transition-all ${
                    selectedJob?.id === job.id
                      ? 'bg-blue-50/70 border-royal shadow-xs'
                      : 'bg-white hover:bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-900 truncate max-w-[200px]">
                      {job.recipientEmail}
                    </span>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${
                      job.status === 'DELIVERED'
                        ? 'bg-emerald-100 text-emerald-700'
                        : job.status === 'QUEUED'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-rose-100 text-rose-700'
                    }`}>
                      {job.status}
                    </span>
                  </div>

                  <p className="text-slate-600 font-medium truncate mb-2">{job.subject}</p>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-100">
                    <span>Attempts: {job.attemptCount}/{job.maxAttempts}</span>
                    <span>{new Date(job.createdAt).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Right: Selected Job Preview */}
          <div className="overflow-y-auto p-6 max-h-[500px] flex flex-col justify-between">
            {selectedJob ? (
              <div className="space-y-4">
                <div className="border-b border-slate-200 pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-bold text-royal uppercase tracking-wider block">
                        {selectedJob.notificationType}
                      </span>
                      <h4 className="font-bold text-slate-900 text-sm mt-0.5">{selectedJob.subject}</h4>
                    </div>
                    {selectedJob.status !== 'DELIVERED' && (
                      <button
                        onClick={() => handleRetry(selectedJob.id)}
                        className="px-2.5 py-1 text-xs font-bold text-royal bg-blue-100 hover:bg-blue-200 rounded-lg flex items-center gap-1"
                      >
                        <RefreshCw className="w-3 h-3" /> Retry
                      </button>
                    )}
                  </div>
                  <div className="mt-2 text-xs text-slate-500 space-y-0.5">
                    <p>To: <strong>{selectedJob.recipientName}</strong> &lt;{selectedJob.recipientEmail}&gt;</p>
                    <p className="font-mono text-[10px]">Idempotency Key: {selectedJob.idempotencyKey}</p>
                  </div>
                </div>

                {/* Rendered HTML Container */}
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    HTML Template Preview
                  </span>
                  <div 
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 max-h-72 overflow-y-auto text-xs"
                    dangerouslySetInnerHTML={{ __html: selectedJob.bodyHtml }}
                  />
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center py-12">
                <Eye className="w-10 h-10 mb-2 opacity-50" />
                <p className="text-sm font-semibold">Select any job from the queue to inspect raw HTML and metadata.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default OutboxInspectorModal;
