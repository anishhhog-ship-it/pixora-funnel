'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  QrCode, 
  Star, 
  Zap, 
  Activity, 
  ShieldCheck, 
  TrendingUp, 
  ArrowUpRight 
} from 'lucide-react';
import { statsService, BASELINE_STATS, PlatformStats } from '@/services/statsService';

function AnimatedNumber({ value, prefix = '', suffix = '' }: { value: number; prefix?: string; suffix?: string }) {
  const [displayValue, setDisplayValue] = useState<number>(Math.max(0, value - 30));
  const prevValueRef = useRef<number>(value);

  useEffect(() => {
    const startVal = displayValue;
    const endVal = value;
    const duration = 1200; // ms
    const startTime = performance.now();

    const updateCounter = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutExpo easing function
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = Math.floor(startVal + (endVal - startVal) * ease);
      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(updateCounter);
      } else {
        setDisplayValue(endVal);
      }
    };

    requestAnimationFrame(updateCounter);
    prevValueRef.current = value;
  }, [value]);

  return (
    <span suppressHydrationWarning className="font-extrabold tracking-tight tabular-nums font-mono">
      {prefix}
      {displayValue.toLocaleString('en-IN')}
      {suffix}
    </span>
  );
}

export default function StatsCounterSection() {
  const [stats, setStats] = useState<PlatformStats>(BASELINE_STATS);
  const [justUpdated, setJustUpdated] = useState<boolean>(false);

  useEffect(() => {
    // Initial load
    setStats(statsService.getStats());

    // Subscribe to live updates across tabs or admin actions
    const unsubscribe = statsService.subscribe((updated) => {
      setStats(updated);
      setJustUpdated(true);
      const timer = setTimeout(() => setJustUpdated(false), 2500);
      return () => clearTimeout(timer);
    });

    return unsubscribe;
  }, []);

  const metricCards = [
    {
      id: 'demos',
      label: 'Demos Provided',
      value: stats.demosProvided,
      suffix: '+',
      description: 'Business demo funnels generated & tested',
      icon: Sparkles,
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-50 border-blue-100',
      badge: 'Auto-Increases on Trial',
      badgeColor: 'text-blue-700 bg-blue-50/90 border-blue-200/80',
      borderHover: 'hover:border-blue-300',
      gradient: 'from-blue-100/50 via-blue-50/20 to-transparent',
    },
    {
      id: 'live-funnels',
      label: 'Active Review Funnels',
      value: stats.liveFunnels,
      suffix: '+',
      description: 'Live on dining tables & reception counters',
      icon: QrCode,
      iconColor: 'text-emerald-600',
      iconBg: 'bg-emerald-50 border-emerald-100',
      badge: 'Auto-Increases on Admin Activate',
      badgeColor: 'text-emerald-700 bg-emerald-50/90 border-emerald-200/80',
      borderHover: 'hover:border-emerald-300',
      gradient: 'from-emerald-100/50 via-emerald-50/20 to-transparent',
    },
    {
      id: 'reviews',
      label: 'Reviews Delivered',
      value: stats.reviewsDelivered,
      suffix: '+',
      description: 'Genuine 5-star ratings routed to Google Maps',
      icon: Star,
      iconColor: 'text-amber-500',
      iconBg: 'bg-amber-50 border-amber-100',
      badge: 'Google Verified Routing',
      badgeColor: 'text-amber-800 bg-amber-50/90 border-amber-200/80',
      borderHover: 'hover:border-amber-300',
      gradient: 'from-amber-100/50 via-amber-50/20 to-transparent',
    },
    {
      id: 'replies',
      label: 'AI Auto-Replies Sent',
      value: stats.autoRepliesSent,
      suffix: '+',
      description: 'Instant personalized customer appreciation',
      icon: Zap,
      iconColor: 'text-purple-600',
      iconBg: 'bg-purple-50 border-purple-100',
      badge: 'Zero Effort for Owners',
      badgeColor: 'text-purple-700 bg-purple-50/90 border-purple-200/80',
      borderHover: 'hover:border-purple-300',
      gradient: 'from-purple-100/50 via-purple-50/20 to-transparent',
    },
  ];

  return (
    <section id="stats" className="relative py-14 sm:py-18 bg-slate-50/60 text-slate-900 overflow-hidden border-y border-slate-200/70">
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-100/40 rounded-full blur-3xl -translate-y-1/2" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-100/40 rounded-full blur-3xl translate-y-1/2" />
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #0f172a 1px, transparent 0)`,
            backgroundSize: '32px 32px'
          }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Strip with Live Activity Indicator */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-10 pb-6 border-b border-slate-200/80">
          <div className="text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-xs font-semibold text-emerald-800 mb-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="tracking-wide uppercase text-[11px] font-bold text-emerald-700">
                Live Ecosystem Pulse
              </span>
              <span className="text-emerald-300">|</span>
              <span className="text-emerald-700 text-[11px]">Real-time system telemetry</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Powering India&apos;s Fastest Growing Local Brands
            </h2>
          </div>

          {/* Real-time sync notice */}
          <div className={`transition-all duration-300 px-4 py-2 rounded-xl text-xs font-medium border flex items-center gap-2 ${
            justUpdated 
              ? 'bg-emerald-50 border-emerald-300 text-emerald-800 shadow-md shadow-emerald-500/10 scale-105' 
              : 'bg-white border-slate-200/90 text-slate-600 shadow-2xs'
          }`}>
            <Activity className={`w-3.5 h-3.5 ${justUpdated ? 'text-emerald-600 animate-spin' : 'text-slate-500'}`} />
            <span>
              {justUpdated ? '⚡ Live counter updated just now!' : 'Live sync active with admin & onboarding'}
            </span>
          </div>
        </div>

        {/* 4 Core Numbers Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {metricCards.map((card) => {
            const IconComponent = card.icon;
            return (
              <div
                key={card.id}
                className={`group relative rounded-2xl p-6 bg-white border border-slate-200/90 ${card.borderHover} transition-all duration-300 shadow-xs hover:shadow-lg hover:-translate-y-0.5 overflow-hidden flex flex-col justify-between`}
              >
                {/* Subtle Glow on hover */}
                <div className={`absolute -right-10 -top-10 w-32 h-32 bg-gradient-to-br ${card.gradient} rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity`} />

                <div>
                  {/* Top: Icon & Badge */}
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center border shadow-2xs ${card.iconBg}`}>
                      <IconComponent className={`w-5 h-5 ${card.iconColor}`} />
                    </div>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${card.badgeColor}`}>
                      {card.badge}
                    </span>
                  </div>

                  {/* Number Value */}
                  <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-1.5 flex items-baseline gap-1">
                    <AnimatedNumber value={card.value} suffix={card.suffix} />
                  </div>

                  {/* Label */}
                  <h3 className="text-sm sm:text-base font-bold text-slate-800 mb-1">
                    {card.label}
                  </h3>

                  {/* Description */}
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {card.description}
                  </p>
                </div>

                {/* Bottom live indicator */}
                <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>Real-time metric</span>
                  </span>
                  <span className="font-mono text-emerald-600 font-semibold text-[10px] bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                    Active
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Social Proof Bar */}
        <div className="mt-8 pt-6 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Trusted across fine-dining restaurants, cafés, luxury salons, and healthcare clinics.</span>
          </div>
          <div className="flex items-center gap-1 font-semibold text-blue-600">
            <span>Every scan directly protects owner reputation</span>
            <TrendingUp className="w-3.5 h-3.5" />
          </div>
        </div>

      </div>
    </section>
  );
}
