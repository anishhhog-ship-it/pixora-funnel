'use client';

import { useState, useEffect } from 'react';
import type { ComponentType } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { SalesDashboardMetrics } from '@/types/sales';
import {
  Users2,
  Tv,
  Send,
  Trophy,
  Wallet,
  Clock,
  CreditCard,
  UserCheck,
  Package,
  Crown,
  Plus,
  Phone,
  MessageCircle,
  Calendar,
  TrendingUp,
  ArrowUp,
  ExternalLink,
  Sparkles,
  Scissors,
  Coffee,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

interface SalesLeadRow { id: string; business_name: string; contact_name?: string | null; phone?: string | null; lead_source: string; stage: string; updated_at?: string; created_at: string; }
interface FollowupRow { id: string; business_name: string; notes?: string | null; next_followup_date: string; phone?: string | null; }
interface ActivityRow { id: string; title: string; created_at: string; prospect?: { business_name?: string | null } | null; }
interface TrendRow { date: string; leads: number; demos: number; conversions: number; }

export default function WhiteSalesDashboardPage() {
  const [metrics, setMetrics] = useState<SalesDashboardMetrics | null>(null);
  const [recentLeads, setRecentLeads] = useState<SalesLeadRow[]>([]);
  const [todayFollowups, setTodayFollowups] = useState<FollowupRow[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityRow[]>([]);
  const [performanceTrend, setPerformanceTrend] = useState<TrendRow[]>([]);
  const [paymentPendingAmountInr, setPaymentPendingAmountInr] = useState(0);
  const [nfcDispatchedCount, setNfcDispatchedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setError(null);
        const { data: { session } } = await supabase.auth.getSession();
        const res = await fetch('/api/sales/analytics', {
          headers: { Authorization: session ? `Bearer ${session.access_token}` : '' },
        });
        const data = await res.json();
        if (data.success) {
          if (data.metrics) setMetrics(data.metrics);
          if (data.recentLeads) setRecentLeads(data.recentLeads);
          if (data.todayFollowups) setTodayFollowups(data.todayFollowups);
          if (data.recentActivity) setRecentActivity(data.recentActivity);
          if (data.performanceTrend) setPerformanceTrend(data.performanceTrend);
          if (data.paymentPendingAmountInr !== undefined) setPaymentPendingAmountInr(data.paymentPendingAmountInr);
          if (data.nfcDispatchedCount !== undefined) setNfcDispatchedCount(data.nfcDispatchedCount);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Dashboard data could not be loaded.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const totalProspects = metrics?.totalProspects ?? 0;
  const demosCreated = metrics?.demosCreated ?? 0;
  const demosShared = metrics?.demosShared ?? 0;
  const wonDeals = metrics?.wonDeals ?? 0;
  const revenueCollected = metrics?.actualRevenueCollectedInr
    ? `₹${metrics.actualRevenueCollectedInr.toLocaleString('en-IN')}`
    : '₹0';
  const followupsToday = metrics?.followupsDueToday ?? 0;
  const overdueFollowups = metrics?.overdueFollowups ?? 0;
  const paymentPending = metrics?.paymentPendingOrders ?? 0;
  const activeCustomers = metrics?.activatedCustomers ?? 0;
  const nfcPending = metrics?.nfcPendingFulfillment ?? 0;
  const slotsUsed = metrics?.lifetimeSlotsUsed ?? 0;
  const maxSlots = metrics?.lifetimeSlotsMax ?? 100;
  const slotsRemaining = Math.max(0, maxSlots - slotsUsed);
  const trendMax = Math.max(1, ...performanceTrend.flatMap((bucket) => [Number(bucket.leads || 0), Number(bucket.demos || 0), Number(bucket.conversions || 0)]));

  if (loading) {
    return <div className="mx-auto flex min-h-[50vh] max-w-[1600px] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" aria-label="Loading dashboard" /></div>;
  }

  // Source breakdown counts
  const sourceBreakdown = metrics?.leadSourceBreakdown || {
    'Field Sales': 0,
    'Meta Ads': 0,
    'WhatsApp': 0,
    'Website': 0,
    'Referrals': 0,
    'Other': 0,
  };

  const getSourcePct = (count: number) => {
    if (!totalProspects) return '0%';
    return `${Math.round((count / totalProspects) * 100)}%`;
  };

  // Funnel counts
  const pipeline = metrics?.stagePipeline || {
    'New Lead': 0,
    'Contacted': 0,
    'Qualified': 0,
    'Demo In Progress': 0,
    'Demo Shared': 0,
    'Follow-up': 0,
    'Payment Pending': 0,
    'Won': 0,
    'Activated': 0,
    'Lost': 0,
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12 font-sans">
      {/* Title & Action Row */}
      {error && <div className="flex items-center justify-between rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700"><span>{error}</span><button type="button" onClick={() => window.location.reload()} className="min-h-11 rounded-xl border border-rose-200 bg-white px-3 font-bold">Retry</button></div>}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-[26px] font-extrabold text-slate-900 tracking-tight">
            Sales Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Track your leads, demos, sales and performance all in one place.
          </p>
        </div>

        <Link
          href="/sales/leads"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#5356EC] hover:bg-[#4346DB] text-white font-bold text-xs shadow-sm shadow-indigo-500/20 transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add New Lead</span>
        </Link>
      </div>

      {/* Top 10 Metrics Cards (2 Rows of 5 Cards) */}
      <div className="space-y-3.5">
        {/* Row 1 */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
          <StatCard
            icon={Users2}
            iconBg="bg-[#F4EBFF]"
            iconColor="text-[#9333EA]"
            label="Total Prospects"
            value={totalProspects}
            subtitle={totalProspects > 0 ? `${totalProspects} registered` : 'No leads yet'}
          />

          <StatCard
            icon={Tv}
            iconBg="bg-[#EFF6FF]"
            iconColor="text-[#2563EB]"
            label="Demos Created"
            value={demosCreated}
            subtitle={demosCreated > 0 ? `${demosCreated} funnels built` : 'No demos yet'}
          />

          <StatCard
            icon={Send}
            iconBg="bg-[#E0F2FE]"
            iconColor="text-[#0284C7]"
            label="Demos Shared"
            value={demosShared}
            subtitle={demosShared > 0 ? `${demosShared} links active` : 'None shared'}
          />

          <StatCard
            icon={Trophy}
            iconBg="bg-[#FEF3C7]"
            iconColor="text-[#D97706]"
            label="Deals Won"
            value={wonDeals}
            subtitle={wonDeals > 0 ? `${wonDeals} closed deals` : 'No won deals yet'}
          />

          <StatCard
            icon={Wallet}
            iconBg="bg-[#DCFCE7]"
            iconColor="text-[#16A34A]"
            label="Revenue Collected"
            value={revenueCollected}
            subtitle="Verified payments"
          />
        </div>

        {/* Row 2 */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
          <StatCard
            icon={Clock}
            iconBg="bg-[#FEE2E2]"
            iconColor="text-[#DC2626]"
            label="Follow-ups Due Today"
            value={followupsToday}
            subtitle={overdueFollowups > 0 ? `${overdueFollowups} overdue` : 'On track'}
            subtitleColor={overdueFollowups > 0 ? 'text-rose-600 font-semibold' : 'text-slate-400 font-medium'}
          />

          <StatCard
            icon={CreditCard}
            iconBg="bg-[#FFE4E6]"
            iconColor="text-[#E11D48]"
            label="Payment Pending"
            value={paymentPending}
            subtitle={`₹${paymentPendingAmountInr.toLocaleString('en-IN')}`}
            subtitleColor="text-slate-500 font-medium"
          />

          <StatCard
            icon={UserCheck}
            iconBg="bg-[#ECFDF5]"
            iconColor="text-[#059669]"
            label="Active Customers"
            value={activeCustomers}
            subtitle={`${activeCustomers} live businesses`}
            subtitleColor="text-slate-500 font-medium"
          />

          <StatCard
            icon={Package}
            iconBg="bg-[#FFEDD5]"
            iconColor="text-[#EA580C]"
            label="NFC Orders Pending"
            value={nfcPending}
            subtitle={`${nfcDispatchedCount} dispatched`}
            subtitleColor="text-orange-600 font-semibold"
          />

          {/* Lifetime Slots Card with Progress */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#FEF9C3] flex items-center justify-center flex-shrink-0">
                <Crown className="w-5 h-5 text-[#CA8A04] fill-[#CA8A04]" />
              </div>
              <div className="flex-1 truncate">
                <span className="text-[11px] font-semibold text-slate-500 block truncate">
                  Lifetime Slots Remaining
                </span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-xl font-extrabold text-slate-900 leading-none">
                    {slotsRemaining}
                  </span>
                  <span className="text-xs text-slate-400 font-bold">/ {maxSlots}</span>
                </div>
              </div>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-[#5356EC] h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (slotsUsed / maxSlots) * 100)}%` }}
                />
              </div>
              <span className="text-[10px] text-slate-500 font-semibold whitespace-nowrap">
                {slotsUsed} used
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Middle Row: Sales Performance Chart, Leads by Source Donut, Conversion Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* 1. Sales Performance Chart (5 Cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-900">Sales Performance</h3>
             <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200 text-[11px] font-semibold text-slate-600">
               <span>Last 30 Days</span>
             </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 text-[11px] font-semibold">
            <div className="flex items-center gap-1.5 text-slate-600">
              <span className="w-2.5 h-2.5 rounded-full bg-[#3B82F6]" />
              <span>Leads</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-600">
              <span className="w-2.5 h-2.5 rounded-full bg-[#8B5CF6]" />
              <span>Demos</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-600">
              <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
              <span>Conversions</span>
            </div>
          </div>

          {/* Real Bar & Line Chart */}
          <div className="h-52 w-full pt-2">
            <svg viewBox="0 0 460 170" className="w-full h-full overflow-visible">
              <line x1="25" y1="20" x2="450" y2="20" stroke="#F1F5F9" strokeWidth="1" />
               <text x="5" y="24" fill="#94A3B8" fontSize="10" fontWeight="600">{trendMax}</text>
              <line x1="25" y1="55" x2="450" y2="55" stroke="#F1F5F9" strokeWidth="1" />
               <text x="5" y="59" fill="#94A3B8" fontSize="10" fontWeight="600">{Math.round(trendMax * 0.75)}</text>
              <line x1="25" y1="90" x2="450" y2="90" stroke="#F1F5F9" strokeWidth="1" />
               <text x="5" y="94" fill="#94A3B8" fontSize="10" fontWeight="600">{Math.round(trendMax * 0.5)}</text>
              <line x1="25" y1="125" x2="450" y2="125" stroke="#F1F5F9" strokeWidth="1" />
               <text x="5" y="129" fill="#94A3B8" fontSize="10" fontWeight="600">{Math.round(trendMax * 0.25)}</text>
              <line x1="25" y1="160" x2="450" y2="160" stroke="#E2E8F0" strokeWidth="1" />
              <text x="10" y="164" fill="#94A3B8" fontSize="10" fontWeight="600">0</text>

              {performanceTrend.map((bucket, i) => {
                const x = 50 + i * 90;
                 const leadH = (Number(bucket.leads || 0) / trendMax) * 140;
                 const demoH = (Number(bucket.demos || 0) / trendMax) * 140;
                 const convY = 160 - (Number(bucket.conversions || 0) / trendMax) * 140;
                return (
                  <g key={i}>
                    {leadH > 0 && (
                      <rect x={x} y={160 - leadH} width="8" height={leadH} rx="2" fill="#3B82F6" />
                    )}
                    {demoH > 0 && (
                      <rect x={x + 10} y={160 - demoH} width="8" height={demoH} rx="2" fill="#C4B5FD" />
                    )}
                    <circle cx={x + 9} cy={convY} r="3.5" fill="#10B981" />
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="flex justify-between text-[11px] font-semibold text-slate-400 px-6 pt-1">
            {performanceTrend.length > 0 ? performanceTrend.map((bucket, index) => <span key={`${bucket.date}-${index}`}>{bucket.date}</span>) : <span>No trend data</span>}
          </div>
        </div>

        {/* 2. Leads by Source (3.5 Cols) */}
        <div className="lg:col-span-4 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="font-extrabold text-sm text-slate-900">Leads by Source</h3>

          <div className="flex items-center justify-between gap-4 pt-1">
            <div className="relative w-36 h-36 flex-shrink-0">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r="38" fill="none" stroke="#F1F5F9" strokeWidth="14" />
                {totalProspects > 0 && (
                  <>
                    <circle cx="50" cy="50" r="38" fill="none" stroke="#3B82F6" strokeWidth="14" strokeDasharray={`${Math.round((sourceBreakdown['Field Sales'] / totalProspects) * 100)} 100`} />
                    <circle cx="50" cy="50" r="38" fill="none" stroke="#8B5CF6" strokeWidth="14" strokeDasharray={`${Math.round((sourceBreakdown['Meta Ads'] / totalProspects) * 100)} 100`} strokeDashoffset={`-${Math.round((sourceBreakdown['Field Sales'] / totalProspects) * 100)}`} />
                    <circle cx="50" cy="50" r="38" fill="none" stroke="#10B981" strokeWidth="14" strokeDasharray={`${Math.round((sourceBreakdown['WhatsApp'] / totalProspects) * 100)} 100`} strokeDashoffset={`-${Math.round(((sourceBreakdown['Field Sales'] + sourceBreakdown['Meta Ads']) / totalProspects) * 100)}`} />
                  </>
                )}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-xl font-black text-slate-900 leading-none">{totalProspects}</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">Total Leads</span>
              </div>
            </div>

            <div className="space-y-2 text-xs flex-1">
              <SourceRow color="bg-[#3B82F6]" label="Field Sales" count={String(sourceBreakdown['Field Sales'])} percent={getSourcePct(sourceBreakdown['Field Sales'])} />
              <SourceRow color="bg-[#8B5CF6]" label="Meta Ads" count={String(sourceBreakdown['Meta Ads'])} percent={getSourcePct(sourceBreakdown['Meta Ads'])} />
              <SourceRow color="bg-[#10B981]" label="WhatsApp" count={String(sourceBreakdown['WhatsApp'])} percent={getSourcePct(sourceBreakdown['WhatsApp'])} />
              <SourceRow color="bg-[#F59E0B]" label="Referrals" count={String(sourceBreakdown['Referrals'])} percent={getSourcePct(sourceBreakdown['Referrals'])} />
              <SourceRow color="bg-[#94A3B8]" label="Others" count={String(sourceBreakdown['Other'])} percent={getSourcePct(sourceBreakdown['Other'])} />
            </div>
          </div>
        </div>

        {/* 3. Conversion Funnel (3.5 Cols) */}
        <div className="lg:col-span-3 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
          <h3 className="font-extrabold text-sm text-slate-900">Conversion Funnel</h3>

          <div className="space-y-2 flex-1 flex flex-col justify-around">
            <FunnelStep
              icon="⚡"
              label="New Leads"
              count={String(pipeline['New Lead'])}
              bg="bg-[#F5F3FF]"
              textColor="text-[#7C3AED]"
            />
            <div className="text-center text-slate-300 -my-1 text-xs">↓</div>

            <FunnelStep
              icon="⭐"
              label="Qualified"
              count={String(pipeline['Qualified'])}
              bg="bg-[#EFF6FF]"
              textColor="text-[#2563EB]"
            />
            <div className="text-center text-slate-300 -my-1 text-xs">↓</div>

            <FunnelStep
              icon="📱"
              label="Demo Shared"
              count={String(pipeline['Demo Shared'])}
              bg="bg-[#ECFDF5]"
              textColor="text-[#059669]"
            />
            <div className="text-center text-slate-300 -my-1 text-xs">↓</div>

            <FunnelStep
              icon="💳"
              label="Payment Pending"
              count={String(pipeline['Payment Pending'])}
              bg="bg-[#FEF9C3]"
              textColor="text-[#CA8A04]"
            />
            <div className="text-center text-slate-300 -my-1 text-xs">↓</div>

            <FunnelStep
              icon="🏆"
              label="Won"
              count={String(pipeline['Won'] + pipeline['Activated'])}
              bg="bg-[#FEE2E2]"
              textColor="text-[#DC2626]"
            />
          </div>
        </div>
      </div>

      {/* Bottom Row: Recent Leads Table, Today's Follow-ups, Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* 1. Recent Leads Table (5.5 Cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-900">Recent Leads</h3>
            <Link href="/sales/leads" className="text-xs font-bold text-[#5356EC] hover:underline">
              View All
            </Link>
          </div>

          {recentLeads.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs space-y-2">
              <p>No registered prospects in database.</p>
              <Link href="/sales/leads" className="text-[#5356EC] font-bold hover:underline inline-block">
                + Create First Lead
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-[10px] text-slate-400 uppercase font-bold tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="pb-2.5 font-bold">Business Name</th>
                    <th className="pb-2.5 font-bold">Contact</th>
                    <th className="pb-2.5 font-bold">Source</th>
                    <th className="pb-2.5 font-bold">Stage</th>
                    <th className="pb-2.5 font-bold text-right">Last Update</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentLeads.map((lead) => (
                    <LeadRow
                      key={lead.id}
                      iconText={lead.business_name?.charAt(0) || 'B'}
                      name={lead.business_name}
                      contact={lead.contact_name || lead.phone || 'Owner'}
                      source={lead.lead_source}
                      stage={lead.stage}
                      time={new Date(lead.updated_at || lead.created_at).toLocaleDateString()}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 2. Today's Follow-ups (3.5 Cols) */}
        <div className="lg:col-span-4 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-900">Today&apos;s Follow-ups</h3>
            <Link href="/sales/tasks" className="text-xs font-bold text-[#5356EC] hover:underline">
              View All
            </Link>
          </div>

          {todayFollowups.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No follow-ups due today. You&apos;re all caught up!
            </div>
          ) : (
            <div className="space-y-3.5">
              {todayFollowups.map((lead) => (
                <FollowupItem
                  key={lead.id}
                  initials={lead.business_name?.substring(0, 2).toUpperCase() || 'LE'}
                  title={lead.business_name}
                  action={lead.notes || 'Scheduled follow-up meeting'}
                  time={new Date(lead.next_followup_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                   phone={lead.phone || undefined}
                />
              ))}
            </div>
          )}
        </div>

        {/* 3. Recent Activity (3 Cols) */}
        <div className="lg:col-span-3 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-900">Recent Activity</h3>
             <Link href="/sales/analytics" className="text-xs font-bold text-[#5356EC] hover:underline">View All</Link>
          </div>

          {recentActivity.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No operations logged yet.
            </div>
          ) : (
            <div className="space-y-3 text-xs">
              {recentActivity.map((act) => (
                <div key={act.id} className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-indigo-50 text-[#5356EC] flex items-center justify-center flex-shrink-0 mt-0.5 font-bold text-[10px]">
                    ✓
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-slate-800 text-[11px] leading-snug">
                      {act.title} {act.prospect?.business_name ? `(${act.prospect.business_name})` : ''}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Micro Components
function StatCard({
  icon: Icon,
  iconBg,
  iconColor,
  label,
  value,
  subtitle,
  subtitleColor,
}: {
  icon: ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  label: string;
  value: string | number;
  subtitle: string;
  subtitleColor?: string;
}) {
  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl ${iconBg} ${iconColor} flex items-center justify-center flex-shrink-0`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="truncate flex-1">
          <span className="text-[11px] font-semibold text-slate-500 block truncate leading-tight">
            {label}
          </span>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xl font-extrabold text-slate-900 tracking-tight leading-none">
              {value}
            </span>
          </div>
        </div>
      </div>

      <p className={`text-[11px] mt-2.5 ${subtitleColor || 'text-slate-400 font-medium'}`}>
        {subtitle}
      </p>
    </div>
  );
}

function SourceRow({
  color,
  label,
  count,
  percent,
}: {
  color: string;
  label: string;
  count: string;
  percent: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${color}`} />
        <span className="font-medium text-slate-600">{label}</span>
      </div>
      <span className="font-bold text-slate-800">
        {count} <span className="font-normal text-slate-400">({percent})</span>
      </span>
    </div>
  );
}

function FunnelStep({
  icon,
  label,
  count,
  bg,
  textColor,
}: {
  icon: string;
  label: string;
  count: string;
  bg: string;
  textColor: string;
}) {
  return (
    <div className={`flex items-center justify-between px-3.5 py-2 rounded-xl ${bg}`}>
      <div className="flex items-center gap-2">
        <span className="text-xs">{icon}</span>
        <span className={`text-xs font-bold ${textColor}`}>{label}</span>
      </div>
      <span className="text-xs font-black text-slate-800">{count}</span>
    </div>
  );
}

function LeadRow({
  iconText,
  name,
  contact,
  source,
  stage,
  time,
}: {
  iconText: string;
  name: string;
  contact: string;
  source: string;
  stage: string;
  time: string;
}) {
  return (
    <tr className="hover:bg-slate-50/60 transition-colors">
      <td className="py-2.5">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-indigo-50 text-[#5356EC] font-bold flex items-center justify-center text-xs flex-shrink-0">
            {iconText}
          </div>
          <span className="font-bold text-slate-900 leading-tight">{name}</span>
        </div>
      </td>
      <td className="py-2.5 text-slate-600 font-medium">{contact}</td>
      <td className="py-2.5 font-bold text-slate-800">{source}</td>
      <td className="py-2.5">
        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#EFF6FF] text-[#2563EB]">
          {stage}
        </span>
      </td>
      <td className="py-2.5 text-right text-slate-400 text-[11px] whitespace-nowrap">{time}</td>
    </tr>
  );
}

function FollowupItem({
  initials,
  title,
  action,
  time,
  phone,
}: {
  initials: string;
  title: string;
  action: string;
  time: string;
  phone?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 text-xs">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-8 h-8 rounded-full bg-[#5356EC] text-white font-bold text-xs flex items-center justify-center flex-shrink-0">
          {initials}
        </div>
        <div className="truncate">
          <p className="font-bold text-slate-900 truncate leading-tight">{title}</p>
          <p className="text-[11px] text-slate-400 truncate">{action}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-[11px] font-medium text-slate-500">{time}</span>
        {phone ? (
          <a
            href={`tel:${phone}`}
            className="w-7 h-7 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center justify-center transition-colors"
          >
            <Phone className="w-3.5 h-3.5" />
          </a>
        ) : (
          <span className="w-7 h-7 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center">
            <Phone className="w-3.5 h-3.5" />
          </span>
        )}
      </div>
    </div>
  );
}
