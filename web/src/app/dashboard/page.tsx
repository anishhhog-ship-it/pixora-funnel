'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Star, 
  QrCode, 
  MousePointerClick, 
  ArrowRight, 
  Bot, 
  Edit2, 
  MoreVertical, 
  CheckCircle, 
  Clock, 
  Smartphone, 
  Download,
  ExternalLink,
  MessageSquare,
  UtensilsCrossed,
  BarChart2,
  Sparkles,
  ShieldCheck,
  Plus,
  Users,
  ChevronDown,
  Copy,
  Check,
  Calendar,
  ChevronRight
} from 'lucide-react';
import Image from 'next/image';
import { businessService, analyticsService, reviewService, menuService, getCatalogTerminology, googleBusinessProfileService } from '@/services';
import { GoogleConnectionBadge, GoogleBadgeStatus } from '@/components/GoogleConnectionBadge';
import { Business, Review, MenuItem, Analytics } from '@/types';
import { cn, copyToClipboard } from '@/lib/utils';
import { triggerPwaInstall } from '@/components/PwaInstallPrompt';
import {
  PortalErrorState,
  PortalLoadingState,
  PortalStatCard,
} from '@/components/client-portal/PortalUI';

export default function DashboardHome() {
  const [activeBiz, setActiveBiz] = useState<Business | null>(null);
  const [googleStatus, setGoogleStatus] = useState<GoogleBadgeStatus>('not_connected');
  const [lastSyncedAt, setLastSyncedAt] = useState<string | undefined>(undefined);
  const [analytics, setAnalytics] = useState<Analytics>({
    googleReviews: 0,
    googleReviewsGrowth: 0,
    menuViews: 0,
    menuViewsGrowth: 0,
    qrScans: 0,
    qrScansGrowth: 0,
    reviewSubmissions: 0,
    reviewSubmissionsGrowth: 0,
    customers: 0,
    customersGrowth: 0,
    automatedReplies: 0,
    automatedRepliesGrowth: 0,
  });
  const [reviews, setReviews] = useState<Review[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [copiedQrLink, setCopiedQrLink] = useState(false);

  // Date Selection State
  type DateRangePreset = 'today' | '7d' | '30d' | 'this_month' | '90d' | 'all' | 'custom';
  const [dateRange, setDateRange] = useState<DateRangePreset>('30d');
  const [customStart, setCustomStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [customEnd, setCustomEnd] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);
  const [isChartDateDropdownOpen, setIsChartDateDropdownOpen] = useState(false);

  const headerDateRef = useRef<HTMLDivElement>(null);
  const chartDateRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (headerDateRef.current && !headerDateRef.current.contains(event.target as Node)) {
        setIsDateDropdownOpen(false);
      }
      if (chartDateRef.current && !chartDateRef.current.contains(event.target as Node)) {
        setIsChartDateDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const DATE_RANGE_OPTIONS: { id: DateRangePreset; label: string; period: string }[] = [
    { id: 'today', label: 'Today', period: 'Last 24 hours' },
    { id: '7d', label: 'Last 7 Days', period: 'Past 7 days' },
    { id: '30d', label: 'Last 30 Days', period: 'Past 30 days (Default)' },
    { id: 'this_month', label: 'This Month', period: 'Current calendar month' },
    { id: '90d', label: 'Last 90 Days', period: 'Past 3 months' },
    { id: 'all', label: 'All Time', period: 'All recorded activity' },
  ];

  const getDateRangeLabel = () => {
    if (dateRange === 'today') return 'Today';
    if (dateRange === '7d') return 'Last 7 Days';
    if (dateRange === '30d') return 'Last 30 Days';
    if (dateRange === 'this_month') return 'This Month';
    if (dateRange === '90d') return 'Last 90 Days';
    if (dateRange === 'all') return 'All Time';
    if (dateRange === 'custom') {
      if (customStart && customEnd) {
        return `${customStart} to ${customEnd}`;
      }
      return 'Custom Range';
    }
    return 'Last 30 Days';
  };

  const isDateInRange = (dateStr?: string) => {
    if (dateRange === 'all') return true;
    if (!dateStr) return false;
    const d = new Date(dateStr).getTime();
    if (isNaN(d)) return true;

    const now = new Date();
    if (dateRange === 'today') {
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      return d >= startOfDay;
    }
    if (dateRange === '7d') {
      const past7 = now.getTime() - 7 * 24 * 60 * 60 * 1000;
      return d >= past7;
    }
    if (dateRange === '30d') {
      const past30 = now.getTime() - 30 * 24 * 60 * 60 * 1000;
      return d >= past30;
    }
    if (dateRange === 'this_month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
      return d >= startOfMonth;
    }
    if (dateRange === '90d') {
      const past90 = now.getTime() - 90 * 24 * 60 * 60 * 1000;
      return d >= past90;
    }
    if (dateRange === 'custom') {
      const startTime = customStart ? new Date(`${customStart}T00:00:00`).getTime() : 0;
      const endTime = customEnd ? new Date(`${customEnd}T23:59:59`).getTime() : Infinity;
      return d >= startTime && d <= endTime;
    }
    return true;
  };

  const filteredReviews = reviews.filter(r => isDateInRange(r.date));
  const activeReviews = filteredReviews.length > 0 ? filteredReviews : (dateRange === 'all' ? reviews : []);

  useEffect(() => {
    let isMounted = true;

    async function loadDashboardData() {
      try {
        setIsLoading(true);
        setLoadError(null);
        const biz = await businessService.getActiveBusiness();
        if (!isMounted) return;
        setActiveBiz(biz);

        if (biz) {
          const [bizAnalytics, bizReviews, bizMenu, connInfo] = await Promise.all([
            analyticsService.getAnalytics(biz.businessId),
            reviewService.getReviews(biz.businessId),
            menuService.getItems(biz.businessId),
            googleBusinessProfileService.getConnectionStatus(biz),
          ]);

          if (isMounted) {
            setAnalytics(bizAnalytics);
            setReviews(bizReviews);
            setMenuItems(bizMenu);
            if (connInfo.status === 'connected') {
              setGoogleStatus('connected');
              setLastSyncedAt(connInfo.lastSyncedAt);
            } else if (connInfo.status === 'reconnect_required') {
              setGoogleStatus('requires_auth');
            } else {
              setGoogleStatus(biz.googlePlaceId ? 'connected' : 'not_connected');
            }
          }
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
        if (isMounted) setLoadError('Dashboard data is temporarily unavailable.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadDashboardData();
    return () => {
      isMounted = false;
    };
  }, [loadAttempt]);

  const bizName = activeBiz?.name || 'Your Business';
  const bizCategory = activeBiz?.category || 'Local Business';
  const bizSlug = activeBiz?.slug || 'your-business';
  const primaryColor = activeBiz?.theme?.primaryColor || '#0B3D2E';

  // Dynamic Terminology based on Category (Menu for restaurant/cafe, Catalogue for others)
  const terminology = getCatalogTerminology(activeBiz?.category);

  // Compute actual rating from real reviews
  const averageRating = (activeReviews.length > 0 ? activeReviews : reviews).length > 0
    ? ((activeReviews.length > 0 ? activeReviews : reviews).reduce((sum, r) => sum + r.rating, 0) / (activeReviews.length > 0 ? activeReviews : reviews).length).toFixed(1)
    : '0.0';

  const displayedReviewCount = dateRange === 'all' 
    ? (analytics.googleReviews || reviews.length) 
    : filteredReviews.length;
  const ratingSource = activeReviews.length > 0 ? activeReviews : reviews;
  const ratingRows = [5, 4, 3, 2, 1].map((stars) => {
    const count = ratingSource.filter((review) => review.rating === stars).length;
    return {
      stars,
      count,
      pct: ratingSource.length > 0 ? Math.round((count / ratingSource.length) * 100) : 0,
      color: stars >= 4 ? 'bg-emerald-500' : stars === 3 ? 'bg-amber-400' : 'bg-rose-400',
    };
  });
  const reviewTopics = Array.from(new Set(reviews.flatMap((review) => review.tags || []))).slice(0, 8);

  if (isLoading) {
    return <PortalLoadingState label="Loading your dashboard" />;
  }

  if (loadError) {
    return <PortalErrorState description={loadError} onRetry={() => setLoadAttempt((attempt) => attempt + 1)} />;
  }

  return (
    <div className="space-y-5 sm:space-y-6 pb-6" suppressHydrationWarning>
      
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1 flex-wrap">
            <h1 className="text-2xl font-bold text-slate-900">
              Good Morning, <span className="font-normal block sm:inline mt-1 sm:mt-0">Here's how your business is doing</span>
            </h1>
            <GoogleConnectionBadge
              status={googleStatus}
              locationName={activeBiz?.name}
              lastSyncedAt={lastSyncedAt}
              compact
            />
          </div>
          <p className="text-sm text-slate-500">Track reviews, customer engagement and manage your funnel — all in one place.</p>
        </div>

        {/* Interactive Date Range Selector Dropdown */}
        <div className="relative" ref={headerDateRef}>
          <button
            type="button"
            onClick={() => setIsDateDropdownOpen(prev => !prev)}
            className="flex items-center gap-2 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-3.5 py-2 text-sm font-semibold text-slate-700 shadow-sm transition active:scale-[0.99] cursor-pointer"
            aria-label="Filter Date Range"
            aria-expanded={isDateDropdownOpen}
          >
            <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
            <span>{getDateRangeLabel()}</span>
            <ChevronDown className={cn("w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200", isDateDropdownOpen && "rotate-180 text-blue-600")} />
          </button>

          {isDateDropdownOpen && (
            <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-2xl shadow-xl border border-slate-200 p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-900">Date Range Filter</span>
                <span className="text-[10px] text-slate-400">
                  Today: {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>

              <div className="space-y-1">
                {DATE_RANGE_OPTIONS.map((opt) => {
                  const isSelected = dateRange === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setDateRange(opt.id);
                        setIsDateDropdownOpen(false);
                      }}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition cursor-pointer",
                        isSelected 
                          ? "bg-blue-50 text-blue-700 font-bold border border-blue-100" 
                          : "text-slate-700 hover:bg-slate-50"
                      )}
                    >
                      <div>
                        <p className="leading-snug">{opt.label}</p>
                        <p className="text-[10px] text-slate-400 font-normal">{opt.period}</p>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {/* Custom Date Range */}
              <div className="mt-3 pt-3 border-t border-slate-100">
                <p className="text-[11px] font-bold text-slate-700 mb-2">Custom Date Range</p>
                <div className="grid grid-cols-2 gap-2 mb-2.5">
                  <div>
                    <label className="text-[10px] text-slate-500 font-medium block mb-1">From</label>
                    <input
                      type="date"
                      value={customStart}
                      onChange={(e) => setCustomStart(e.target.value)}
                      className="w-full text-xs px-2 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-medium block mb-1">To</label>
                    <input
                      type="date"
                      value={customEnd}
                      onChange={(e) => setCustomEnd(e.target.value)}
                      className="w-full text-xs px-2 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (customStart && customEnd) {
                      setDateRange('custom');
                      setIsDateDropdownOpen(false);
                    }
                  }}
                  className="w-full py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition cursor-pointer text-center"
                >
                  Apply Custom Range
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Mobile PWA Install Quick Card (Shown on mobile devices) ── */}
      <div className="md:hidden bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white rounded-2xl p-3.5 shadow-md border border-slate-700/80 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <Smartphone className="w-5 h-5" />
          </div>
          <div className="truncate">
            <div className="flex items-center gap-1.5">
              <h4 className="text-xs font-bold text-white truncate">Install Pixora Client App</h4>
              <span className="text-[9px] font-bold bg-emerald-400 text-slate-950 px-1 rounded uppercase shrink-0">PWA</span>
            </div>
            <p className="text-[11px] text-slate-300 truncate mt-0.5">1-tap access on your home screen</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => triggerPwaInstall()}
          className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shrink-0 shadow-sm active:scale-95 transition flex items-center gap-1 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Install</span>
        </button>
      </div>

      {/* ── Live Stats Row (REAL DATA ONLY) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-5">
        <StatCard
          icon={<Star className="w-5 h-5 fill-amber-400 text-amber-400" />}
          iconBg="bg-amber-50"
          value={displayedReviewCount}
          trend={analytics.googleReviewsGrowth > 0 ? `+${analytics.googleReviewsGrowth}%` : 'Live'}
          title="Total Reviews"
          sub={dateRange === 'all' ? "Google Map reviews" : `${getDateRangeLabel()} reviews`}
        />
        <StatCard
          icon={<QrCode className="w-5 h-5 text-blue-600" />}
          iconBg="bg-blue-50"
          value={analytics.qrScans}
          trend={analytics.qrScansGrowth > 0 ? `+${analytics.qrScansGrowth}%` : 'Live'}
          title="QR Scans"
          sub="Table scans"
        />
        <StatCard
          icon={
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
            </svg>
          }
          iconBg="bg-purple-50"
          value={analytics.menuViews}
          trend={analytics.menuViewsGrowth > 0 ? `+${analytics.menuViewsGrowth}%` : 'Live'}
          title={terminology.viewsMetricLabel}
          sub={terminology.isFood ? "Catalog interactions" : "Product & service views"}
        />
        <StatCard
          icon={<Users className="w-5 h-5 text-emerald-600" />}
          iconBg="bg-emerald-50"
          value={analytics.customers}
          trend={analytics.customersGrowth > 0 ? `+${analytics.customersGrowth}%` : 'Live'}
          title="Customers"
          sub="Unique visitors"
        />
        <StatCard
          icon={<MessageSquare className="w-5 h-5 text-rose-500" />}
          iconBg="bg-rose-50"
          value={analytics.automatedReplies}
          trend={analytics.automatedRepliesGrowth > 0 ? `+${analytics.automatedRepliesGrowth}%` : 'Live'}
          title="Automated Replies"
          sub="AI generated"
        />
      </div>

      {/* ── Charts & Widgets Row ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Main Chart Column (Span 2) */}
        <div className="xl:col-span-2 space-y-5">
          {/* Customer Engagement Chart */}
          <div className="bg-white rounded-2xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] border border-slate-200 p-5 h-[320px] flex flex-col justify-between">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-900 text-base">Customer Engagement</h3>
              <div className="flex items-center gap-4">
                <div className="hidden sm:flex items-center gap-3 text-[11px] font-medium">
                  <span className="flex items-center gap-1.5 text-slate-600"><div className="w-2 h-2 rounded-full bg-blue-500"></div>QR Scans</span>
                  <span className="flex items-center gap-1.5 text-slate-600"><div className="w-2 h-2 rounded-full bg-emerald-500"></div>Reviews</span>
                  <span className="flex items-center gap-1.5 text-slate-600"><div className="w-2 h-2 rounded-full bg-purple-500"></div>{terminology.viewsMetricLabel}</span>
                </div>
                {/* Working Date Selection Dropdown */}
                <div className="relative" ref={chartDateRef}>
                  <button
                    type="button"
                    onClick={() => setIsChartDateDropdownOpen(prev => !prev)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 rounded-lg px-2.5 py-1.5 cursor-pointer transition shadow-2xs"
                    aria-label="Select Engagement Date Range"
                    aria-expanded={isChartDateDropdownOpen}
                  >
                    <span>{getDateRangeLabel()}</span>
                    <ChevronDown className={cn("w-3 h-3 text-slate-500 transition-transform duration-200", isChartDateDropdownOpen && "rotate-180 text-blue-600")} />
                  </button>

                  {isChartDateDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                      <div className="px-3 py-1.5 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Select Date Range
                      </div>
                      {DATE_RANGE_OPTIONS.map((opt) => {
                        const isSelected = dateRange === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => {
                              setDateRange(opt.id);
                              setIsChartDateDropdownOpen(false);
                            }}
                            className={cn(
                              "w-full text-left px-3 py-2 text-xs flex items-center justify-between transition cursor-pointer hover:bg-slate-50",
                              isSelected ? "font-bold text-blue-600 bg-blue-50/60" : "text-slate-700"
                            )}
                          >
                            <span>{opt.label}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-blue-600" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
              <BarChart2 className="w-8 h-8 text-slate-300 mb-2" />
              <p className="text-sm font-semibold text-slate-500">No Engagement Data in {getDateRangeLabel()}</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">Share your QR code to start tracking scans, {terminology.viewsMetricLabel.toLowerCase()}, and reviews.</p>
            </div>
          </div>

          {/* Latest Reviews (REAL DATA ONLY) */}
          <div className="bg-white rounded-2xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] border border-slate-200 p-5">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-base">Latest Reviews</h3>
                <GoogleConnectionBadge status={googleStatus} compact />
              </div>
              <Link href="/dashboard/reviews" className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition">
                View All
              </Link>
            </div>

            {filteredReviews.length > 0 ? (
              <div className="space-y-0">
                {filteredReviews.slice(0, 4).map((review, i) => (
                  <div key={review.reviewId} className={cn("flex gap-3 py-3", i !== 0 && "border-t border-slate-100")}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-xs" style={{ backgroundColor: ['#8B5CF6', '#F59E0B', '#3B82F6', '#EF4444', '#10B981'][i % 5] }}>
                      {review.reviewerName.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-semibold text-sm text-slate-900 truncate">{review.reviewerName}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] text-slate-400">{new Date(review.date).toLocaleDateString()}</span>
                          <GoogleIcon />
                          <MoreVertical className="w-3.5 h-3.5 text-slate-400 cursor-pointer" />
                        </div>
                      </div>
                      <div className="flex mb-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={cn('w-3 h-3', i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200')} />
                        ))}
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-2">{review.text || '5-star rating left via Pixora funnel.'}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : reviews.length > 0 ? (
              <div className="flex flex-col items-center justify-center text-center p-8 border border-dashed border-slate-200 rounded-xl my-2">
                <Calendar className="w-6 h-6 text-slate-300 mb-2" />
                <h4 className="text-sm font-bold text-slate-900">No Reviews in {getDateRangeLabel()}</h4>
                <p className="text-xs text-slate-500 max-w-sm mt-1 mb-3">
                  You have {reviews.length} total reviews, but none were recorded in this specific time window.
                </p>
                <button
                  type="button"
                  onClick={() => setDateRange('all')}
                  className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold text-xs transition cursor-pointer"
                >
                  View All Time Reviews ({reviews.length})
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-8 border border-dashed border-slate-200 rounded-xl my-2">
                <Star className="w-6 h-6 text-slate-300 mb-2" />
                <h4 className="text-sm font-bold text-slate-900">No Google Reviews Yet</h4>
                <p className="text-xs text-slate-500 max-w-sm mt-1">
                  Connect your Google Business Profile to start syncing live reviews.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar Widgets */}
        <div className="xl:col-span-1 space-y-5">
          {/* Your QR Code */}
          <div className="bg-white rounded-2xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] border border-slate-200 p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-900 text-sm">Your QR Code</h3>
              <Link href="/dashboard/qr" className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 transition">Customize</Link>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl mb-3 flex items-center justify-center">
                <QRCodeSVG
                  id="dashboard-qr-svg"
                  value={typeof window !== 'undefined' ? `${window.location.origin}/f/${bizSlug}` : `https://funnel.pixoraautomations.com/f/${bizSlug}`}
                  size={120}
                  level="Q"
                  includeMargin={false}
                  className="w-24 h-24"
                />
              </div>

              {/* Link below QR with working Copy Button */}
              <div className="w-full mb-3">
                <button
                  type="button"
                  onClick={async () => {
                    const fullUrl = typeof window !== 'undefined' 
                      ? `${window.location.origin}/f/${bizSlug}` 
                      : `https://funnel.pixoraautomations.com/f/${bizSlug}`;
                    const ok = await copyToClipboard(fullUrl);
                    if (ok) {
                      setCopiedQrLink(true);
                      setTimeout(() => setCopiedQrLink(false), 2500);
                    }
                  }}
                  className={cn(
                    "flex items-center justify-between gap-2 border rounded-xl px-3 py-2 w-full text-xs font-medium transition-all cursor-pointer group text-left",
                    copiedQrLink
                      ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                      : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300"
                  )}
                  title="Click to copy funnel URL to clipboard"
                >
                  <span className="truncate font-mono text-[11px] text-slate-600 select-all flex-1 min-w-0">
                    {typeof window !== 'undefined' ? `${window.location.host}/f/${bizSlug}` : `funnel.pixoraautomations.com/f/${bizSlug}`}
                  </span>
                  
                  <div className="shrink-0 flex items-center gap-1 ml-1.5">
                    {copiedQrLink ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                        <Check className="w-3.5 h-3.5" />
                        <span>Copied!</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 group-hover:text-blue-600 bg-white border border-slate-200 group-hover:border-blue-200 px-2 py-0.5 rounded-md shadow-2xs">
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </span>
                    )}
                  </div>
                </button>
              </div>

              <a 
                href={`https://api.qrserver.com/v1/create-qr-code/?size=800x800&data=${encodeURIComponent(typeof window !== 'undefined' ? `${window.location.origin}/f/${bizSlug}` : `https://funnel.pixoraautomations.com/f/${bizSlug}`)}&download=1`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-2 rounded-lg transition mb-2 shadow-2xs"
              >
                <Download className="w-3.5 h-3.5" /> Download QR
              </a>
              <a href={`/f/${bizSlug}`} target="_blank" rel="noopener noreferrer" className="w-full flex items-center justify-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs py-2 rounded-lg transition">
                <ExternalLink className="w-3.5 h-3.5" /> View Funnel
              </a>
            </div>
          </div>

          {/* Quick Setup */}
          {(() => {
            const isGoogleConnected = Boolean(
              activeBiz?.googleReviewUrl || 
              (activeBiz?.googlePlaceId && activeBiz.googlePlaceId !== 'https://maps.google.com')
            );
            const isAutoReplyActive = activeBiz?.planStatus === 'active' || (
              typeof window !== 'undefined' && 
              (localStorage.getItem(`auto_reply_enabled_${activeBiz?.businessId}`) === 'true' ||
               localStorage.getItem(`auto_reply_enabled_${activeBiz?.slug}`) === 'true')
            );
            const isAppearanceCustomized = Boolean(
              activeBiz?.theme?.primaryColor || 
              activeBiz?.theme?.logo || 
              activeBiz?.coverImage
            );

            const setupSteps = [
              { 
                label: 'Connect Google Business', 
                sub: isGoogleConnected ? 'Google profile connected' : 'Connect Maps & Review link',
                href: '/dashboard/settings',
                external: false,
                done: isGoogleConnected,
              },
              { 
                label: 'Create Your Funnel', 
                sub: 'Live customer review funnel',
                href: `/f/${bizSlug}`,
                external: true,
                done: Boolean(activeBiz?.slug),
              },
              { 
                label: 'Design Your QR Code', 
                sub: 'Custom stands & download print formats',
                href: '/dashboard/qr',
                external: false,
                done: true,
              },
              { 
                label: terminology.isFood ? 'Add Menu (Optional)' : 'Add Catalogue (Optional)', 
                sub: menuItems.length > 0 ? `${menuItems.length} items published` : 'Upload items & prices',
                href: '/dashboard/menu',
                external: false,
                done: menuItems.length > 0,
              },
              { 
                label: 'AI Auto Replies (Beta)', 
                sub: 'Beta launch in 7 days · Locked for private testing',
                href: '/dashboard/auto-reply',
                external: false,
                done: false,
              },
              { 
                label: 'Customize Appearance', 
                sub: 'Theme colors, brand logo & background',
                href: '/dashboard/settings',
                external: false,
                done: isAppearanceCustomized,
              },
            ];

            const completedCount = setupSteps.filter(s => s.done).length;
            const progressPercent = Math.round((completedCount / setupSteps.length) * 100);

            return (
              <div className="bg-white rounded-2xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] border border-slate-200 p-5">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-bold text-slate-900 text-sm">Quick Setup</h3>
                  <span className="text-[10px] text-slate-600 font-semibold bg-slate-100 px-2 py-0.5 rounded-full">
                    {completedCount} of {setupSteps.length} completed
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mb-4">
                  <div 
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                
                <div className="space-y-1.5">
                  {setupSteps.map((step, i) => {
                    const rowContent = (
                      <div className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 active:bg-slate-100 transition-all group cursor-pointer border border-transparent hover:border-slate-100">
                        <div className="flex items-center gap-2.5 min-w-0">
                          {step.done ? (
                            <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                          ) : (
                            <div className="w-4 h-4 rounded-full border-2 border-slate-300 group-hover:border-blue-500 shrink-0 transition-colors" />
                          )}
                          <div className="min-w-0">
                            <span className={cn(
                              "text-xs font-semibold block truncate transition-colors", 
                              step.done ? "text-slate-800" : "text-slate-600 group-hover:text-blue-600"
                            )}>
                              {step.label}
                            </span>
                            <span className="text-[10px] text-slate-400 block truncate group-hover:text-slate-500">
                              {step.sub}
                            </span>
                          </div>
                        </div>
                        {step.external ? (
                          <ExternalLink className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-600 group-hover:scale-110 transition-all shrink-0 ml-1.5" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all shrink-0 ml-1.5" />
                        )}
                      </div>
                    );

                    return step.external ? (
                      <a 
                        key={i} 
                        href={step.href} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="block"
                        title={`Open ${step.label}`}
                      >
                        {rowContent}
                      </a>
                    ) : (
                      <Link 
                        key={i} 
                        href={step.href} 
                        className="block"
                        title={`Navigate to ${step.label}`}
                      >
                        {rowContent}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })()}
          {/* Reviews by Rating */}
          <div className="bg-white rounded-2xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] border border-slate-200 p-5">
            <h3 className="font-bold text-slate-900 text-sm mb-4">Reviews by Rating</h3>
            <div className="space-y-3">
              {ratingRows.map(row => (
                <div key={row.stars} className="flex items-center gap-3 text-xs">
                  <div className="flex items-center gap-1 w-12 text-slate-700 font-medium">
                    {row.stars} <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  </div>
                  <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className={cn("h-full rounded-full", row.color)} style={{ width: `${row.pct}%` }} />
                  </div>
                  <div className="w-8 text-right text-slate-500">{row.count}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Review Topics */}
          <div className="bg-white rounded-2xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] border border-slate-200 p-5">
            <h3 className="font-bold text-slate-900 text-sm mb-4">Top Review Topics</h3>
            <div className="flex flex-wrap gap-2">
              {reviewTopics.length > 0 ? reviewTopics.map((topic, index) => (
                <div key={topic} className={cn(
                  'rounded-lg border px-3 py-1.5 text-xs font-medium',
                  index % 3 === 0 ? 'border-emerald-100 bg-emerald-50 text-emerald-700' :
                  index % 3 === 1 ? 'border-blue-100 bg-blue-50 text-blue-700' :
                  'border-slate-200 bg-slate-50 text-slate-700'
                )}>
                  {topic}
                </div>
              )) : (
                <p className="text-xs leading-relaxed text-slate-500">Topics will appear after reviews include category tags.</p>
              )}
            </div>
          </div>
          
          {/* Mobile App Promo */}
          <div className="bg-blue-50 rounded-2xl border border-blue-100 p-5 flex items-start gap-4">
            <div className="w-10 h-16 bg-slate-900 rounded-lg flex items-center justify-center shrink-0 border-[3px] border-slate-800 relative overflow-hidden">
               <div className="absolute top-1 w-4 h-1 bg-slate-700 rounded-full"></div>
               <Image src="/pixora-icon.png" width={20} height={20} alt="App" className="opacity-80 grayscale" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm mb-1">Take Reviews Anywhere</h4>
              <p className="text-[10px] text-slate-600 leading-relaxed mb-3">Use our mobile app to manage reviews, {terminology.isFood ? 'menu' : 'catalogue'} and QR codes.</p>
              <div className="flex gap-2">
                <button className="bg-slate-900 text-white text-[9px] font-semibold px-2 py-1.5 rounded flex items-center gap-1">App Store</button>
                <button className="bg-slate-900 text-white text-[9px] font-semibold px-2 py-1.5 rounded flex items-center gap-1">Google Play</button>
              </div>
            </div>
          </div>
        </div>
      </div>



    </div>
  );
}

function StatCard({ icon, iconBg, value, trend, title, sub }: any) {
  return (
    <PortalStatCard
      icon={icon}
      iconBackground={iconBg}
      value={typeof value === 'number' ? value.toLocaleString() : value}
      trend={trend}
      title={title}
      description={sub}
    />
  );
}

function ReplyBadge({ status }: { status: string }) {
  if (status === 'replied') return (
    <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full">
      <CheckCircle className="w-2.5 h-2.5" /> Replied
    </span>
  );
  if (status === 'auto_replied') return (
    <span className="flex items-center gap-1 text-[9px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded-full">
      <Bot className="w-2.5 h-2.5" /> Auto Replied
    </span>
  );
  return (
    <span className="flex items-center gap-1 text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-full">
      <Clock className="w-2.5 h-2.5" /> Pending
    </span>
  );
}

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.31-1.03 2.41-2.16 3.16v2.62h3.49c2.04-1.89 3.22-4.67 3.22-7.79z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.49-2.62c-.98.66-2.23 1.05-3.79 1.05-2.91 0-5.38-1.97-6.26-4.62H2.12v2.71C3.94 20.48 7.68 23 12 23z" fill="#34A853"/>
    <path d="M5.74 14.15c-.22-.66-.35-1.36-.35-2.15s.13-1.49.35-2.15V7.14H2.12C1.4 8.59 1 10.25 1 12s.4 3.41 1.12 4.86l3.62-2.71z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.07.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.68 1 3.94 3.52 2.12 7.14l3.62 2.71c.88-2.65 3.35-4.47 6.26-4.47z" fill="#EA4335"/>
  </svg>
);
