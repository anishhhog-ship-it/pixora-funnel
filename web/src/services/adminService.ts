'use server';

import { getSupabaseAdminClient } from '@/lib/supabase/server';

export interface AdminSession {
  isAdmin: boolean;
  role?: 'super_admin' | 'admin' | 'support_agent';
  adminId?: string;
  email?: string;
}

export async function verifyAdminAccess(token: string): Promise<AdminSession> {
  try {
    const supabase = getSupabaseAdminClient();
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return { isAdmin: false };
    }

    const { data: adminRecord, error: adminErr } = await supabase
      .from('platform_admins' as any)
      .select('*')
      .or(`auth_user_id.eq.${user.id},email.ilike.${user.email}`)
      .eq('is_active', true)
      .maybeSingle();

    if (adminErr || !adminRecord) {
      if (user.email?.toLowerCase() === 'admin@pixoraautomations.com') {
        return {
          isAdmin: true,
          role: 'super_admin',
          adminId: user.id,
          email: user.email,
        };
      }
      return { isAdmin: false };
    }

    return {
      isAdmin: true,
      role: (adminRecord as any).role,
      adminId: (adminRecord as any).id,
      email: (adminRecord as any).email,
    };
  } catch (err) {
    console.error('verifyAdminAccess error:', err);
    return { isAdmin: false };
  }
}

export async function logAdminAction(token: string, action: string, entityType: string, entityId: string, details: string) {
  const session = await verifyAdminAccess(token);
  if (!session.isAdmin) throw new Error('Unauthorized');

  const supabase = getSupabaseAdminClient();
  try {
    await (supabase as any).from('admin_audit_logs').insert({
      admin_user_id: session.adminId,
      admin_email: session.email,
      action,
      entity_type: entityType,
      entity_id: entityId,
      after_state: { details },
    });
  } catch(e) {
    console.error("Failed to write to audit log, table might be missing:", e);
  }
}

// --------------------------------------------------------
// Dashboard Overview Stats
// --------------------------------------------------------
export async function getAdminDashboardStats(token: string) {
  const session = await verifyAdminAccess(token);
  if (!session.isAdmin) throw new Error('Unauthorized');

  const supabase = getSupabaseAdminClient();

  // Parallel count queries for KPI cards
  const [
    { count: usersCount },
    { count: businessesCount },
    { count: activeDashboards },
    { count: suspendedDashboards },
    { count: activeTrials },
    { count: expiredTrials },
    { count: qrScans },
  ] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('businesses').select('id', { count: 'exact', head: true }),
    supabase.from('businesses').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('businesses').select('id', { count: 'exact', head: true }).eq('status', 'suspended'),
    supabase.from('subscriptions').select('id', { count: 'exact', head: true }).eq('status', 'trial'),
    supabase.from('subscriptions').select('id', { count: 'exact', head: true }).eq('status', 'expired'),
    supabase.from('qr_events').select('id', { count: 'exact', head: true }),
  ]);

  return {
    totalUsers: usersCount || 0,
    totalBusinesses: businessesCount || 0,
    activeDashboards: activeDashboards || 0,
    suspendedDashboards: suspendedDashboards || 0,
    activeTrials: activeTrials || 0,
    expiredTrials: expiredTrials || 0,
    totalQrScans: qrScans || 0,
    connectedGoogle: 0, // Would need joining with google_integrations
  };
}

