import { NextRequest, NextResponse } from 'next/server';
import { requireSalesSession, salesDb, databaseFailure, boundedText, isUuid } from '@/services/salesServer';
import { CustomerHandoverPackage } from '@/types/sales';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://funnel.pixoraautomations.com';
const PAYMENT_STATUSES = ['UPI', 'Bank Transfer', 'Cash', 'Online Gateway'];

export async function POST(req: NextRequest) {
  const access = await requireSalesSession(req);
  if ('response' in access) return access.response;
  try {
    const body = await req.json();
    const prospectId = body.prospectId;
    const demoId = body.demoId;
    const customerName = boundedText(body.customerName, 160);
    const customerEmail = boundedText(body.customerEmail, 320)?.toLowerCase();
    const planSlug = boundedText(body.planSlug || 'standard_2year_software', 80);
    const paymentMethod = boundedText(body.paymentMethod || 'UPI', 30);
    const idempotencyKey = boundedText(body.idempotencyKey, 120);
    if (!isUuid(prospectId) || !isUuid(demoId) || !customerName || !customerEmail || !planSlug || !paymentMethod || !idempotencyKey) {
      return NextResponse.json({ success: false, error: 'Prospect, demo, customer details, plan, and idempotencyKey are required' }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail) || !PAYMENT_STATUSES.includes(paymentMethod)) {
      return NextResponse.json({ success: false, error: 'Invalid customer email or payment method' }, { status: 400 });
    }
    const db = salesDb();
    const existing = await db.from('sales_orders').select('*').eq('idempotency_key', idempotencyKey).maybeSingle();
    if (existing.error) return databaseFailure();
    if (existing.data) {
      // A key is a client contract: never silently associate it with another checkout.
      if (existing.data.prospect_id !== prospectId || existing.data.demo_id !== demoId || existing.data.plan_slug !== planSlug) {
        return NextResponse.json({ success: false, error: 'Idempotency key belongs to another checkout' }, { status: 409 });
      }
      return NextResponse.json({ success: true, order: existing.data, activationStatus: existing.data.conversion_status === 'converted' ? 'active' : 'pending_payment', paymentStatus: existing.data.payment_status, orderNo: existing.data.order_no });
    }

    const prospect = await db.from('prospects').select('id,business_name,phone,category,city,assigned_to').eq('id', prospectId).maybeSingle();
    if (prospect.error) return databaseFailure();
    if (!prospect.data) return NextResponse.json({ success: false, error: 'Prospect not found' }, { status: 404 });
    if (access.session.role === 'salesperson' && prospect.data.assigned_to !== access.session.staffId) return NextResponse.json({ success: false, error: 'Cannot convert an unassigned prospect' }, { status: 403 });

    const demo = await db.from('sales_demos').select('id,slug,business_id,business_name,category,created_by,status').eq('id', demoId).eq('prospect_id', prospectId).maybeSingle();
    if (demo.error) return databaseFailure();
    if (!demo.data || !demo.data.business_id) return NextResponse.json({ success: false, error: 'Demo is not linked to an activation-ready trial tenant' }, { status: 409 });
    if (access.session.role === 'salesperson' && demo.data.created_by !== access.session.staffId) return NextResponse.json({ success: false, error: 'Cannot convert another salesperson’s demo' }, { status: 403 });
    const business = await db.from('businesses').select('id,slug,status,plan_status').eq('id', demo.data.business_id).maybeSingle();
    if (business.error) return databaseFailure();
    if (!business.data || business.data.slug !== demo.data.slug || business.data.status !== 'trial' || business.data.plan_status !== 'trial') return NextResponse.json({ success: false, error: 'Demo tenant is not in a trial state' }, { status: 409 });

    const plan = await db.from('commercial_plans').select('name,slug,price_paise,duration_years,is_lifetime,includes_nfc,is_active,max_slots').eq('slug', planSlug).eq('is_active', true).maybeSingle();
    if (plan.error) return databaseFailure();
    if (!plan.data) return NextResponse.json({ success: false, error: 'Plan not found' }, { status: 400 });

    const snapshot = {
      name: plan.data.name, pricePaise: plan.data.price_paise, durationYears: plan.data.duration_years,
      isLifetime: plan.data.is_lifetime, includesNfc: plan.data.includes_nfc,
      customerName, customerEmail, customerPhone: boundedText(body.customerPhone, 40) || prospect.data.phone || null,
      shippingAddress: boundedText(body.shippingAddress, 500), shippingCity: boundedText(body.city, 120) || prospect.data.city || null,
      shippingState: boundedText(body.state, 120), shippingPincode: boundedText(body.pincode, 20),
    };
    const orderNo = `PX-${crypto.randomUUID().replace(/-/g, '').slice(0, 12).toUpperCase()}`;
    const order = await db.from('sales_orders').insert({
      order_no: orderNo, prospect_id: prospectId, demo_id: demoId, sales_staff_id: access.session.staffId,
      business_id: demo.data.business_id, customer_id: null, plan_slug: planSlug, plan_snapshot: snapshot,
      amount_paise: plan.data.price_paise, payment_method: paymentMethod,
      transaction_reference: boundedText(body.transactionReference, 160), payment_status: 'PENDING_APPROVAL',
      conversion_status: 'pending', idempotency_key: idempotencyKey,
    }).select().single();
    if (order.error || !order.data) {
      // A concurrent retry may have won the unique idempotency constraint.
      const concurrent = await db.from('sales_orders').select('*').eq('idempotency_key', idempotencyKey).maybeSingle();
      if (!concurrent.error && concurrent.data) return NextResponse.json({ success: true, order: concurrent.data, activationStatus: 'pending_payment', paymentStatus: concurrent.data.payment_status, orderNo: concurrent.data.order_no });
      return databaseFailure();
    }

    const stage = await db.from('prospects').update({ stage: 'Payment Pending', updated_at: new Date().toISOString() }).eq('id', prospectId);
    const demoState = await db.from('sales_demos').update({ status: 'shared', shared_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', demoId);
    const activity = await db.from('sales_activities').insert({ prospect_id: prospectId, staff_id: access.session.staffId, type: 'payment_pending', title: 'Checkout recorded; payment awaiting approval', description: `Order ${orderNo} is pending manual payment verification.` });
    const audit = await db.from('sales_audit_logs').insert({ staff_id: access.session.staffId, staff_email: access.session.email, action: 'SALES_CHECKOUT_PENDING_APPROVAL', target_type: 'sales_orders', target_id: order.data.id, details: { orderNo, demoId, planSlug } });
    if (stage.error || demoState.error || activity.error || audit.error) return databaseFailure();

    const customerPassword = boundedText(body.customerPassword, 120) || 'Pixora@2026';

    // Provision Client Auth User & Link Business
    let authUserId: string | null = null;
    try {
      const { data: userList } = await db.auth.admin.listUsers();
      const existingUser = userList?.users?.find((u: any) => u.email?.toLowerCase().trim() === customerEmail);
      if (existingUser) {
        authUserId = existingUser.id;
        await db.auth.admin.updateUserById(authUserId, {
          password: customerPassword,
          email_confirm: true,
          user_metadata: { full_name: customerName, role: 'business_owner' },
        });
      } else {
        const { data: newUser } = await db.auth.admin.createUser({
          email: customerEmail,
          password: customerPassword,
          email_confirm: true,
          user_metadata: { full_name: customerName, role: 'business_owner' },
        });
        if (newUser?.user) authUserId = newUser.user.id;
      }

      if (authUserId) {
        await db.from('profiles').upsert({
          id: authUserId,
          email: customerEmail,
          full_name: customerName,
          role: 'business_owner',
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' });

        await db.from('businesses').update({
          owner_id: authUserId,
          status: 'active',
          plan_status: 'active',
          trial_expires_at: null,
          updated_at: new Date().toISOString(),
        }).eq('id', demo.data.business_id);

        await db.from('business_members').upsert({
          business_id: demo.data.business_id,
          user_id: authUserId,
          role: 'owner',
          updated_at: new Date().toISOString(),
        }, { onConflict: 'business_id,user_id' });
      }
    } catch (authErr) {
      console.warn('Unable to auto-provision client auth user:', authErr);
    }

    const handover: CustomerHandoverPackage = {
      businessName: prospect.data.business_name,
      customerName,
      customerEmail,
      customerPhone: snapshot.customerPhone,
      businessSlug: demo.data.slug,
      loginUrl: `${APP_URL}/login`,
      publicFunnelUrl: `/f/${demo.data.slug}`,
      qrCodeDownloadUrl: `/api/qr/download?slug=${demo.data.slug}`,
      planName: plan.data.name,
      isLifetime: plan.data.is_lifetime,
      expiresAt: null,
      nfcOrdered: false,
      nfcAssetType: plan.data.includes_nfc ? 'Card + Stand' : undefined,
      initialPassword: customerPassword,
      whatsappMessageTemplate: `Hello ${customerName}! Your ${prospect.data.business_name} Pixora review funnel is ready.\n\nSign in to your Dashboard:\n🔗 ${APP_URL}/login\n📧 Email: ${customerEmail}\n🔑 Password: ${customerPassword}\n\nLive Customer Funnel: ${APP_URL}/f/${demo.data.slug}\n\nYou can change your password anytime in your Profile & Security section!`,
      activationStatus: 'pending_payment',
      paymentStatus: 'PENDING_APPROVAL',
      orderNo,
    };
    return NextResponse.json({ success: true, order: order.data, handover, activationStatus: 'pending_payment', paymentStatus: 'PENDING_APPROVAL', orderNo });
  } catch { return databaseFailure(); }
}
