import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase/server';
import { verifySalesStaffAccess, extractAuthToken } from '@/services/salesAuthService';
import { SalesDashboardMetrics, LeadSource, ProspectStage } from '@/types/sales';
import { databaseFailure } from '@/services/salesServer';

export async function GET(req: NextRequest) {
  try {
    const token = extractAuthToken(req);
    const session = await verifySalesStaffAccess(token);

    if (!session.isAuthenticated) {
      return NextResponse.json({ success: false, error: 'Unauthorized sales access' }, { status: 401 });
    }

    const supabase = getSupabaseAdminClient();
    const isSalesperson = session.role === 'salesperson';
    const staffId = session.staffId;

    // 1. Fetch Prospects
    let prospectsQuery = (supabase as any)
      .from('prospects')
      .select('id, business_name, contact_name, phone, stage, category, lead_source, created_at, updated_at, next_followup_date, is_converted, notes');
    if (isSalesperson) {
      prospectsQuery = prospectsQuery.eq('assigned_to', staffId);
    }
    const prospectsResult = await prospectsQuery;
    if (prospectsResult.error) return databaseFailure();
    const prospectsList = prospectsResult.data || [];

    // 2. Fetch Demos
    let demosQuery = (supabase as any)
      .from('sales_demos')
      .select('id, status, shared_at, created_at, business_name');
    if (isSalesperson) {
      demosQuery = demosQuery.eq('created_by', staffId);
    }
    const demosResult = await demosQuery;
    if (demosResult.error) return databaseFailure();
    const demosList = demosResult.data || [];

    // 3. Fetch Sales Orders (Real Revenue Calculation)
    let ordersQuery = (supabase as any)
      .from('sales_orders')
      .select('id, business_id, amount_paise, payment_status, conversion_status, created_at');
    if (isSalesperson) {
      ordersQuery = ordersQuery.eq('sales_staff_id', staffId);
    }
    const ordersResult = await ordersQuery;
    if (ordersResult.error) return databaseFailure();
    const ordersList = ordersResult.data || [];
    if (isSalesperson && !ordersList.length) {
      // Continue with an empty, correctly scoped dashboard.
    }

    // 4. Fetch NFC fulfillment count
    let nfcPendingQuery = (supabase as any)
      .from('nfc_orders')
      .select('id', { count: 'exact', head: true })
      .in('status', ['Ordered', 'In Production']);
    let nfcDispatchedQuery = (supabase as any)
      .from('nfc_orders')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'Dispatched');
    if (isSalesperson) {
      const orderIds = ordersList.map((o: any) => o.id);
      if (!orderIds.length) {
        nfcPendingQuery = null;
        nfcDispatchedQuery = null;
      } else {
        nfcPendingQuery = nfcPendingQuery.in('sales_order_id', orderIds);
        nfcDispatchedQuery = nfcDispatchedQuery.in('sales_order_id', orderIds);
      }
    }
    const pendingResult = nfcPendingQuery ? await nfcPendingQuery : { count: 0, error: null };
    if (pendingResult.error) return databaseFailure();
    const nfcPendingCount = pendingResult.count;
    const dispatchedResult = nfcDispatchedQuery ? await nfcDispatchedQuery : { count: 0, error: null };
    if (dispatchedResult.error) return databaseFailure();
    const nfcDispatchedCount = dispatchedResult.count;

    // 5. Fetch lifetime plan status. Lifetime plans have no account cap.
    const lifetimeResult = await (supabase as any)
      .from('commercial_plans')
      .select('max_slots, slots_used')
      .eq('slug', 'lifetime_software')
      .maybeSingle();
    if (lifetimeResult.error) return databaseFailure();
    const lifetimePlan = lifetimeResult.data;

    const maxSlots = lifetimePlan?.max_slots ?? null;
    const slotsUsed = lifetimePlan?.slots_used ?? 0;

    // 6. Active Customers count
    let activeBusinessesQuery = (supabase as any)
      .from('businesses')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active');
    if (isSalesperson) {
      const businessIds = [...new Set(ordersList.map((o: any) => o.business_id).filter(Boolean))];
      activeBusinessesQuery = businessIds.length ? activeBusinessesQuery.in('id', businessIds) : null;
    }
    const activeResult = activeBusinessesQuery ? await activeBusinessesQuery : { count: 0, error: null };
    if (activeResult.error) return databaseFailure();
    const activeBusinessesCount = activeResult.count;

    // Real Computations
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const todayEnd = todayStart + 24 * 60 * 60 * 1000;

    const sourceBreakdown: Record<LeadSource, number> = {
      'Field Sales': 0,
      'Meta Ads': 0,
      'WhatsApp': 0,
      'Website': 0,
      'Referrals': 0,
      'Other': 0,
    };

    const stagePipeline: Record<ProspectStage, number> = {
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

    let followupsDueToday = 0;
    let overdueFollowups = 0;
    const todayFollowupsList: any[] = [];

    prospectsList.forEach((p: any) => {
      if (sourceBreakdown[p.lead_source as LeadSource] !== undefined) {
        sourceBreakdown[p.lead_source as LeadSource]++;
      }
      if (stagePipeline[p.stage as ProspectStage] !== undefined) {
        stagePipeline[p.stage as ProspectStage]++;
      }

      if (p.next_followup_date) {
        const fTime = new Date(p.next_followup_date).getTime();
        if (fTime >= todayStart && fTime <= todayEnd) {
          followupsDueToday++;
          todayFollowupsList.push(p);
        } else if (fTime < todayStart && p.stage !== 'Won' && p.stage !== 'Activated' && p.stage !== 'Lost') {
          overdueFollowups++;
          todayFollowupsList.push(p);
        }
      }
    });

    // Real verified revenue ONLY (excludes failed/cancelled/unverified)
    let actualRevenuePaise = 0;
    let paymentPendingCount = 0;
    let paymentPendingPaise = 0;
    let verifiedPaymentCount = 0;

    ordersList.forEach((o: any) => {
      if (o.payment_status === 'VERIFIED') {
        actualRevenuePaise += Number(o.amount_paise || 0);
        verifiedPaymentCount++;
      } else if (o.payment_status === 'PENDING' || o.payment_status === 'PENDING_APPROVAL') {
        paymentPendingCount++;
        paymentPendingPaise += Number(o.amount_paise || 0);
      }
    });

    // Recent 5 leads
    const sortedLeads = [...prospectsList]
      .sort((a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime())
      .slice(0, 5);

    // Recent Activity from sales_activities
    let activityQuery = (supabase as any)
      .from('sales_activities')
      .select('id, type, title, description, created_at, prospect:prospect_id(business_name)')
      .order('created_at', { ascending: false })
      .limit(8);
    if (isSalesperson) activityQuery = activityQuery.eq('staff_id', staffId);

    const activityResult = await activityQuery;
    if (activityResult.error) return databaseFailure();
    const recentActivity = activityResult.data || [];

    // Dynamic trend buckets for the last 30 days
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const performanceTrend = [4, 3, 2, 1, 0].map((weeksAgo) => {
      const d = new Date(Date.now() - weeksAgo * 7 * 24 * 60 * 60 * 1000);
      return {
        date: `${d.getDate()} ${monthNames[d.getMonth()]}`,
        leads: 0,
        demos: 0,
        conversions: 0,
      };
    });

    // Distribute actual counts across trend intervals
    prospectsList.forEach((p: any) => {
      const pTime = new Date(p.created_at).getTime();
      const idx = Math.min(4, Math.floor(((Date.now() - pTime) / (30 * 24 * 60 * 60 * 1000)) * 5));
      if (idx >= 0 && idx < 5) performanceTrend[4 - idx].leads++;
    });

    demosList.forEach((d: any) => {
      const dTime = new Date(d.created_at).getTime();
      const idx = Math.min(4, Math.floor(((Date.now() - dTime) / (30 * 24 * 60 * 60 * 1000)) * 5));
      if (idx >= 0 && idx < 5) performanceTrend[4 - idx].demos++;
    });

    ordersList.forEach((o: any) => {
      if (o.conversion_status === 'converted' || o.payment_status === 'VERIFIED') {
        const oTime = new Date(o.created_at).getTime();
        const idx = Math.min(4, Math.floor(((Date.now() - oTime) / (30 * 24 * 60 * 60 * 1000)) * 5));
        if (idx >= 0 && idx < 5) performanceTrend[4 - idx].conversions++;
      }
    });

    const metrics: SalesDashboardMetrics = {
      totalProspects: prospectsList.length,
      newLeads: stagePipeline['New Lead'],
      qualifiedLeads: stagePipeline['Qualified'],
      demosCreated: demosList.length,
      demosShared: demosList.filter((d: any) => d.status === 'shared' || d.shared_at).length,
      followupsDueToday,
      overdueFollowups,
      paymentPendingOrders: paymentPendingCount,
      verifiedPayments: verifiedPaymentCount,
      wonDeals: stagePipeline['Won'] + stagePipeline['Activated'],
      activatedCustomers: activeBusinessesCount || stagePipeline['Activated'],
      actualRevenueCollectedPaise: actualRevenuePaise,
      actualRevenueCollectedInr: actualRevenuePaise / 100,
      nfcPendingFulfillment: nfcPendingCount || 0,
      lifetimeSlotsUsed: slotsUsed,
      lifetimeSlotsMax: maxSlots,
       lifetimeSlotsRemaining: maxSlots == null ? null : Math.max(0, maxSlots - slotsUsed),
      leadSourceBreakdown: sourceBreakdown,
      stagePipeline,
    };

    return NextResponse.json({
      success: true,
      metrics,
      paymentPendingAmountInr: paymentPendingPaise / 100,
      nfcDispatchedCount: nfcDispatchedCount || 0,
      recentLeads: sortedLeads,
      todayFollowups: todayFollowupsList.slice(0, 5),
      recentActivity,
      performanceTrend,
    });
  } catch (err: any) {
    console.error('Analytics aggregation error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
