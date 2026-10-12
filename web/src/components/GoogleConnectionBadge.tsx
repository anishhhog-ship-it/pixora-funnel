'use client';

import React from 'react';
import Link from 'next/link';
import { CheckCircle2, Clock, AlertTriangle, ExternalLink, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

export type GoogleBadgeStatus = 'connected' | 'access_pending' | 'requires_auth' | 'not_connected';

interface GoogleConnectionBadgeProps {
  status?: GoogleBadgeStatus | null;
  locationName?: string;
  lastSyncedAt?: string;
  compact?: boolean;
  showSyncButton?: boolean;
  onSync?: () => void;
  isSyncing?: boolean;
  className?: string;
}

export function GoogleConnectionBadge({
  status = 'not_connected',
  locationName,
  lastSyncedAt,
  compact = false,
  showSyncButton = false,
  onSync,
  isSyncing = false,
  className,
}: GoogleConnectionBadgeProps) {
  const currentStatus = status || 'not_connected';

  const formatLastSync = (isoString?: string) => {
    if (!isoString) return null;
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return null;
      const diffMs = Date.now() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    } catch {
      return null;
    }
  };

  const syncText = formatLastSync(lastSyncedAt);

  if (compact) {
    if (currentStatus === 'connected') {
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/80',
            className
          )}
          title="Google Business Profile Connected & Verified"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Google Connected</span>
        </span>
      );
    }

    if (currentStatus === 'access_pending') {
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-900 border border-amber-200/90',
            className
          )}
          title="OAuth Connected · Google Cloud Project pixora-funnel-511104 API Access Pending Approval"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          <span>Google Linked (API Pending)</span>
        </span>
      );
    }

    return (
      <Link
        href="/dashboard/settings"
        className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200 transition',
          className
        )}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
        <span>Connect Google</span>
      </Link>
    );
  }

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2.5 px-3 py-1.5 rounded-2xl border text-xs shadow-2xs transition-all',
        currentStatus === 'connected'
          ? 'bg-emerald-50/90 border-emerald-200 text-emerald-900'
          : currentStatus === 'access_pending'
          ? 'bg-amber-50/90 border-amber-200 text-amber-900'
          : 'bg-slate-50 border-slate-200 text-slate-700',
        className
      )}
    >
      {/* Google G logo */}
      <div className="w-4 h-4 shrink-0 flex items-center justify-center">
        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.31-1.03 2.41-2.16 3.16v2.62h3.49c2.04-1.89 3.22-4.67 3.22-7.79z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.49-2.62c-.98.66-2.23 1.05-3.79 1.05-2.91 0-5.38-1.97-6.26-4.62H2.12v2.71C3.94 20.48 7.68 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.74 14.15c-.22-.66-.35-1.36-.35-2.15s.13-1.49.35-2.15V7.14H2.12C1.4 8.59 1 10.25 1 12s.4 3.41 1.12 4.86l3.62-2.71z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.07.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.68 1 3.94 3.52 2.12 7.14l3.62 2.71c.88-2.65 3.35-4.47 6.26-4.47z"
            fill="#EA4335"
          />
        </svg>
      </div>

      {/* Main Status Text */}
      <div className="flex items-center gap-1.5">
        <span className="font-bold text-slate-900">
          {currentStatus === 'connected'
            ? 'Google Connected'
            : currentStatus === 'access_pending'
            ? 'OAuth Linked'
            : 'Not Connected'}
        </span>

        {currentStatus === 'connected' && (
          <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100/90 px-1.5 py-0.2 rounded-md">
            Live
          </span>
        )}

        {currentStatus === 'access_pending' && (
          <span className="text-[10px] font-semibold text-amber-800 bg-amber-100/90 px-1.5 py-0.2 rounded-md">
            API Approval Pending
          </span>
        )}
      </div>

      {/* Optional Location label */}
      {locationName && (
        <span className="hidden sm:inline text-slate-500 font-normal truncate max-w-[140px]">
          · {locationName}
        </span>
      )}

      {/* Last Synced indicator */}
      {syncText && (
        <span className="hidden md:inline text-[11px] text-slate-400 font-mono">
          ({syncText})
        </span>
      )}

      {/* Action buttons */}
      {showSyncButton && onSync && currentStatus !== 'not_connected' && (
        <button
          type="button"
          onClick={onSync}
          disabled={isSyncing}
          className="ml-1 p-1 hover:bg-white rounded-lg text-slate-600 hover:text-slate-900 transition cursor-pointer disabled:opacity-50"
          title="Sync latest reviews from Google My Business"
        >
          <RefreshCw className={cn('w-3 h-3', isSyncing && 'animate-spin text-blue-600')} />
        </button>
      )}

      {currentStatus === 'not_connected' && (
        <Link
          href="/dashboard/settings"
          className="text-blue-600 hover:text-blue-700 font-bold text-[11px] ml-1 flex items-center gap-0.5"
        >
          <span>Connect</span>
          <ExternalLink className="w-2.5 h-2.5" />
        </Link>
      )}
    </div>
  );
}
