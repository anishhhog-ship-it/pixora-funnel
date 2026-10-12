import Link from 'next/link';
import { Check, ArrowRight, Sparkles } from 'lucide-react';

export default function TrialCtaStrip() {
  return (
    <section className="py-14 sm:py-18 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Soft Blue Tinted Container */}
        <div className="relative rounded-3xl bg-[#EEF5FF] border border-blue-100 p-8 sm:p-10 lg:p-12 overflow-hidden shadow-sm">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
            
            {/* Left Headline (5 cols) */}
            <div className="lg:col-span-5 text-left">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
                Start Your 1 Day Free Trial Today
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                No credit card required. Full access to all features. Set up in 5 minutes.
              </p>
            </div>

            {/* Center: Clean Direct CTA Button (4 cols) */}
            <div className="lg:col-span-4 flex items-center justify-start lg:justify-center">
              <Link
                href="/onboarding"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm sm:text-base shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer text-center"
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
