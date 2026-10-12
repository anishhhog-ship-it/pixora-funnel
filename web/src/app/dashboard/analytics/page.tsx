'use client';

import { useState, useEffect, useRef } from 'react';
import { Star, QrCode, MousePointerClick, TrendingUp, MapPin, Eye, UtensilsCrossed, BarChart3, ExternalLink, Calendar, ChevronDown, Check } from 'lucide-react';
import { analyticsService, reviewService, menuService, businessService, getCatalogTerminology } from '@/services';
import { Business, Review, MenuItem, AnalyticsData } from '@/types';
import { cn } from '@/lib/utils';

type AnalyticsDateRange = 'all' | 'today' | '7d' | '30d' | '90d';

const ANALYTICS_DATE_OPTIONS: { id: AnalyticsDateRange; label: string }[] = [
  { id: 'all', label: 'All Time' },
  { id: 'today', label: 'Today' },
  { id: '7d', label: 'Last 7 Days' },
  { id: '30d', label: 'Last 30 Days' },
  { id: '90d', label: 'Last 90 Days' },
];

export default function AnalyticsPage() {
  const [activeBiz, setActiveBiz] = useState<Business | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    googleReviews: 0,
    googleReviewsGrowth: 0,
    qrScans: 0,
    qrScansGrowth: 0,
    menuViews: 0,
    menuViewsGrowth: 0,
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
  const [dateRange, setDateRange] = useState<AnalyticsDateRange>('all');
  const [isDateOpen, setIsDateOpen] = useState(false);
  const dateDropdownRef = useRef<HTMLDivElement>(null);

  const terminology = getCatalogTerminology(activeBiz?.category);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dateDropdownRef.current && !dateDropdownRef.current.contains(event.target as Node)) {
        setIsDateOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    async function loadData() {
      const biz = await businessService.getActiveBusiness();
      setActiveBiz(biz);
      const bizId = biz?.businessId || await businessService.getActiveBusinessId();

      const [analyticsData, reviewData, itemsData] = await Promise.all([
        analyticsService.getAnalytics(bizId),
        reviewService.getReviews(bizId),
        menuService.getItems(bizId),
      ]);
      setAnalytics(analyticsData);
      setReviews(reviewData);
      setMenuItems(itemsData);
      setIsLoading(false);
    }
    loadData();
  }, []);

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
      return d >= now.getTime() - 7 * 24 * 60 * 60 * 1000;
    }
    if (dateRange === '30d') {
      return d >= now.getTime() - 30 * 24 * 60 * 60 * 1000;
    }
    if (dateRange === '90d') {
      return d >= now.getTime() - 90 * 24 * 60 * 60 * 1000;
    }
    return true;
  };

  const filteredReviews = reviews.filter(r => isDateInRange(r.date));
  const activeReviews = filteredReviews.length > 0 ? filteredReviews : (dateRange === 'all' ? reviews : []);

  // Compute rating distribution from real reviews
  const totalReviews = dateRange === 'all' ? reviews.length : filteredReviews.length;
  const ratingCounts = {
    5: activeReviews.filter(r => r.rating === 5).length,
    4: activeReviews.filter(r => r.rating === 4).length,
    3: activeReviews.filter(r => r.rating === 3).length,
    2: activeReviews.filter(r => r.rating === 2).length,
    1: activeReviews.filter(r => r.rating === 1).length,
  };

  const hasTraffic = analytics.qrScans > 0 || analytics.menuViews > 0 || totalReviews > 0 || analytics.reviewSubmissions > 0;

  const getLabel = () => {
    return ANALYTICS_DATE_OPTIONS.find(o => o.id === dateRange)?.label || 'All Time';
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-serif font-bold text-gray-900">Analytics & Insights</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Real-time traffic telemetry, customer review conversions, and digital menu engagement.
          </p>
        </div>

        {/* Interactive Date Range Dropdown */}
        <div className="relative" ref={dateDropdownRef}>
          <button
            type="button"
            onClick={() => setIsDateOpen(prev => !prev)}
            className="flex items-center gap-2 text-xs font-semibold px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 text-slate-700 transition cursor-pointer shadow-2xs"
            aria-label="Filter Analytics by Date"
            aria-expanded={isDateOpen}
          >
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            <span>Filter: {getLabel()}</span>
            <ChevronDown className={cn("w-3.5 h-3.5 text-slate-400 transition-transform duration-200", isDateOpen && "rotate-180 text-blue-600")} />
          </button>

          {isDateOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-1 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-1.5 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Time Period
              </div>
              {ANALYTICS_DATE_OPTIONS.map((opt) => {
                const isSelected = dateRange === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setDateRange(opt.id);
                      setIsDateOpen(false);
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

      {/* KPI Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          icon={<Star className="w-5 h-5 fill-amber-400 text-amber-400" />} 
          bg="bg-amber-50" 
          value={totalReviews.toLocaleString()} 
          title="Google Reviews" 
          sub="Customer ratings recorded" 
        />
        <StatCard 
          icon={<Eye className="w-5 h-5 text-rose-500" />} 
          bg="bg-rose-50" 
          value={analytics.menuViews.toLocaleString()} 
          title={terminology.viewsMetricLabel} 
          sub={terminology.isFood ? "Digital menu impressions" : "Digital catalogue impressions"} 
        />
        <StatCard 
          icon={<QrCode className="w-5 h-5 text-gray-700" />} 
          bg="bg-gray-50" 
          value={analytics.qrScans.toLocaleString()} 
          title="QR Scans" 
          sub="In-store QR scans" 
        />
        <StatCard 
          icon={<MousePointerClick className="w-5 h-5 text-emerald-500" />} 
          bg="bg-emerald-50" 
          value={analytics.reviewSubmissions.toLocaleString()} 
          title="Funnel Submissions" 
          sub="Customer feedback shared" 
        />
      </div>

      {!hasTraffic ? (
        /* Clean Polished Empty State when new tenant has 0 data */
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm max-w-2xl mx-auto space-y-4">
          <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
            <BarChart3 className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 font-serif">No Analytics Telemetry Yet</h3>
          <p className="text-xs sm:text-sm text-gray-500 max-w-md mx-auto">
            Your business dashboard is connected and ready. As soon as visitors scan your QR stands, open your {terminology.isFood ? 'menu' : 'catalogue'}, or submit ratings, detailed graphs will render here automatically.
          </p>
          {activeBiz && (
            <div className="pt-2">
              <a
                href={`/f/${activeBiz.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0B3D2E] text-white text-xs font-bold hover:bg-[#12543e] transition-colors"
              >
                <span>Preview Public Funnel Link</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Rating Distribution */}
            <div className="lg:col-span-6 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-bold text-gray-900 mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>
                Review Ratings Breakdown
              </h3>
              <p className="text-xs text-gray-400 mb-4">Distribution across verified Google reviews</p>

              {totalReviews === 0 ? (
                <div className="py-12 text-center text-xs text-gray-400">
                  No star ratings recorded yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {[5, 4, 3, 2, 1].map((stars) => {
                    const count = ratingCounts[stars as keyof typeof ratingCounts] || 0;
                    const pct = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;
                    return (
                      <div key={stars} className="flex items-center gap-3">
                        <div className="flex w-16 items-center gap-1">
                          <span className="text-xs font-semibold text-gray-700">{stars}</span>
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        </div>
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all" 
                            style={{ 
                              width: `${pct}%`, 
                              background: stars >= 4 ? '#0B3D2E' : stars === 3 ? '#F59E0B' : '#EF4444' 
                            }} 
                          />
                        </div>
                        <span className="text-xs font-bold text-gray-700 w-8 text-right">{count}</span>
                        <span className="text-[10px] text-gray-400 w-8 text-right">{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Menu Performance */}
            <div className="lg:col-span-6 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-bold text-gray-900 mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>
                {terminology.isFood ? 'Menu Catalog Summary' : 'Product & Service Catalogue Summary'}
              </h3>
              <p className="text-xs text-gray-400 mb-4">Live items available to customers</p>

              {menuItems.length === 0 ? (
                <div className="py-12 text-center text-xs text-gray-400">
                  No {terminology.itemsLabel.toLowerCase()} created yet. Add items in {terminology.pageTitle} to track interest.
                </div>
              ) : (
                <div className="divide-y divide-gray-50 text-xs">
                  {menuItems.slice(0, 5).map((item, idx) => (
                    <div key={item.itemId} className="py-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="text-gray-400 font-bold w-4">{idx + 1}</span>
                        <span className="font-semibold text-gray-900">{item.name}</span>
                        {item.isBestseller && (
                          <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-bold">
                            Bestseller
                          </span>
                        )}
                      </div>
                      <span className="font-bold text-[#0B3D2E]">₹{item.price}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, bg, value, title, sub }: any) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center gap-3">
      <div className={cn('w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0', bg)}>{icon}</div>
      <div>
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold text-gray-900 leading-none">{value}</span>
        </div>
        <p className="text-xs font-semibold text-gray-800 mt-0.5">{title}</p>
        <p className="text-[10px] text-gray-400">{sub}</p>
      </div>
    </div>
  );
}