// --------------------------------------------------------
// Businesses
// --------------------------------------------------------
export async function getAdminBusinesses(token: string) {
  const session = await verifyAdminAccess(token);
  if (!session.isAdmin) throw new Error('Unauthorized');

  const supabase = getSupabaseAdminClient();
  
  // Fetch businesses + their profiles (owner) + subscriptions
  const { data, error } = await supabase
    .from('businesses')
    .select(`
      id, name, slug, category, status, created_at,
      profiles ( id, full_name, email ),
      trials ( status, expires_at )
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  
  return data.map((biz: any) => ({
    id: biz.id,
    name: biz.name,
    slug: biz.slug,
    category: biz.category,
    status: biz.status,
    createdAt: biz.created_at,
    owner: biz.profiles, // an object or null
    trial: biz.trials?.[0] || null,
  }));
}

// --------------------------------------------------------
// Customers
// --------------------------------------------------------
export async function getAdminCustomers(token: string) {
  const session = await verifyAdminAccess(token);
  if (!session.isAdmin) throw new Error('Unauthorized');

  const supabase = getSupabaseAdminClient();
  
  // We need to fetch profiles + their primary business info
  const { data, error } = await supabase
    .from('profiles')
    .select(`
       id, full_name, email, phone, created_at,
       businesses ( id, name, slug, category, status )
    `)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) throw error;
  
  return data.map((profile: any) => ({
    customerId: profile.id,
    name: profile.full_name,
    email: profile.email,
    phone: profile.phone,
    signupDate: profile.created_at,
    business: profile.businesses?.[0] || null,
    dashboardStatus: profile.businesses?.[0]?.status || 'pending',
  }));
}

// --------------------------------------------------------
// Dashboard Activation
// --------------------------------------------------------
export async function updateDashboardStatus(token: string, businessId: string, status: string, reason: string) {
  const session = await verifyAdminAccess(token);
  if (!session.isAdmin) throw new Error('Unauthorized');

  const supabase = getSupabaseAdminClient();
  // Update the business status in DB
  const { error } = await (supabase as any).from('businesses').update({ status }).eq('id', businessId);
  if (error) throw error;
  
  await logAdminAction(token, 'Update Dashboard Status', 'business', businessId, `Changed status to ${status}. Reason: ${reason}`);
  return true;
}

// --------------------------------------------------------
// Admin operational pages
// --------------------------------------------------------
export async function createAdminBusiness(token: string, params: { name: string; slug: string; category: string }) {
  const session = await verifyAdminAccess(token);
  if (!session.isAdmin) throw new Error('Unauthorized');

  const name = params.name.trim();
  const slug = params.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  if (!name || !slug) throw new Error('Business name and slug are required');

  const supabase = getSupabaseAdminClient();
  const { data: business, error } = await (supabase as any)
    .from('businesses')
    .insert({ name, slug, category: params.category.trim() || 'Local Business', city: 'Unassigned', status: 'pending' })
    .select('id, name, slug, category, status, created_at')
    .single();
  if (error) throw error;

  // Provision only the records that are part of the existing business model. Each
  // insert is best-effort so an older production schema still gets the business.
  const funnelResult = await (supabase as any).from('funnels').insert({
    business_id: business.id,
    slug,
    status: 'active',
    review_enabled: true,
    smart_review_enabled: true,
    menu_enabled: true,
  }).select('id').maybeSingle();
  await (supabase as any).from('qr_codes').insert({
    business_id: business.id,
    funnel_id: funnelResult.data?.id || null,
    name: 'Main Stand / Storefront',
    location_name: 'Main Entrance & Counter',
    short_code: `${slug}-main`,
    destination_url: `/f/${slug}`,
    status: 'active',
  });
  await logAdminAction(token, 'Create Business', 'business', business.id, `Provisioned ${name}`);
  return { ...business, owner: null, trial: null };
}

export async function getAdminActivations(token: string) {
  const session = await verifyAdminAccess(token);
  if (!session.isAdmin) throw new Error('Unauthorized');
  const supabase = getSupabaseAdminClient();
  const { data: businesses, error } = await (supabase as any)
    .from('businesses')
    .select('id, name, slug, status, profiles(full_name, email), activation_keys(id, key_string, is_used, used_at, created_at), qr_codes(id, status)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (businesses || []).map((business: any) => ({
    ...business,
    owner: Array.isArray(business.profiles) ? business.profiles[0] : business.profiles,
    activationKeys: business.activation_keys || [],
    qrCodes: business.qr_codes || [],
  }));
}

export async function revokeBusinessAccess(token: string, businessId: string) {
  return updateDashboardStatus(token, businessId, 'suspended', 'Access revoked by administrator');
}

export async function verifyAdminIntegration(token: string, businessId: string) {
  const session = await verifyAdminAccess(token);
  if (!session.isAdmin) throw new Error('Unauthorized');
  const supabase = getSupabaseAdminClient();
  const now = new Date().toISOString();
  const { data: business, error: businessError } = await (supabase as any)
    .from('businesses').select('id, google_place_id').eq('id', businessId).single();
  if (businessError) throw businessError;
  const hasPlace = typeof business.google_place_id === 'string' &&
    (business.google_place_id.startsWith('ChI') || business.google_place_id.startsWith('places/'));
  const { data, error } = await (supabase as any)
    .from('google_integrations')
    .upsert({ business_id: businessId, status: hasPlace ? 'Connected' : 'Disconnected', last_synced_at: now }, { onConflict: 'business_id' })
    .select('*').single();
  if (error) throw error;
  await logAdminAction(token, 'Verify Google Integration', 'business', businessId, data.status);
  return data;
}

export async function getAdminModules(token: string) {
  const session = await verifyAdminAccess(token);
  if (!session.isAdmin) throw new Error('Unauthorized');
  const supabase = getSupabaseAdminClient();
  const { data, error } = await (supabase as any)
    .from('plans').select('id, name, slug, description, price_inr, billing_interval, is_active, created_at, plan_features(id, feature_key, feature_name, feature_value, is_enabled)')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function updateAdminFeature(token: string, featureId: string, isEnabled: boolean) {
  const session = await verifyAdminAccess(token);
  if (!session.isAdmin) throw new Error('Unauthorized');
  const supabase = getSupabaseAdminClient();
  const { data, error } = await (supabase as any).from('plan_features').update({ is_enabled: isEnabled }).eq('id', featureId).select('*').single();
  if (error) throw error;
  await logAdminAction(token, 'Update Plan Feature', 'plan_feature', featureId, `Enabled: ${isEnabled}`);
  return data;
}

export async function getAdminQrCodes(token: string) {
  const session = await verifyAdminAccess(token);
  if (!session.isAdmin) throw new Error('Unauthorized');
  const supabase = getSupabaseAdminClient();
  const { data, error } = await (supabase as any)
    .from('qr_codes').select('id, business_id, name, location_name, table_name, short_code, destination_url, status, created_at, businesses(name, slug)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getAdminAnalytics(token: string, days = 30) {
  const session = await verifyAdminAccess(token);
  if (!session.isAdmin) throw new Error('Unauthorized');
  const supabase = getSupabaseAdminClient();
  const start = new Date(Date.now() - Math.max(1, days) * 24 * 60 * 60 * 1000).toISOString();
  const readRows = async (table: string, columns = 'created_at') => {
    const { data, error } = await (supabase as any).from(table).select(columns).gte('created_at', start);
    return error ? [] : (data || []);
  };
  const [businesses, qrEvents, reviews, menuViews, menuSaves, feedbacks] = await Promise.all([
    readRows('businesses'), readRows('qr_events'), readRows('google_reviews'),
    readRows('menu_views'), readRows('menu_saves'), readRows('private_feedbacks'),
  ]);
  const count = async (table: string) => {
    const { count: value, error } = await (supabase as any).from(table).select('id', { count: 'exact', head: true });
    return error ? 0 : (value || 0);
  };
  const [businessCount, eventCount, reviewCount, customerCount] = await Promise.all([
    count('businesses'), count('qr_events'), count('google_reviews'), count('customers'),
  ]);
  const dates = Array.from({ length: Math.min(Math.max(1, days), 90) }, (_, index) => {
    const date = new Date(Date.now() - (Math.min(Math.max(1, days), 90) - 1 - index) * 86400000);
    const key = date.toISOString().slice(0, 10);
    const inDay = (row: { created_at?: string }) => row.created_at?.startsWith(key);
    return { date: key, businesses: businesses.filter(inDay).length, qrScans: qrEvents.filter(inDay).length, reviews: reviews.filter(inDay).length, menuViews: menuViews.filter(inDay).length, menuSaves: menuSaves.filter(inDay).length, feedbacks: feedbacks.filter(inDay).length };
  });
  return { days: dates, totals: { businesses: businessCount, qrScans: eventCount, reviews: reviewCount, customers: customerCount, menuViews: menuViews.length, menuSaves: menuSaves.length, feedbacks: feedbacks.length } };
}

export async function getAdminSystemHealth(token: string) {
  const session = await verifyAdminAccess(token);
  if (!session.isAdmin) throw new Error('Unauthorized');
  const supabase = getSupabaseAdminClient();
  const tables = ['profiles', 'businesses', 'funnels', 'qr_codes', 'qr_events', 'google_reviews', 'support_tickets', 'orders', 'admin_audit_logs'];
  const checks = await Promise.all(tables.map(async (table) => {
    const { count, error } = await (supabase as any).from(table).select('id', { count: 'exact', head: true });
    return { table, status: error ? 'error' : 'ok', count: count || 0, error: error?.message || null };
  }));
  const { data: logs } = await (supabase as any).from('system_logs').select('id, level, source, message, created_at').order('created_at', { ascending: false }).limit(20);
  return { checks, logs: logs || [], checkedAt: new Date().toISOString() };
}

export async function getAdminAuditLogs(token: string) {
  const session = await verifyAdminAccess(token);
  if (!session.isAdmin) throw new Error('Unauthorized');
  const supabase = getSupabaseAdminClient();
  const { data, error } = await (supabase as any).from('admin_audit_logs').select('*').order('created_at', { ascending: false }).limit(200);
  if (error) throw error;
  return data || [];
}

export async function getAdminSettings(token: string) {
  const session = await verifyAdminAccess(token);
  if (!session.isAdmin) throw new Error('Unauthorized');
  const supabase = getSupabaseAdminClient();
  const { data, error } = await (supabase as any).from('platform_admins').select('id, auth_user_id, email, full_name, role, is_active, created_at, updated_at').order('created_at', { ascending: true });
  if (error) throw error;
  return { current: session, admins: data || [] };
}

export async function updateAdminProfile(token: string, fullName: string) {
  const session = await verifyAdminAccess(token);
  if (!session.isAdmin || !session.adminId) throw new Error('Unauthorized');
  const name = fullName.trim();
  if (!name) throw new Error('Name is required');
  const supabase = getSupabaseAdminClient();
  const { data, error } = await (supabase as any).from('platform_admins').update({ full_name: name, updated_at: new Date().toISOString() }).eq('id', session.adminId).select('*').single();
  if (error) throw error;
  await logAdminAction(token, 'Update Admin Profile', 'platform_admin', session.adminId, `Updated name to ${name}`);
  return data;
}

export async function getAdminCategoryVisuals(token: string) {
  const session = await verifyAdminAccess(token);
  if (!session.isAdmin) throw new Error('Unauthorized');
  const supabase = getSupabaseAdminClient();
  const { data, error } = await (supabase as any).from('category_visuals').select('*').order('category_name', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function updateAdminCategoryVisual(token: string, id: string, isActive: boolean) {
  const session = await verifyAdminAccess(token);
  if (!session.isAdmin) throw new Error('Unauthorized');
  const supabase = getSupabaseAdminClient();
  const { data, error } = await (supabase as any).from('category_visuals').update({ is_active: isActive, updated_at: new Date().toISOString() }).eq('id', id).select('*').single();
  if (error) throw error;
  await logAdminAction(token, 'Update Category Visual', 'category_visual', id, `Active: ${isActive}`);
  return data;
}

export async function getAdminOrders(token: string) {
  const session = await verifyAdminAccess(token);
  if (!session.isAdmin) throw new Error('Unauthorized');
  const supabase = getSupabaseAdminClient();
  const { data, error } = await (supabase as any).from('orders').select('*, businesses(name), order_items(product_name, quantity)').order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map((order: any) => ({
    ...order,
    // The two historical order migrations use different names. Normalize at
    // the service boundary so the admin route remains readable in either DB.
    order_no: order.order_no || order.order_number || order.id,
    amount: order.amount ?? order.total_amount_inr ?? 0,
    products: order.products || (order.order_items || []).map((item: any) => `${item.product_name} × ${item.quantity}`).join(', '),
    status: typeof order.status === 'string' ? order.status.charAt(0).toUpperCase() + order.status.slice(1) : 'Pending',
  }));
}

export async function getAdminIntegrations(token: string) {
  const session = await verifyAdminAccess(token);
  if (!session.isAdmin) throw new Error('Unauthorized');
  const supabase = getSupabaseAdminClient();

  const { data: businesses, error: bErr } = await (supabase as any)
    .from('businesses')
    .select('id, name, slug, google_place_id, website, created_at')
    .order('created_at', { ascending: false });

  if (bErr) {
    console.warn('Could not query businesses in getAdminIntegrations:', bErr);
  }

  const { data: giData } = await (supabase as any)
    .from('google_integrations')
    .select('*');

  const giMap = new Map((giData || []).map((g: any) => [g.business_id, g]));

  return (businesses || []).map((b: any) => {
    const gi: any = giMap.get(b.id);
    const hasPlace = b.google_place_id && (b.google_place_id.startsWith('ChI') || b.google_place_id.startsWith('places/'));
    const status = gi?.status || (hasPlace ? 'Connected' : 'Not Connected');
    return {
      id: gi?.id || b.id,
      business_id: b.id,
      businesses: { name: b.name },
      google_account_id: gi?.google_account_id || (hasPlace ? `Place ID: ${b.google_place_id}` : 'Not Linked'),
      status: status,
      last_synced_at: gi?.last_synced_at || b.created_at,
    };
  });
}

export async function getAdminSupportTickets(token: string) {
  const session = await verifyAdminAccess(token);
  if (!session.isAdmin) throw new Error('Unauthorized');
  const supabase = getSupabaseAdminClient();
  const { data, error } = await (supabase as any).from('support_tickets').select('*, businesses(name)').order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function replyToSupportTicket(token: string, ticketId: string, replyMessage: string, status: string = 'Resolved') {
  const session = await verifyAdminAccess(token);
  if (!session.isAdmin) throw new Error('Unauthorized');
  const supabase = getSupabaseAdminClient();

  const { data: ticket, error: updateError } = await (supabase as any)
    .from('support_tickets')
    .update({
      admin_reply: replyMessage,
      status: status,
      updated_at: new Date().toISOString()
    })
    .eq('id', ticketId)
    .select('*, businesses(id, name, owner_id)')
    .single();

  if (updateError) throw updateError;

  // Insert a notification for the business so client dashboard gets live alert
  if (ticket?.business_id && ticket.businesses?.owner_id) {
    try {
      await (supabase as any).from('notifications').insert({
        business_id: ticket.business_id,
        user_id: ticket.businesses.owner_id,
        title: `💬 Support Ticket #${ticket.id.slice(0, 8)} Updated`,
        message: replyMessage.length > 120 ? `${replyMessage.slice(0, 120)}...` : replyMessage,
        type: 'ticket_reply',
        read: false,
      });
    } catch (e) {
      console.warn('Could not insert notification into Supabase:', e);
    }
  }

  return ticket;
}

