'use client';

import Link from 'next/link';
import { ArrowRight, CheckCircle2, CircleUserRound } from 'lucide-react';
import { Business } from '@/types';
import { cn } from '@/lib/utils';
import { PORTAL_FOCUS_RING, PortalCard } from './PortalUI';

type ProfileField = { label: string; complete: boolean; href: string };

export default function ProfileCompletionCard({ business }: { business: Business | null }) {
  if (!business) return null;

  const fields: ProfileField[] = [
    { label: 'Business name', complete: Boolean(business.name.trim()), href: '/dashboard/settings' },
    { label: 'Business category', complete: Boolean(business.category.trim()), href: '/dashboard/settings' },
    { label: 'Contact phone', complete: Boolean(business.phone?.trim()), href: '/dashboard/settings' },
    { label: 'Contact email', complete: Boolean(business.email?.trim()), href: '/dashboard/settings' },
    { label: 'Address and city', complete: Boolean(business.address?.trim() && business.city?.trim()), href: '/dashboard/settings' },
    { label: 'Website', complete: Boolean(business.website?.trim()), href: '/dashboard/settings' },
    { label: 'Brand logo', complete: Boolean(business.logo?.trim() && !business.logo.includes('unsplash.com')), href: '/dashboard/settings' },
    { label: 'Google review link', complete: Boolean(business.googleReviewUrl?.trim()), href: '/dashboard/settings' },
  ];
  const completed = fields.filter((field) => field.complete).length;
  const percentage = Math.round((completed / fields.length) * 100);
  const nextField = fields.find((field) => !field.complete);

  return (
    <PortalCard className="p-4 sm:p-5" aria-labelledby="profile-completion-title">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><CircleUserRound className="h-5 w-5" aria-hidden="true" /></div>
          <div className="min-w-0">
            <h2 id="profile-completion-title" className="text-sm font-bold text-slate-950">Complete your business profile</h2>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">A complete profile helps customers trust your funnel and gives Pixora the details needed for hardware customization.</p>
          </div>
        </div>
        <Link href="/dashboard/settings" className={cn('inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-blue-700', PORTAL_FOCUS_RING)}>
          Edit profile <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-label="Business profile completion" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percentage}>
          <div className="h-full rounded-full bg-blue-600 transition-all duration-500" style={{ width: `${percentage}%` }} />
        </div>
        <span className="shrink-0 text-xs font-bold text-slate-700">{percentage}%</span>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="text-[11px] font-semibold text-slate-500">{completed} of {fields.length} profile details complete</span>
        {nextField ? <Link href={nextField.href} className={cn('text-[11px] font-bold text-blue-600 hover:text-blue-700', PORTAL_FOCUS_RING)}>Next: {nextField.label} →</Link> : <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700"><CheckCircle2 className="h-3.5 w-3.5" /> Profile complete</span>}
      </div>
    </PortalCard>
  );
}
