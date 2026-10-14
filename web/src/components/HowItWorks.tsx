'use client';

import { User, Store, QrCode, Rocket, ArrowRight, type LucideIcon } from 'lucide-react';
import Link from 'next/link';

interface Step {
  number: number;
  icon: LucideIcon;
  title: string;
  description: string;
}

const steps: Step[] = [
  {
    number: 1,
    icon: User,
    title: 'Create Your Account',
     description: 'Sign up with your mobile number or Google account and follow the guided setup.',
  },
  {
    number: 2,
    icon: Store,
    title: 'Set Up Your Business',
    description: 'Add your business name, choose your category, and upload your brand logo.',
  },
  {
    number: 3,
    icon: QrCode,
    title: 'Create QR & Menu',
    description: 'Generate your branded QR code and configure your customer digital menu or services.',
  },
  {
    number: 4,
    icon: Rocket,
    title: 'Go Live',
    description: 'Start your 1-day free trial, place your QR at tables or checkout, and watch reviews roll in.',
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="border-t border-slate-100 bg-white py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-left mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold uppercase tracking-wider mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
            GET STARTED IN MINUTES
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
            Go Live in 4 Simple Steps
          </h2>
          <p className="mt-2 text-slate-600 text-sm sm:text-base max-w-2xl">
            Start your free trial and see the results for yourself. No complex IT installation or card details required.
          </p>
        </div>

        {/* 4 Steps Horizontal Timeline matching the reference screenshot */}
        <div className="relative">
          {/* Subtle connection line for desktop */}
          <div className="hidden lg:block absolute top-6 left-[6%] right-[6%] h-0.5 bg-slate-200 z-0" />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 relative z-10">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.number}
                  className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_18px_40px_rgba(30,64,175,0.10)]"
                >
                  <div>
                    {/* Step number badge & icon */}
                    <div className="flex items-center gap-3 mb-5">
                       <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white shadow-sm">
                        {step.number}
                      </div>
                       <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                        <Icon className="w-5 h-5" />
                      </div>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                      {step.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      {step.description}
                    </p>
                  </div>

                  <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-400 group-hover:text-blue-600 transition-colors">
                    <span>Step {step.number} of 4</span>
                    <span className="text-blue-600">→</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom CTA bar */}
        <div className="mt-12 text-center">
          <Link
            href="/onboarding"
                  className="public-focus-ring inline-flex items-center gap-2 rounded-xl bg-slate-950 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-blue-700"
          >
            <span>Start 1-Day Free Trial</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

      </div>
    </section>
  );
}
