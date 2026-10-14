import { NextRequest, NextResponse } from 'next/server';
import { requireSalesSession, salesDb, databaseFailure, boundedText, isUuid } from '@/services/salesServer';
import { CustomerHandoverPackage } from '@/types/sales';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://funnel.pixoraautomations.com';
const PAYMENT_STATUSES = ['UPI', 'Bank Transfer', 'Cash', 'Online Gateway'];

function slugBase(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 48) || 'business';
}

async function generateSlug(db: any, name: string) {
  const base = slugBase(name);
  const { data: b1 } = await db.from('businesses').select('id').eq('slug', base).maybeSingle();
  const { data: d1 } = await db.from('sales_demos').select('id').eq('slug', base).maybeSingle();
  if (!b1 && !d1) return base;

  for (let i = 2; i <= 50; i++) {
    const candidate = `${base}-${i}`;
    const { data: bTaken } = await db.from('businesses').select('id').eq('slug', candidate).maybeSingle();
    const { data: dTaken } = await db.from('sales_demos').select('id').eq('slug', candidate).maybeSingle();
    if (!bTaken && !dTaken) return candidate;
  }
  return `${base}-${Date.now().toString().slice(-4)}`;
}

export async function POST(req: NextRequest) {
  const access = await requireSalesSession(req);
  if ('response' in access) return access.response;

  try {
    const body = await req.json();
    const prospectId = body.prospectId;
    const demoId = body.demoId; // Demo is now completely optional
    const customerName = boundedText(body.customerName, 160);
    const customerEmail = boundedText(body.customerEmail, 320)?.toLowerCase().trim();
    const planSlug = boundedText(body.planSlug || 'standard_2year_software', 80);
    const paymentMethod = boundedText(body.paymentMethod || 'UPI', 30);
    const idempotencyKey = boundedText(body.idempotencyKey, 120);

    if (!isUuid(prospectId) || !customerName || !customerEmail || !planSlug || !paymentMethod || !idempotencyKey) {
      return NextResponse.json({ success: false, error: 'Prospect, customer details, plan, and idempotencyKey are required' }, { status: 400 });
    }

    if (demoId && !isUuid(demoId)) {
      return NextResponse.json({ success: false, error: 'Invalid demo ID format' }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail) || !PAYMENT_STATUSES.includes(paymentMethod)) {
      return NextResponse.json({ success: false, error: 'Invalid customer email or payment method' }, { status: 400 });
    }

    const db = salesDb();

    // Check existing order for idempotency
    const existing = await db.from('sales_orders').select('*').eq('idempotency_key', idempotencyKey).maybeSingle();
    if (existing.error) return databaseFailure();
    if (existing.data) {
      if (existing.data.prospect_id !== prospectId || existing.data.plan_slug !== planSlug) {
        return NextResponse.json({ success: false, error: 'Idempotency key belongs to another checkout' }, { status: 409 });
      }
      return NextResponse.json({
        success: true,
        order: existing.data,
        activationStatus: 'active',
        paymentStatus: 'VERIFIED',
        orderNo: existing.data.order_no,
      });
    }

    // Load prospect
    const prospect = await db.from('prospects').select('id,business_name,phone,category,city,assigned_to').eq('id', prospectId).maybeSingle();
    if (prospect.error) return databaseFailure();
    if (!prospect.data) return NextResponse.json({ success: false, error: 'Prospect not found' }, { status: 404 });
    if (access.session.role === 'salesperson' && prospect.data.assigned_to !== access.session.staffId) {
      return NextResponse.json({ success: false, error: 'Cannot convert an unassigned prospect' }, { status: 403 });
    }

    // Determine business tenant & slug:
    // If demo is linked, use the demo's business.
    // If NO demo is linked (direct onboarding), auto-create the business tenant & funnel directly!
    let businessId: string;
    let businessSlug: string;

    if (demoId) {
      const demo = await db.from('sales_demos').select('id,slug,business_id,business_name,category,created_by,status').eq('id', demoId).eq('prospect_id', prospectId).maybeSingle();
      if (demo.error || !demo.data?.business_id) {
        return NextResponse.json({ success: false, error: 'Associated demo could not be found' }, { status: 404 });
      }
      businessId = demo.data.business_id;
      businessSlug = demo.data.slug;
    } else {
      // Direct onboarding without a prior demo
      businessSlug = await generateSlug(db, prospect.data.business_name);
      const bizRes = await db.from('businesses').insert({
        name: prospect.data.business_name,
        slug: businessSlug,
        category: prospect.data.category || 'General Business',
        phone: boundedText(body.customerPhone, 40) || prospect.data.phone || null,
        email: customerEmail,
        status: 'active',
        plan_status: 'active',
        primary_color: '#0B3D2E',
        secondary_color: '#D4AF37',
        menu_enabled: true,
        products_enabled: true,
      }).select('id').single();

      if (bizRes.error || !bizRes.data) {
        console.error('Failed to auto-provision direct business:', bizRes.error);
        return databaseFailure('Failed to auto-create business tenant');
      }
      businessId = bizRes.data.id;

      // Auto-create funnel
      const funnelRes = await db.from('funnels').insert({
        business_id: businessId,
        slug: businessSlug,
        status: 'active',
        review_enabled: true,
        smart_review_enabled: true,
      }).select('id').single();

      // Auto-create QR code
      if (funnelRes.data) {
        await db.from('qr_codes').insert({
          business_id: businessId,
          funnel_id: funnelRes.data.id,
          name: `${prospect.data.business_name} QR`,
          short_code: `px-${crypto.randomUUID().slice(0, 8)}`,
          destination_url: `${APP_URL}/f/${businessSlug}`,
          status: 'active',
        });
      }
    }

    // Load commercial plan
    const plan = await db.from('commercial_plans').select('name,slug,price_paise,duration_years,is_lifetime,includes_nfc,is_active,max_slots').eq('slug', planSlug).eq('is_active', true).maybeSingle();
    if (plan.error) return databaseFailure();
    if (!plan.data) return NextResponse.json({ success: false, error: 'Plan not found' }, { status: 400 });

    const snapshot = {
      name: plan.data.name,
      pricePaise: plan.data.price_paise,
      durationYears: plan.data.duration_years,
      isLifetime: plan.data.is_lifetime,
      includesNfc: plan.data.includes_nfc,
      customerName,
      customerEmail,
      customerPhone: boundedText(body.customerPhone, 40) || prospect.data.phone || null,
      shippingAddress: boundedText(body.shippingAddress, 500),
      shippingCity: boundedText(body.city, 120) || prospect.data.city || null,
      shippingState: boundedText(body.state, 120),
      shippingPincode: boundedText(body.pincode, 20),
    };

    // Transaction reference: If Cash, UTR is not requested and defaults to CASH-COLLECTED
    const txnRef = paymentMethod === 'Cash'
      ? (boundedText(body.transactionReference, 160) || 'CASH-COLLECTED')
      : boundedText(body.transactionReference, 160);

    const now = new Date();
    const expiresAt = plan.data.is_lifetime
      ? null
      : new Date(now.getTime() + (plan.data.duration_years || 2) * 365 * 24 * 60 * 60 * 1000).toISOString();

    const orderNo = `PX-${crypto.randomUUID().replace(/-/g, '').slice(0, 12).toUpperCase()}`;

    // Direct Plan Activation: Directly set payment_status='VERIFIED' and conversion_status='converted'
    const order = await db.from('sales_orders').insert({
      order_no: orderNo,
      prospect_id: prospectId,
      demo_id: demoId || null,
      sales_staff_id: access.session.staffId,
      business_id: businessId,
      customer_id: null,
      plan_slug: planSlug,
      plan_snapshot: snapshot,
      amount_paise: plan.data.price_paise,
      payment_method: paymentMethod,
      transaction_reference: txnRef,
      payment_status: 'VERIFIED',
      conversion_status: 'converted',
      activated_at: now.toISOString(),
      verified_at: now.toISOString(),
      verified_by: access.session.staffId,
      verification_reason: paymentMethod === 'Cash' ? 'Cash Collected - Direct Plan Activation' : 'Salesperson Onboarding - Plan Directly Activated',
      idempotency_key: idempotencyKey,
    }).select().single();

    if (order.error || !order.data) {
      console.error('Order creation error:', order.error);
      return databaseFailure('Unable to record order');
    }

    // Direct Activation of Prospect and Demo
    await db.from('prospects').update({
      stage: 'Activated',
      is_converted: true,
      converted_business_id: businessId,
      updated_at: now.toISOString(),
    }).eq('id', prospectId);

    if (demoId) {
      await db.from('sales_demos').update({
        status: 'converted',
        updated_at: now.toISOString(),
      }).eq('id', demoId);
    }

    // Provision Client Auth User Credentials
    const customerPassword = boundedText(body.customerPassword, 120) || 'Client@1234';
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
          updated_at: now.toISOString(),
        }, { onConflict: 'id' });
      }
    } catch (authErr) {
      console.warn('Unable to auto-provision client auth user:', authErr);
    }

    // Activate Business Tenant & Funnel
    await db.from('businesses').update({
      owner_id: authUserId || undefined,
      status: 'active',
      plan_status: 'active',
      trial_expires_at: null,
      updated_at: now.toISOString(),
    }).eq('id', businessId);

    await db.from('funnels').update({
      status: 'active',
      updated_at: now.toISOString(),
    }).eq('business_id', businessId);

    await db.from('qr_codes').update({
      status: 'active',
      updated_at: now.toISOString(),
    }).eq('business_id', businessId);

    if (authUserId) {
      try {
        await db.from('business_members').upsert({
          business_id: businessId,
          user_id: authUserId,
          role: 'owner',
          updated_at: now.toISOString(),
        }, { onConflict: 'business_id,user_id' });
      } catch {}
    }

    // Record Active Trial/Subscription
    try {
      await db.from('trials').upsert({
        business_id: businessId,
        status: 'active',
        started_at: now.toISOString(),
        expires_at: expiresAt,
      }, { onConflict: 'business_id' });
    } catch {}

    // Record sales activity & audit log
    try {
      await db.from('sales_activities').insert({
        prospect_id: prospectId,
        staff_id: access.session.staffId,
        type: 'deal_converted',
        title: 'Client Plan Directly Activated',
        description: `Plan ${plan.data.name} activated directly. Order ${orderNo}.`,
      });
      await db.from('sales_audit_logs').insert({
        staff_id: access.session.staffId,
        staff_email: access.session.email,
        action: 'CLIENT_PLAN_ACTIVATED_DIRECT',
        target_type: 'sales_orders',
        target_id: order.data.id,
        details: { orderNo, businessId, planSlug, paymentMethod },
      });
    } catch {}

    const handover: CustomerHandoverPackage = {
      businessName: prospect.data.business_name,
      customerName,
      customerEmail,
      customerPhone: snapshot.customerPhone,
      businessSlug,
      loginUrl: `${APP_URL}/login`,
      publicFunnelUrl: `/f/${businessSlug}`,
      qrCodeDownloadUrl: `/api/qr/download?slug=${businessSlug}`,
      planName: plan.data.name,
      isLifetime: plan.data.is_lifetime,
      expiresAt,
      nfcOrdered: false,
      nfcAssetType: plan.data.includes_nfc ? 'Card + Stand' : undefined,
      initialPassword: customerPassword,
      whatsappMessageTemplate: `Hello ${customerName}! Welcome to Pixora Funnel.\nYour account for ${prospect.data.business_name} has been activated!\n\nSign in to your Dashboard:\n🔗 ${APP_URL}/login\n📧 Email: ${customerEmail}\n🔑 Password: ${customerPassword}\n\nLive Customer Review Funnel:\n🔗 ${APP_URL}/f/${businessSlug}\n\nYou can change your password anytime in your Profile & Security section!`,
      activationStatus: 'active',
      paymentStatus: 'VERIFIED',
      orderNo,
    };

    return NextResponse.json({
      success: true,
      order: order.data,
      handover,
      activationStatus: 'active',
      paymentStatus: 'VERIFIED',
      orderNo,
    });
  } catch (err: any) {
    console.error('Convert route error:', err);
    return databaseFailure(err?.message || 'Unable to process client conversion');
  }
}
