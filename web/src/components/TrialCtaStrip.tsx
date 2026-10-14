import Link from 'next/link';
import { Check, ArrowRight } from 'lucide-react';

export default function TrialCtaStrip() {
  return (
    <section className="bg-white py-14 sm:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Soft Blue Tinted Container */}
        <div className="relative overflow-hidden rounded-[2rem] border border-blue-100 bg-gradient-to-br from-[#eef5ff] via-white to-[#effaf5] p-8 shadow-sm sm:p-10 lg:p-12">
          <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-blue-200/30 blur-3xl" aria-hidden="true" />
          <div className="pointer-events-none absolute -bottom-24 left-1/3 h-48 w-48 rounded-full bg-emerald-200/25 blur-3xl" aria-hidden="true" />
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
            
            {/* Left Headline (5 cols) */}
            <div className="lg:col-span-5 text-left">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
                Start Your 1 Day Free Trial Today
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                 No credit card required. Full access to the trial experience with guided setup.
              </p>
            </div>

            {/* Center: Clean Direct CTA Button (4 cols) */}
            <div className="lg:col-span-4 flex items-center justify-start lg:justify-center">
              <Link
                href="/onboarding"
                className="public-focus-ring inline-flex w-full cursor-pointer items-center justify-center gap-2.5 rounded-xl bg-slate-950 px-7 py-3.5 text-center text-sm font-bold text-white shadow-md transition-all hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-lg active:translate-y-0 active:scale-[0.98] sm:w-auto sm:text-base"
              >
                <span>Start 1 Day Free Trial</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Right: Checkmarks & Playful Callout (3 cols) */}
            <div className="lg:col-span-3 flex flex-col justify-center sm:items-start lg:items-end">
              <div className="space-y-1.5 text-xs text-slate-700 font-medium">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-blue-600/10 text-blue-600 flex items-center justify-center shrink-0">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                  <span>No Credit Card Required</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-blue-600/10 text-blue-600 flex items-center justify-center shrink-0">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                  <span>Full Feature Access</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-blue-600/10 text-blue-600 flex items-center justify-center shrink-0">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                  <span>Cancel Anytime</span>
                </div>
              </div>

              {/* Hand-drawn style note matching screenshot */}
              <div className="mt-3 hidden sm:flex items-center gap-1 text-xs font-serif italic text-blue-800">
                <span>Grow your business today!</span>
                <span className="text-base not-italic">↗</span>
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
