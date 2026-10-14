'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  QrCode, 
  Star, 
  Zap, 
  Activity, 
  ShieldCheck, 
  Database,
  Clock3
} from 'lucide-react';
import { statsService, BASELINE_STATS, PlatformStats } from '@/services/statsService';

function AnimatedNumber({ value, prefix = '', suffix = '' }: { value: number; prefix?: string; suffix?: string }) {
  const [displayValue, setDisplayValue] = useState<number>(Math.max(0, value - 30));
  const startValueRef = useRef<number>(Math.max(0, value - 30));

  useEffect(() => {
    const startVal = startValueRef.current;
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
        startValueRef.current = endVal;
      }
    };

    requestAnimationFrame(updateCounter);
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
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Initial load
    let isActive = true;
    Promise.resolve().then(() => {
      if (!isActive) return;
      setStats(statsService.getStats());
      setIsReady(true);
    });

    // Subscribe to live updates across tabs or admin actions
    const unsubscribe = statsService.subscribe((updated) => {
      setStats(updated);
      setJustUpdated(true);
      const timer = setTimeout(() => setJustUpdated(false), 2500);
      return () => clearTimeout(timer);
    });

    return () => {
      isActive = false;
      unsubscribe();
    };
  }, []);

  const metricCards = [
    {
      id: 'demos',
      label: 'Trial starts recorded',
      value: stats.demosProvided,
      description: 'A local event count from the public app',
      icon: Sparkles,
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-50 border-blue-100',
      badge: stats.demosProvided > 0 ? 'Recorded event' : 'No data yet',
      badgeColor: 'text-blue-700 bg-blue-50/90 border-blue-200/80',
      borderHover: 'hover:border-blue-300',
      gradient: 'from-blue-100/50 via-blue-50/20 to-transparent',
    },
    {
      id: 'live-funnels',
      label: 'Funnels activated',
      value: stats.liveFunnels,
      description: 'Activation events recorded for this workspace',
      icon: QrCode,
      iconColor: 'text-emerald-600',
      iconBg: 'bg-emerald-50 border-emerald-100',
      badge: stats.liveFunnels > 0 ? 'Recorded event' : 'No data yet',
      badgeColor: 'text-emerald-700 bg-emerald-50/90 border-emerald-200/80',
      borderHover: 'hover:border-emerald-300',
      gradient: 'from-emerald-100/50 via-emerald-50/20 to-transparent',
    },
    {
      id: 'reviews',
      label: 'Review events recorded',
      value: stats.reviewsDelivered,
      description: 'Review handoff events recorded by the app',
      icon: Star,
      iconColor: 'text-amber-500',
      iconBg: 'bg-amber-50 border-amber-100',
      badge: stats.reviewsDelivered > 0 ? 'Recorded event' : 'No data yet',
      badgeColor: 'text-amber-800 bg-amber-50/90 border-amber-200/80',
      borderHover: 'hover:border-amber-300',
      gradient: 'from-amber-100/50 via-amber-50/20 to-transparent',
    },
    {
      id: 'replies',
      label: 'Reply events recorded',
      value: stats.autoRepliesSent,
      description: 'Reply activity recorded by the app',
      icon: Zap,
      iconColor: 'text-purple-600',
      iconBg: 'bg-purple-50 border-purple-100',
      badge: stats.autoRepliesSent > 0 ? 'Recorded event' : 'No data yet',
      badgeColor: 'text-purple-700 bg-purple-50/90 border-purple-200/80',
      borderHover: 'hover:border-purple-300',
      gradient: 'from-purple-100/50 via-purple-50/20 to-transparent',
    },
  ];

  return (
    <section id="stats" className="relative overflow-hidden border-y border-slate-200/70 bg-slate-50/60 py-14 text-slate-900 sm:py-18">
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
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500" />
              </span>
              <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-600">Transparent activity view</span>
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              See activity when it is actually recorded
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
              This view stays quiet until the app has real events to show. No estimated totals or placeholder social proof.
            </p>
          </div>

          {/* Real-time sync notice */}
          <div className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-medium transition-all duration-300 ${
            justUpdated
              ? 'scale-105 border-emerald-300 bg-emerald-50 text-emerald-800 shadow-md shadow-emerald-500/10'
              : 'border-slate-200/90 bg-white text-slate-600 shadow-sm'
          }`}>
            {isReady ? (
              <Activity className={`h-3.5 w-3.5 ${justUpdated ? 'animate-spin text-emerald-600' : 'text-slate-500'}`} />
            ) : (
              <Clock3 className="h-3.5 w-3.5 animate-pulse text-slate-400" />
            )}
            <span>
              {!isReady ? 'Loading recorded activity…' : justUpdated ? 'Activity updated just now' : 'Waiting for recorded activity'}
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
                className={`group relative flex min-h-[250px] flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg ${card.borderHover}`}
              >
                {/* Subtle Glow on hover */}
                <div className={`absolute -right-10 -top-10 w-32 h-32 bg-gradient-to-br ${card.gradient} rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity`} />

                <div>
                  {/* Top: Icon & Badge */}
                  <div className="mb-4 flex items-center justify-between gap-2">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center border shadow-2xs ${card.iconBg}`}>
                      <IconComponent className={`w-5 h-5 ${card.iconColor}`} />
                    </div>
                      <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${card.badgeColor}`}>
                      {card.badge}
                    </span>
                  </div>

                  {/* Number Value */}
                  <div className="mb-1.5 flex min-h-12 items-baseline gap-1 text-3xl font-extrabold text-slate-900 sm:text-4xl">
                    {!isReady ? (
                      <span className="h-10 w-24 rounded-lg bg-slate-100 funnel-skeleton" aria-label="Loading activity" />
                    ) : card.value > 0 ? (
                      <AnimatedNumber value={card.value} />
                    ) : (
                      <span className="text-slate-300" aria-label="No activity recorded">—</span>
                    )}
                  </div>

                  {/* Label */}
                  <h3 className="text-sm sm:text-base font-bold text-slate-800 mb-1">
                    {card.label}
                  </h3>

                  {/* Description */}
                  <p className="text-xs leading-relaxed text-slate-500">
                    {card.description}
                  </p>
                </div>

                {/* Bottom live indicator */}
                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3.5 text-[11px] text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <span className={`h-1.5 w-1.5 rounded-full ${card.value > 0 ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                    <span>{card.value > 0 ? 'Recorded locally' : 'No record yet'}</span>
                  </span>
                  <span className="flex items-center gap-1 rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-slate-500">
                    <Database className="h-3 w-3" aria-hidden="true" />
                    Local event
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Social Proof Bar */}
        <div className="mt-8 pt-6 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>Counts appear only after the related event is recorded.</span>
          </div>
          <div className="font-semibold text-blue-600">
            <span>Built for a clear customer-to-owner handoff</span>
          </div>
        </div>

      </div>
    </section>
  );
}
