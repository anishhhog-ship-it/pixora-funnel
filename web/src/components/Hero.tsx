'use client';

import Image from 'next/image';
import Link from 'next/link';
import { 
  Play, 
  ArrowRight, 
  Check,
  ChevronDown
} from 'lucide-react';
import { smoothScrollTo } from '@/lib/scrollUtils';

interface HeroProps {
  onOpenDemo?: () => void;
}

export default function Hero({ onOpenDemo }: HeroProps) {
  return (
    <section id="hero" className="relative pt-8 pb-16 lg:pt-14 lg:pb-24 px-4 sm:px-6 lg:px-8 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* LEFT COLUMN: High-Converting Headline & CTAs (5 cols) */}
          <div className="lg:col-span-5 space-y-6 text-left">
            {/* Trust badge with avatar stack */}
            <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200/80 shadow-2xs">
              <div className="flex -space-x-1.5 overflow-hidden">
                <img
                  className="inline-block h-6 w-6 rounded-full ring-2 ring-white object-cover"
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop"
                  alt="Avatar"
                />
                <img
                  className="inline-block h-6 w-6 rounded-full ring-2 ring-white object-cover"
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop"
                  alt="Avatar"
                />
                <img
                  className="inline-block h-6 w-6 rounded-full ring-2 ring-white object-cover"
                  src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop"
                  alt="Avatar"
                />
                <img
                  className="inline-block h-6 w-6 rounded-full ring-2 ring-white object-cover"
                  src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop"
                  alt="Avatar"
                />
              </div>
              <span className="text-[11px] font-semibold text-slate-700 tracking-wider uppercase">
                Trusted by 500+ Local Businesses
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-[3.4rem] font-extrabold text-slate-900 tracking-tight leading-[1.1]">
              More Reviews. <br />
              More Customers. <br />
              <span className="text-blue-600">Higher Revenue.</span>
            </h1>

            {/* Supporting Copy */}
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal max-w-xl">
              Pixora Funnel helps local businesses get more Google reviews with a beautiful QR experience, smart auto replies, digital menu and powerful analytics — all in one simple platform.
            </p>

            {/* Dual CTAs */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Link
                href="/onboarding"
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm sm:text-base h-12 px-6 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99]"
              >
                <span>Start 1 Day Free Trial</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <button
                type="button"
                onClick={onOpenDemo}
                className="bg-white hover:bg-slate-50 text-slate-800 font-semibold text-sm sm:text-base h-12 px-5 rounded-xl border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center">
                  <Play className="w-2.5 h-2.5 fill-current ml-0.5" />
                </div>
                <span>Watch Demo</span>
              </button>
            </div>

            {/* Trust Checkmarks */}
            <div className="pt-2 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium text-slate-500">
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-blue-600 stroke-[3]" />
                <span>No Credit Card Required</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-blue-600 stroke-[3]" />
                <span>Setup in 5 Minutes</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-blue-600 stroke-[3]" />
                <span>Cancel Anytime</span>
              </div>
            </div>

            {/* Animated Scroll Down Indicator */}
            <div className="pt-3">
              <button
                type="button"
                onClick={() => smoothScrollTo('#stats')}
                className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors cursor-pointer group"
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
          <div className="lg:col-span-7 relative flex items-center justify-center">
            <div className="relative w-full max-w-[680px] lg:max-w-none group">
              {/* Subtle ambient backdrop glow */}
              <div className="absolute -inset-4 bg-gradient-to-tr from-blue-100/60 via-indigo-50/40 to-emerald-50/40 rounded-3xl blur-2xl -z-10 opacity-70 group-hover:opacity-90 transition-opacity duration-500" />
              
              <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border border-slate-200/80 bg-white transition-all duration-300 hover:shadow-blue-500/10">
                <Image
                  src="/hero-mockup.jpg"
                  alt="Pixora Funnel Complete Ecosystem - Customer Mobile Experience, Business Dashboard on Laptop, and Table QR Stand"
                  width={1200}
                  height={800}
                  priority
                  className="w-full h-auto object-cover rounded-2xl sm:rounded-3xl select-none"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 58vw, 700px"
                />
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
