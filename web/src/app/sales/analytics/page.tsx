'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { SalesDashboardMetrics } from '@/types/sales';
import {
  BarChart3,
  TrendingUp,
  Users,
  Sparkles,
  ArrowRightLeft,
  CreditCard,
  ShieldCheck,
  Calendar,
  Layers,
  CheckCircle2,
} from 'lucide-react';

export default function SalesAnalyticsReportPage() {
  const [metrics, setMetrics] = useState<SalesDashboardMetrics | null>(null);
  const [performanceTrend, setPerformanceTrend] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        const res = await fetch('/api/sales/analytics', {
          headers: { Authorization: session ? `Bearer ${session.access_token}` : '' },
        });
        const data = await res.json();
        if (data.success) {
          setMetrics(data.metrics);
          setPerformanceTrend(data.performanceTrend || []);
        }
      } catch (e) {
        console.warn('Analytics report error:', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="py-24 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#5356EC] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const stageKeys = [
    'New Lead',
    'Contacted',
    'Qualified',
    'Demo In Progress',
    'Demo Shared',
    'Follow-up',
    'Payment Pending',
    'Won',
    'Activated',
  ];

  const totalLeads = metrics?.totalProspects || 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-[#5356EC]" />
          <span>Sales Telemetry &amp; Conversion Analytics</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Real-time pipeline progression, deal velocity, and verified commercial revenue.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
          <span className="text-slate-500 text-xs font-semibold">Total Pipeline Leads</span>
          <p className="text-2xl font-bold text-slate-900 mt-2">{metrics?.totalProspects || 0}</p>
          <span className="text-[11px] text-emerald-700 font-medium mt-1 inline-block">
            {metrics?.qualifiedLeads || 0} Qualified
          </span>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
          <span className="text-slate-500 text-xs font-semibold">Interactive Demos</span>
          <p className="text-2xl font-bold text-slate-900 mt-2">{metrics?.demosCreated || 0}</p>
          <span className="text-[11px] text-[#5356EC] font-medium mt-1 inline-block">
            {metrics?.demosShared || 0} Shared with prospects
          </span>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
          <span className="text-slate-500 text-xs font-semibold">Verified Paid Deals</span>
          <p className="text-2xl font-bold text-emerald-700 mt-2">{metrics?.wonDeals || 0}</p>
          <span className="text-[11px] text-slate-500 font-medium mt-1 inline-block">
            {metrics?.paymentPendingOrders || 0} Pending approvals
          </span>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
          <span className="text-slate-500 text-xs font-semibold">Collected Revenue</span>
          <p className="text-2xl font-bold text-slate-900 mt-2">
            ₹{(metrics?.actualRevenueCollectedInr || 0).toLocaleString('en-IN')}
          </p>
          <span className="text-[11px] text-emerald-700 font-medium mt-1 inline-block">
            100% verified transactions
          </span>
        </div>
      </div>

      {/* Pipeline Funnel Stage Distribution */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Pipeline Stage Progression</h3>
            <p className="text-xs text-slate-500 mt-0.5">Real count of prospects moving through the conversion funnel</p>
          </div>
          <span className="text-xs font-bold text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1 rounded-full">
            {totalLeads} Total Leads
          </span>
        </div>

        <div className="space-y-3">
          {stageKeys.map((stage) => {
            const count = (metrics?.stagePipeline as any)?.[stage] || 0;
            const pct = totalLeads > 0 ? Math.round((count / totalLeads) * 100) : 0;
            return (
              <div key={stage} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800">{stage}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{count}</span>
                    <span className="text-slate-400 font-mono text-[11px]">({pct}%)</span>
                  </div>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#5356EC] rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Source Breakdown & 30-Day Velocity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Source Channels */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 text-base">Lead Generation Channels</h3>
          <div className="space-y-3">
            {Object.entries(metrics?.leadSourceBreakdown || {}).map(([src, count]) => {
              const pct = totalLeads > 0 ? Math.round((Number(count) / totalLeads) * 100) : 0;
              return (
                <div key={src} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-xs font-semibold text-slate-800">{src}</span>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="font-bold text-slate-900">{count}</span>
                    <span className="text-slate-400 text-[11px] font-mono">{pct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 30-Day Trend */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 text-base">30-Day Weekly Velocity</h3>
          <div className="space-y-3">
            {performanceTrend.map((t, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800">{t.date}</span>
                <div className="flex items-center gap-4">
                  <span className="text-slate-600">
                    Leads: <strong className="text-slate-900">{t.leads}</strong>
                  </span>
                  <span className="text-indigo-700">
                    Demos: <strong className="text-[#5356EC]">{t.demos}</strong>
                  </span>
                  <span className="text-emerald-700">
                    Won: <strong>{t.conversions}</strong>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
