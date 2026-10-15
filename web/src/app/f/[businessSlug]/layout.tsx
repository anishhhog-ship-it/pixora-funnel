import { businessService } from '@/services';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { Lock, AlertTriangle, PhoneCall, Sparkles } from 'lucide-react';
import UnlockFunnelClient from './UnlockFunnelClient';

export default async function FunnelLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ businessSlug: string }>;
}) {
  const { businessSlug } = await params;
  const business = await businessService.getBusinessBySlug(businessSlug);
  if (!business) {
    notFound();
  }

  // Check if trial has ended (demo time hit zero) and business is not on an active paid plan
  // In local development / preview on localhost, always allow live preview
  let isLocal = process.env.NODE_ENV !== 'production';
  try {
    const headerList = await headers();
    const host = headerList.get('host') || '';
    if (host.includes('localhost') || host.includes('127.0.0.1')) {
      isLocal = true;
    }
  } catch {}

  // The server route intentionally compares the trial against request time.
  // eslint-disable-next-line react-hooks/purity
  const requestNow = Date.now();
  const isExpired = !isLocal && (
    business.planStatus === 'expired' ||
    (business.trialExpiresAt &&
      new Date(business.trialExpiresAt).getTime() <= requestNow &&
      business.planStatus !== 'active')
  );

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-white text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* ── Soft Ambient Background Gradients (Subtle Light Blue & Mint Green) ── */}
      <div 
        className="fixed inset-0 pointer-events-none z-0 overflow-hidden" 
        aria-hidden="true"
      >
        {/* Soft light-blue ambient bloom top right */}
        <div 
          className="absolute -top-24 -right-24 h-96 w-96 rounded-full blur-3xl opacity-60"
          style={{
            background: 'radial-gradient(circle, rgba(186, 230, 253, 0.55) 0%, rgba(224, 242, 254, 0.2) 70%, transparent 100%)'
          }}
        />
        {/* Soft mint-green ambient bloom mid-left */}
        <div 
          className="absolute top-1/3 -left-28 h-96 w-96 rounded-full blur-3xl opacity-50"
          style={{
            background: 'radial-gradient(circle, rgba(167, 243, 208, 0.45) 0%, rgba(209, 250, 229, 0.15) 70%, transparent 100%)'
          }}
        />
        {/* Soft light-blue / ice ambient bloom bottom right */}
        <div 
          className="absolute -bottom-24 -right-16 h-80 w-80 rounded-full blur-3xl opacity-45"
          style={{
            background: 'radial-gradient(circle, rgba(191, 219, 254, 0.4) 0%, rgba(240, 249, 255, 0.1) 70%, transparent 100%)'
          }}
        />
      </div>

      {/* ── Main Funnel Container (Mobile-first, centered) ── */}
      <div className="relative z-10 mx-auto flex w-full max-w-md min-h-screen flex-col px-4 py-4 sm:px-6 sm:py-6">
        {isExpired ? (
          <main className="my-auto w-full">
            <div className="mx-auto w-full max-w-sm rounded-[32px] border border-rose-200 bg-white p-6 text-center text-slate-900 shadow-xl sm:p-7">
              {/* Lock Badge Icon */}
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-tr from-rose-500 to-rose-600 text-white flex items-center justify-center shadow-lg shadow-rose-500/25">
                <Lock className="w-8 h-8" />
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold uppercase tracking-wider mb-2.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Scanner Inactive</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight leading-tight">
                Free Trial Has Ended
              </h2>

              <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                The free trial for <strong>{business.name}</strong> review funnel has concluded and this scanner has been paused.
              </p>

              {/* Requirement Box */}
              <div className="my-5 p-3.5 bg-amber-50 rounded-2xl border border-amber-200 text-left text-xs text-amber-950 space-y-1.5">
                <p className="font-bold flex items-center gap-1.5 text-amber-900">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>How to Unlock Your Funnel:</span>
                </p>
                <p className="text-[12px] text-amber-800 leading-relaxed">
                  Activate a plan to re-activate your customer review system and turn on AI Auto Reply:
                </p>
                <div className="pt-1 space-y-1 text-[11px] text-slate-700 font-medium">
                  <div>• <strong>₹2,599:</strong> 2-Year Plan (Without NFC Card)</div>
                  <div>• <strong>₹2,999:</strong> Lifetime Free Access (First 100 Accounts Offer + NFC Smart Review Card)</div>
                </div>
              </div>

              {/* Purchase & Unlock Buttons */}
              <UnlockFunnelClient businessId={business.id || businessSlug} businessName={business.name || 'Your Business'} />

              <div className="space-y-2 pt-1">
                <a
                  href={`https://wa.me/919257378047?text=${encodeURIComponent(
                    `Hi Admin! Please unlock the QR review scanner for ${business.name}.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <PhoneCall className="w-3.5 h-3.5 text-slate-600" />
                  <span>Request Admin to Unlock (+91 92573 78047)</span>
                </a>

                <a
                  href="tel:9257378047"
                  className="block text-center text-[11px] text-slate-500 hover:text-slate-900 font-medium pt-1"
                >
                  Direct Call: +91 92573 78047
                </a>
              </div>
            </div>
          </main>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
