'use client';

import type { HTMLAttributes, ReactNode } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Shared surface language for authenticated client portal screens. */
export const PORTAL_SURFACE =
  'rounded-2xl border border-slate-200/80 bg-white shadow-[0_12px_30px_-24px_rgba(15,23,42,0.45)]';

export const PORTAL_FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30 focus-visible:ring-offset-2';

interface PortalCardProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
}

export function PortalCard({ className, interactive = false, ...props }: PortalCardProps) {
  return (
    <div
      className={cn(
        PORTAL_SURFACE,
        interactive && 'transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_18px_36px_-24px_rgba(15,23,42,0.55)]',
        className,
      )}
      {...props}
    />
  );
}

interface PortalPageHeaderProps {
  title: string;
  description?: string;
  eyebrow?: string;
  actions?: ReactNode;
  className?: string;
}

export function PortalPageHeader({
  title,
  description,
  eyebrow,
  actions,
  className,
}: PortalPageHeaderProps) {
  return (
    <div className={cn('flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between', className)}>
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-blue-600">
            {eyebrow}
          </p>
        )}
        <h1 className="text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-500 sm:text-sm">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

interface PortalStatCardProps {
  icon: ReactNode;
  iconBackground: string;
  value: ReactNode;
  title: string;
  description?: string;
  trend?: ReactNode;
  className?: string;
}

export function PortalStatCard({
  icon,
  iconBackground,
  value,
  title,
  description,
  trend,
  className,
}: PortalStatCardProps) {
  return (
    <PortalCard className={cn('flex min-w-0 items-center gap-3 p-4 sm:gap-4 sm:p-5', className)}>
      <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl sm:h-11 sm:w-11', iconBackground)}>
        {icon}
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="truncate text-xl font-bold leading-none text-slate-950 sm:text-2xl">{value}</span>
          {trend && (
            <span className="shrink-0 rounded-full border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold text-emerald-800">
              {trend}
            </span>
          )}
        </div>
        <p className="mt-1 truncate text-xs font-semibold text-slate-800 sm:text-sm">{title}</p>
        {description && <p className="mt-0.5 hidden truncate text-[10px] text-slate-400 sm:block">{description}</p>}
      </div>
    </PortalCard>
  );
}

interface PortalLoadingStateProps {
  label?: string;
  className?: string;
}

export function PortalLoadingState({ label = 'Loading workspace', className }: PortalLoadingStateProps) {
  return (
    <PortalCard className={cn('flex min-h-[280px] flex-col items-center justify-center gap-3 p-8 text-center', className)}>
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
        <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-800">{label}</p>
        <p className="mt-1 text-xs text-slate-500">Your latest workspace data will appear here shortly.</p>
      </div>
    </PortalCard>
  );
}

interface PortalEmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}

export function PortalEmptyState({ icon, title, description, action, className }: PortalEmptyStateProps) {
  return (
    <PortalCard className={cn('flex min-h-[240px] flex-col items-center justify-center p-8 text-center', className)}>
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-400">
        {icon}
      </div>
      <h2 className="text-base font-bold text-slate-900">{title}</h2>
      <p className="mt-1.5 max-w-md text-xs leading-relaxed text-slate-500 sm:text-sm">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </PortalCard>
  );
}

interface PortalErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}

export function PortalErrorState({
  title = 'We could not load this view',
  description = 'Refresh the data and try again. Your existing account settings are unchanged.',
  onRetry,
  className,
}: PortalErrorStateProps) {
  return (
    <PortalCard className={cn('flex min-h-[240px] flex-col items-center justify-center p-8 text-center', className)}>
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 text-rose-600">
        <AlertCircle className="h-6 w-6" aria-hidden="true" />
      </div>
      <h2 className="text-base font-bold text-slate-900">{title}</h2>
      <p className="mt-1.5 max-w-md text-xs leading-relaxed text-slate-500 sm:text-sm">{description}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className={cn(
            'mt-5 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-slate-700',
            PORTAL_FOCUS_RING,
          )}
        >
          Try again
        </button>
      )}
    </PortalCard>
  );
}
