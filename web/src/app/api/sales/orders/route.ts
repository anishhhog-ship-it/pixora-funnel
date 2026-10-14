import { NextRequest, NextResponse } from 'next/server';
import { requireSalesSession, salesDb, databaseFailure, boundedText, isUuid } from '@/services/salesServer';
import { getSupabaseAdminClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const access = await requireSalesSession(req);
  if ('response' in access) return access.response;
  try {
    const db = salesDb();
    let query = db.from('sales_orders').select('*, prospect:prospect_id(business_name,contact_name,phone), staff:sales_staff_id(full_name,email)').order('created_at', { ascending: false });
    if (access.session.role === 'salesperson') query = query.eq('sales_staff_id', access.session.staffId);
    const result = await query;
    if (result.error) return databaseFailure();
    return NextResponse.json({ success: true, orders: result.data || [] });
  } catch { return databaseFailure(); }
}

export async function PATCH(req: NextRequest) {
  const access = await requireSalesSession(req, ['admin', 'sales_manager']);
  if ('response' in access) return access.response;
  try {
    const body = await req.json();
    if (!isUuid(body.orderId) || !['VERIFIED', 'FAILED'].includes(body.paymentStatus)) return NextResponse.json({ success: false, error: 'orderId and paymentStatus VERIFIED or FAILED are required' }, { status: 400 });
    const reason = boundedText(body.reason, 1000);
    if (!reason || reason.length < 3) return NextResponse.json({ success: false, error: 'A verification reason is required' }, { status: 400 });
    const db = salesDb();
    const current = await db.from('sales_orders').select('id,payment_status,conversion_status,plan_snapshot').eq('id', body.orderId).maybeSingle();
    if (current.error) return databaseFailure();
    if (!current.data) return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    if (body.paymentStatus === 'FAILED') {
      if (current.data.payment_status === 'VERIFIED' || current.data.conversion_status === 'converted') return NextResponse.json({ success: false, error: 'An activated order cannot be marked failed' }, { status: 409 });
      const failed = await db.from('sales_orders').update({ payment_status: 'FAILED', verification_reason: reason, verified_by: null, verified_at: null, updated_at: new Date().toISOString() }).eq('id', body.orderId).in('payment_status', ['PENDING', 'PENDING_APPROVAL']).select().single();
      if (failed.error || !failed.data) return databaseFailure();
      const audit = await db.from('sales_audit_logs').insert({ staff_id: access.session.staffId, staff_email: access.session.email, action: 'SALES_ORDER_PAYMENT_FAILED', target_type: 'sales_orders', target_id: body.orderId, details: { reason } });
      if (audit.error) return databaseFailure();
      return NextResponse.json({ success: true, message: 'Payment marked failed; no entitlement was granted.', order: failed.data, activationStatus: 'not_active', paymentStatus: 'FAILED' });
    }

    // Activation is one DB transaction. There is intentionally no fallback to
    // a sequence of HTTP updates when the RPC is missing or rejects a schema.
    if (!access.session.authUserId) return databaseFailure('Authenticated verifier identity is unavailable');

    // The activation RPC is the only operation that changes entitlement. Do
    // it before the best-effort customer handover work below so a failed
    // invitation can never leave an orphaned auth user attached to an order
    // that was not activated.
    const snapshot = (current.data.plan_snapshot || {}) as Record<string, unknown>;
    const customerEmail = typeof snapshot.customerEmail === 'string' ? snapshot.customerEmail.toLowerCase().trim() : '';
    if (!customerEmail) return databaseFailure('Customer email is missing from the order snapshot');
    const rpc = await db.rpc('activate_sales_order', { p_order_id: body.orderId, p_verifier: access.session.authUserId, p_reason: reason });
    if (rpc.error || !rpc.data) return databaseFailure('Payment could not be activated safely; required activation transaction is unavailable');

    // Provision a passwordless Supabase invitation after activation. Existing
    // auth users are reused; no temporary or confirmed password is generated.
    // If this handover step fails, activation remains truthful and support can
    // retry the invitation/linking without reversing a verified payment.
    const adminClient = getSupabaseAdminClient();
    const authUsers = await adminClient.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (authUsers.error) return databaseFailure('Payment activated, but customer invitation service is unavailable');
    let authUser = authUsers.data.users.find((user) => user.email?.toLowerCase() === customerEmail) || null;
    if (!authUser) {
      const invited = await adminClient.auth.admin.inviteUserByEmail(customerEmail, {
        data: { full_name: typeof snapshot.customerName === 'string' ? snapshot.customerName : undefined },
      });
      if (invited.error || !invited.data.user) return databaseFailure('Payment activated, but customer invitation could not be created');
      authUser = invited.data.user;
    }
    const linkedProfile = await db.from('profiles').update({ auth_user_id: authUser.id, updated_at: new Date().toISOString() }).eq('email', customerEmail).select('id').maybeSingle();
    if (linkedProfile.error || !linkedProfile.data) return databaseFailure('Payment activated, but customer account linking needs support follow-up');
    const linkedOrder = await db.from('sales_orders').update({ customer_id: authUser.id, updated_at: new Date().toISOString() }).eq('id', body.orderId).select('id').maybeSingle();
    if (linkedOrder.error || !linkedOrder.data) return databaseFailure('Payment activated, but customer order linking needs support follow-up');
    const activated = await db.from('sales_orders').select('*').eq('id', body.orderId).single();
    if (activated.error || !activated.data) return databaseFailure();
    return NextResponse.json({ success: true, message: 'Payment manually verified and trial tenant activated.', order: activated.data, activationStatus: 'active', paymentStatus: 'VERIFIED' });
  } catch { return databaseFailure('Payment could not be activated safely'); }
}