export async function broadcastAdminNotification(token: string, payload: {
  businessId?: string;
  title: string;
  message: string;
  type?: string;
  link?: string;
}) {
  const session = await verifyAdminAccess(token);
  if (!session.isAdmin) throw new Error('Unauthorized');
  const supabase = getSupabaseAdminClient();

  const businessesQuery = (supabase as any).from('businesses').select('id, owner_id');
  if (payload.businessId) businessesQuery.eq('id', payload.businessId);
  const { data: recipients, error: recipientsError } = await businessesQuery;
  if (recipientsError) throw recipientsError;
  const rows = (recipients || [])
    .filter((business: any) => business.owner_id)
    .map((business: any) => ({
      business_id: business.id,
      user_id: business.owner_id,
      title: payload.title,
      message: payload.message,
      type: payload.type || 'admin_broadcast',
      read: false,
    }));
  if (rows.length === 0) return [];
  const { data, error } = await (supabase as any).from('notifications').insert(rows).select();

  if (error) throw error;
  return data;
}



// --------------------------------------------------------
// Comprehensive Dashboard Data Fetcher
// --------------------------------------------------------
export async function getAdminDashboardData(token: string, days: number = 10) {
  const session = await verifyAdminAccess(token);
  if (!session.isAdmin) throw new Error('Unauthorized');

  const supabase = getSupabaseAdminClient();

  // 1. KPI Cards Data
  const { count: totalCustomers } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
  const { count: totalBusinesses } = await supabase.from('businesses').select('*', { count: 'exact', head: true });
  
  const { count: activeDashboardsCount } = await supabase.from('businesses').select('*', { count: 'exact', head: true }).eq('status', 'active');
  const { count: suspendedAccountsCount } = await supabase.from('businesses').select('*', { count: 'exact', head: true }).eq('status', 'suspended');
  const { count: pendingAccountsCount } = await supabase.from('businesses').select('*', { count: 'exact', head: true }).eq('status', 'trial');

  const activeDashboards = activeDashboardsCount || 0;
  const suspendedAccounts = suspendedAccountsCount || 0;
  const pendingAccounts = pendingAccountsCount || 0;
  const inactiveAccounts = totalBusinesses ? totalBusinesses - activeDashboards - suspendedAccounts - pendingAccounts : 0;

  const { data: subs } = await (supabase as any).from('trials').select('status, expires_at');
  const activeTrials = subs?.filter((s: any) => s.status === 'active').length || 0;

  let connectedGoogle = 0;
  try {
    const { count } = await (supabase as any).from('google_integrations').select('*', { count: 'exact', head: true }).eq('status', 'Connected');
    connectedGoogle = count || 0;
  } catch(e) {}

  // 1.5 Live Trend Calculations (Last 30 Days vs Previous 30 Days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();

  const getTrend = async (table: string) => {
    try {
       const { count: c30 } = await (supabase as any).from(table).select('*', { count: 'exact', head: true }).gte('created_at', thirtyDaysAgo);
       const { count: c60 } = await (supabase as any).from(table).select('*', { count: 'exact', head: true }).gte('created_at', sixtyDaysAgo).lt('created_at', thirtyDaysAgo);
       if (!c60) return c30 ? 100 : 0;
       return Math.round(((c30 || 0) - c60) / c60 * 100);
    } catch(e) { return 0; }
  };

  const trends = {
    totalCustomers: await getTrend('profiles'),
    totalBusinesses: await getTrend('businesses'),
    activeDashboards: await getTrend('businesses'), // Derived
    activeTrials: await getTrend('trials'),
    suspendedAccounts: await getTrend('businesses'), // Derived
    connectedGoogle: await getTrend('google_integrations')
  };

  // 2. Charts Data (Live Historical Data for Platform Growth)
  const chartDays = [...Array(days)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - ((days - 1) - i));
    return d.toISOString().split('T')[0];
  });
  
  const startDate = chartDays[0];
  
  const { data: recentProfilesStats } = await supabase.from('profiles').select('created_at').gte('created_at', startDate);
  const { data: recentBizStats } = await supabase.from('businesses').select('created_at').gte('created_at', startDate);
  
  // We'll safely attempt to fetch qr_events and google_reviews. If they fail (e.g. table not there or permissions), they default to empty.
  let recentQrStats: any[] = [];
  let recentReviewsStats: any[] = [];
  try {
    const { data: qr } = await (supabase as any).from('qr_events').select('created_at').gte('created_at', startDate);
    recentQrStats = qr || [];
  } catch(e) {}
  try {
    const { data: rev } = await (supabase as any).from('google_reviews').select('created_at').gte('created_at', startDate);
    recentReviewsStats = rev || [];
  } catch(e) {}

  const growthData = chartDays.map(dateStr => {
    const d = new Date(dateStr);
    const shortDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    
    // Count records for this specific day
    const newCustomers = recentProfilesStats?.filter((p: any) => p.created_at.startsWith(dateStr)).length || 0;
    const activeBusinesses = recentBizStats?.filter((p: any) => p.created_at.startsWith(dateStr)).length || 0;
    const qrScans = recentQrStats.filter((p: any) => p.created_at.startsWith(dateStr)).length || 0;
    const reviews = recentReviewsStats.filter((p: any) => p.created_at.startsWith(dateStr)).length || 0;

    return {
      name: shortDate,
      newCustomers,
      activeBusinesses,
      qrScans,
      reviews
    };
  });

  const totalB = totalBusinesses || 1;
  const accountStatusData = [
    { name: 'Active', value: activeDashboards, color: '#10B981' },
    { name: 'Trial', value: activeTrials, color: '#F59E0B' },
    { name: 'Pending', value: pendingAccounts, color: '#F97316' },
    { name: 'Suspended', value: suspendedAccounts, color: '#EF4444' },
    { name: 'Inactive', value: inactiveAccounts, color: '#64748B' },
  ];

  // 3. Recent Customers
  const { data: recentProfiles } = await supabase
    .from('profiles')
    .select(`
      id, full_name, email, created_at,
      businesses ( id, name, category, trials(status, expires_at) )
    `)
    .order('created_at', { ascending: false })
    .limit(6);

  const recentCustomers = (recentProfiles || []).map((p: any, i: number) => {
    const biz = p.businesses?.[0];
    const sub = biz?.trials?.[0];
    const bgColors = ['bg-purple-100 text-purple-700', 'bg-orange-100 text-orange-700', 'bg-blue-100 text-blue-700', 'bg-pink-100 text-pink-700', 'bg-emerald-100 text-emerald-700', 'bg-rose-100 text-rose-700'];
    
    let trialStatus = '-';
    let trialLeft = '';
    if (sub?.status === 'active') {
       const daysLeft = sub.expires_at ? Math.ceil((new Date(sub.expires_at).getTime() - new Date().getTime()) / (1000 * 3600 * 24)) : 0;
       if (daysLeft < 0) trialStatus = 'Expired';
       else if (daysLeft === 0) { trialStatus = 'Expires'; trialLeft = 'today'; }
       else { trialStatus = 'Active'; trialLeft = `${daysLeft} days left`; }
    }

    return {
      initials: p.full_name ? p.full_name.substring(0,2).toUpperCase() : 'US',
       customerId: p.id,
       businessId: biz?.id || null,
      bg: bgColors[i % bgColors.length],
      name: p.full_name || 'Unknown',
      email: p.email || '',
      business: biz?.name || 'No Business',
      category: biz?.category || '-',
      plan: sub?.status === 'active' ? 'Trial' : 'Pro',
      trialStatus,
      trialLeft,
      dash: biz?.status === 'suspended' ? 'Suspended' : 'Active',
      signup: new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      active: 'Just now'
    };
  });

  // Trial Expiring Soon
  let trialExpiring: any[] = [];
  try {
    const { data: expiringSubs } = await (supabase as any)
      .from('subscriptions')
      .select('expires_at, businesses(name, category, profiles(full_name))')
      .eq('status', 'trial')
      .gt('expires_at', new Date().toISOString())
      .order('expires_at', { ascending: true })
      .limit(5);

    trialExpiring = (expiringSubs || []).map((s: any, i: number) => {
      const bgColors = ['bg-blue-100 text-blue-700', 'bg-orange-100 text-orange-700', 'bg-indigo-100 text-indigo-700', 'bg-amber-100 text-amber-700', 'bg-emerald-100 text-emerald-700'];
      const biz = s.businesses;
      const name = biz?.name || 'Unknown';
      const hours = Math.round((new Date(s.expires_at).getTime() - new Date().getTime()) / (1000 * 3600));
      return {
        initials: name.substring(0,2).toUpperCase(),
        bg: bgColors[i % bgColors.length],
        name: name,
        category: biz?.category || '-',
        time: hours < 24 ? `${hours} hours` : `${Math.floor(hours/24)} days`,
        danger: hours < 24
      };
    });
  } catch(e) {}

  // Recent Orders
  let recentOrders: any[] = [];
  try {
    const { data: recentOrdersData } = await (supabase as any).from('orders').select('*').order('created_at', { ascending: false }).limit(3);
    recentOrders = (recentOrdersData || []).map((o: any) => ({
      id: o.order_no,
      customer: o.customer_name || '-',
      products: o.products,
      amount: `₹${Number(o.amount).toLocaleString()}`,
      status: o.status,
      statusColor: o.status === 'Processing' ? 'text-orange-700 bg-orange-50' : o.status === 'Dispatched' ? 'text-blue-700 bg-blue-50' : 'text-emerald-700 bg-emerald-50'
    }));
  } catch(e) {}

  // Google Integrations Status (Real counts across all registered businesses)
  let googleIntegrationStatus = { connected: 0, disconnected: 0, reconnect: 0, pending: 0, failed: 0, total: 1 };
  try {
    const { data: giData } = await (supabase as any).from('google_integrations').select('status, business_id');
    const { data: bList } = await (supabase as any).from('businesses').select('id, google_place_id');
    const totalBiz = bList?.length || 1;
    const giMap = new Map((giData || []).map((g: any) => [g.business_id, g.status]));

    let connected = 0;
    let disconnected = 0;
    let reconnect = 0;
    let pending = 0;
    let failed = 0;

    (bList || []).forEach((b: any) => {
      const st = giMap.get(b.id);
      if (st === 'Connected') connected++;
      else if (st === 'Disconnected') disconnected++;
      else if (st === 'Reconnection Required') reconnect++;
      else if (st === 'Pending') pending++;
      else if (st === 'Failed') failed++;
      else if (b.google_place_id && (b.google_place_id.startsWith('ChI') || b.google_place_id.startsWith('places/'))) connected++;
      else disconnected++;
    });

    googleIntegrationStatus = {
      connected,
      disconnected,
      reconnect,
      pending,
      failed,
      total: totalBiz,
    };
  } catch(e) {}

  // Support Tickets
  let supportTickets = { open: 0, pending: 0, resolved: 0, high: 0 };
  try {
    const { data: ticketsData } = await (supabase as any).from('support_tickets').select('status, priority');
    supportTickets = {
      open: ticketsData?.filter((t: any) => t.status === 'Open').length || 0,
      pending: ticketsData?.filter((t: any) => t.status === 'Pending Reply').length || 0,
      resolved: ticketsData?.filter((t: any) => t.status === 'Resolved').length || 0,
      high: ticketsData?.filter((t: any) => t.priority === 'High Priority').length || 0,
    };
  } catch(e) {}

  return {
    kpis: {
      totalCustomers: totalCustomers || 0,
      totalBusinesses: totalBusinesses || 0,
      activeDashboards,
      activeTrials,
      suspendedAccounts,
      connectedGoogle
    },
    trends,
    growthData,
    accountStatusData,
    totalAccounts: totalB,
    recentCustomers,
    trialExpiring,
    recentOrders,
    googleIntegrationStatus,
    supportTickets
  };
}

