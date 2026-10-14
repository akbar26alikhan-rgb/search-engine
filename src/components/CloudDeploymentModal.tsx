import React from 'react';
import { X, CloudLightning, ShieldCheck, Server, Database } from 'lucide-react';

interface CloudDeploymentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CloudDeploymentModal: React.FC<CloudDeploymentModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div onClick={onClose} className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" />

      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <CloudLightning className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Zero-Budget 24/7 Cloud Deployment Guide
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Host DeepSeekr continuously without spending a dime using verified free tiers.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 space-y-4 text-xs sm:text-sm">
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850">
            <h3 className="font-bold text-slate-900 dark:text-white mb-1.5 flex items-center gap-2">
              <Server className="w-4 h-4 text-blue-500" />
              Verified Free Hosting Targets & Storage Models
            </h3>
            <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
              <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <strong className="text-slate-900 dark:text-white block mb-0.5">Option A: Render.com (Free Web Service)</strong>
                <p>750 hours/month free allowance. Runs <code className="font-mono">npm run build && npm start</code> on Node.js 22. Ephemeral disk by default — SQLite file recreates cleanly upon deploy or cold start.</p>
              </div>

              <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <strong className="text-slate-900 dark:text-white block mb-0.5">Option B: Fly.io (Free Tier with Persistent Volume)</strong>
                <p>Includes free persistent volume storage (<code className="font-mono">/data</code> mount). Attach a 1GB free volume to persist the SQLite <code className="font-mono">deepseekr.db</code> permanently across restarts.</p>
              </div>

              <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <strong className="text-slate-900 dark:text-white block mb-0.5">Option C: Google Cloud Run (Free Tier)</strong>
                <p>2 million requests/month free tier, automated HTTPS, and scale-to-zero. Health check path configured at <code className="font-mono">/api/health</code>.</p>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850">
            <h3 className="font-bold text-slate-900 dark:text-white mb-1.5 flex items-center gap-2">
              <Database className="w-4 h-4 text-violet-500" />
              Database Persistence Architecture
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-2">
              DeepSeekr uses WebAssembly-powered SQLite (<code className="font-mono">sql.js</code>) synced to <code className="font-mono">./data/deepseekr.db</code>.
            </p>
            <ul className="list-disc ml-4 space-y-1 text-xs text-slate-600 dark:text-slate-300">
              <li><strong>Zero External DB Cost</strong>: Requires no paid managed database or connection fees.</li>
              <li><strong>Safe Auto-Recovery</strong>: If running on an ephemeral host that wipes the filesystem upon reboot, the database automatically recreates tables safely on startup without crashing.</li>
            </ul>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850">
            <h3 className="font-bold text-slate-900 dark:text-white mb-1.5 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              Health Check & Environment Setup
            </h3>
            <ul className="list-disc ml-4 space-y-1 text-xs text-slate-600 dark:text-slate-300">
              <li><strong>Health Check Endpoint</strong>: <code className="font-mono font-semibold text-blue-600 dark:text-blue-400">GET /api/health</code> responds with HTTP 200, provider statuses, and timestamps for container probes.</li>
              <li><strong>Port</strong>: Bind to <code className="font-mono">PORT</code> environment variable (default: 3001 or 3000) on <code className="font-mono">0.0.0.0</code>.</li>
              <li><strong>SSL / HTTPS</strong>: Handled automatically by Cloud Run, Render, and Fly edge proxies.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
