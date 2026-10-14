'use client';

import Image from 'next/image';
import Link from 'next/link';
import { 
  Play, 
  ArrowRight, 
  Check,
  ChevronDown,
  QrCode,
  Sparkles
} from 'lucide-react';
import { smoothScrollTo } from '@/lib/scrollUtils';

interface HeroProps {
  onOpenDemo?: () => void;
}

export default function Hero({ onOpenDemo }: HeroProps) {
  return (
    <section id="hero" className="relative isolate overflow-hidden bg-[#fbfcff] px-4 pb-16 pt-8 sm:px-6 lg:px-8 lg:pb-24 lg:pt-14">
      <div className="landing-grid pointer-events-none absolute inset-0 -z-10" aria-hidden="true" />
      <div className="pointer-events-none absolute -right-24 -top-32 -z-10 h-96 w-96 rounded-full bg-blue-100/60 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -bottom-48 left-1/3 -z-10 h-96 w-96 rounded-full bg-emerald-100/50 blur-3xl" aria-hidden="true" />
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* LEFT COLUMN: High-Converting Headline & CTAs (5 cols) */}
          <div className="lg:col-span-5 space-y-6 text-left lg:pr-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200/80 bg-white/80 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-blue-700 shadow-sm backdrop-blur-sm">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                <Sparkles className="h-3 w-3" aria-hidden="true" />
              </span>
              Customer experience, made useful
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl font-extrabold leading-[1.05] tracking-[-0.04em] text-slate-950 sm:text-5xl lg:text-[4rem]">
              Turn every great visit into a <span className="bg-gradient-to-r from-blue-700 via-indigo-600 to-emerald-600 bg-clip-text text-transparent">next step.</span>
            </h1>

            {/* Supporting Copy */}
            <p className="max-w-xl text-base font-normal leading-relaxed text-slate-600 sm:text-lg">
              Pixora Funnel gives local businesses a branded QR and NFC journey for feedback, Google review handoff, menus, and follow-up — in one focused public experience.
            </p>

            {/* Dual CTAs */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Link
                href="/onboarding"
                className="public-focus-ring flex h-12 items-center justify-center gap-2 rounded-xl bg-slate-950 px-6 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(15,23,42,0.18)] transition-all hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-lg active:translate-y-0 active:scale-[0.99] sm:text-base"
              >
                <span>Start 1 Day Free Trial</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <button
                type="button"
                onClick={onOpenDemo}
                className="public-focus-ring flex h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200/90 bg-white px-5 text-sm font-semibold text-slate-800 shadow-sm transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 hover:shadow-md active:translate-y-0 sm:text-base"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-blue-700">
                  <Play className="w-2.5 h-2.5 fill-current ml-0.5" />
                </div>
                <span>Watch Demo</span>
              </button>
            </div>

            {/* Trust Checkmarks */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-2 text-xs font-medium text-slate-500">
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-blue-600 stroke-[3]" />
                <span>Guest flow needs no app</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-blue-600 stroke-[3]" />
                <span>Branded public page</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-blue-600 stroke-[3]" />
                <span>Try before you commit</span>
              </div>
            </div>

            {/* Animated Scroll Down Indicator */}
            <div className="pt-3">
              <button
                type="button"
                onClick={() => smoothScrollTo('#stats')}
                className="public-focus-ring inline-flex cursor-pointer items-center gap-2 rounded-lg text-xs font-semibold text-slate-500 transition-colors hover:text-blue-600 group"
                title="Scroll down to live stats & features"
              >
                <span className="w-4 h-6 rounded-full border-2 border-slate-300 group-hover:border-blue-500 flex items-start justify-center p-0.5 transition-colors">
                  <span className="w-1 h-1.5 rounded-full bg-slate-400 group-hover:bg-blue-600 animate-bounce" />
                </span>
                <span>Scroll down to explore features & pricing</span>
                <ChevronDown className="w-3.5 h-3.5 group-hover:translate-y-0.5 transition-transform" />
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN: Realistic Device Showcase Image (7 cols) */}
          <div className="relative flex items-center justify-center lg:col-span-7">
            <div className="relative w-full max-w-[680px] lg:max-w-none group">
              {/* Subtle ambient backdrop glow */}
              <div className="absolute -inset-5 -z-10 rounded-[2rem] bg-gradient-to-tr from-blue-100/80 via-indigo-50/50 to-emerald-50/70 opacity-80 blur-2xl transition-opacity duration-500 group-hover:opacity-100" />
              
              <div className="relative overflow-hidden rounded-2xl border border-white/80 bg-white p-1.5 shadow-[0_24px_70px_rgba(30,64,175,0.18)] transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_30px_80px_rgba(30,64,175,0.24)] sm:rounded-3xl sm:p-2">
                <Image
                  src="/hero-mockup.jpg"
                  alt="Pixora Funnel Complete Ecosystem - Customer Mobile Experience, Business Dashboard on Laptop, and Table QR Stand"
                  width={1200}
                  height={800}
                  priority
                  className="h-auto w-full select-none rounded-xl object-cover sm:rounded-2xl"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 58vw, 700px"
                />
                <div className="pointer-events-none absolute inset-x-4 bottom-4 flex items-end justify-between gap-3 sm:inset-x-6 sm:bottom-6">
                  <div className="rounded-xl border border-white/60 bg-slate-950/75 px-3 py-2 text-left text-white shadow-lg backdrop-blur-md">
                    <div className="mb-0.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-blue-200">
                      <QrCode className="h-3 w-3" aria-hidden="true" />
                      Customer view
                    </div>
                    <p className="text-[11px] text-white/75">Scan · rate · share</p>
                  </div>
                  <div className="hidden rounded-xl border border-white/60 bg-white/90 px-3 py-2 text-left shadow-lg backdrop-blur-md sm:block">
                    <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Owner view</div>
                    <p className="text-[11px] font-semibold text-slate-800">One place to follow up</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