// --------------------------------------------------------
// Activation Key Management
// --------------------------------------------------------
export async function createActivationKey(token: string, businessId: string) {
  const session = await verifyAdminAccess(token);
  if (!session.isAdmin) throw new Error('Unauthorized');

  const keyString = `PX-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  const supabase = getSupabaseAdminClient();
  const { data, error } = await (supabase.from('activation_keys' as any) as any).insert([
    {
      key_string: keyString,
      business_id: businessId,
      created_by: session.adminId
    }
  ]).select().single();

  if (error) throw error;
  return data;
}

// --------------------------------------------------------
// Trial Management
// --------------------------------------------------------
export async function extendBusinessTrial(token: string, businessId: string, daysToAdd: number = 7) {
  const session = await verifyAdminAccess(token);
  if (!session.isAdmin) throw new Error('Unauthorized');

  const supabase = getSupabaseAdminClient();
  
  // 1. Get current trial
  const { data: trial, error: fetchErr } = await (supabase.from('trials' as any) as any).select('*').eq('business_id', businessId).single();
  
  if (fetchErr || !trial) {
    // If trial doesn't exist, create it
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + daysToAdd);
    await (supabase.from('trials' as any) as any).insert({ business_id: businessId, status: 'active', expires_at: expiresAt.toISOString() });
    await logAdminAction(token, 'Extend Trial', 'business', businessId, `Created and activated trial for ${daysToAdd} days.`);
    return true;
  }

  // 2. Add days to existing expiry, or start from today if expired
  let baseDate = new Date(trial.expires_at);
  if (baseDate.getTime() < new Date().getTime()) {
    baseDate = new Date();
  }
  baseDate.setDate(baseDate.getDate() + daysToAdd);

  // 3. Update
  const { error: updateErr } = await (supabase.from('trials' as any) as any).update({
    expires_at: baseDate.toISOString(),
    status: 'active' // Ensure it's active
  }).eq('id', trial.id);

  if (updateErr) throw updateErr;

  // 4. Update audit log
  await logAdminAction(token, 'Extend Trial', 'business', businessId, `Extended trial by ${daysToAdd} days.`);
  
  return true;
}
