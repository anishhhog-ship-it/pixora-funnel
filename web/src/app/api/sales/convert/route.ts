import { NextRequest, NextResponse } from 'next/server';
import { requireSalesSession, salesDb, databaseFailure, boundedText, isUuid } from '@/services/salesServer';
import { CustomerHandoverPackage } from '@/types/sales';
import { DEFAULT_PRICING_PLAN_SLUG, getPricingPlan, resolvePricingPlanSlug } from '@/config/pricing';

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
    const rawProspectId = typeof body.prospectId === 'string' ? body.prospectId.trim() : body.prospectId;
    let prospectId = isUuid(rawProspectId) ? rawProspectId : null;
    const demoId = typeof body.demoId === 'string' ? body.demoId.trim() : body.demoId; // Demo is now completely optional
    const businessName = boundedText(body.businessName, 160);
    const customerName = boundedText(body.customerName, 160);
    const customerEmail = boundedText(body.customerEmail, 320)?.toLowerCase().trim();
    const customerPhone = boundedText(body.customerPhone, 40);
    const category = boundedText(body.category, 80) || 'General Business';
    const requestedPlanSlug = boundedText(body.planSlug || DEFAULT_PRICING_PLAN_SLUG, 80);
    const planSlug = resolvePricingPlanSlug(requestedPlanSlug);
    const paymentMethod = boundedText(body.paymentMethod || 'UPI', 30);
    const idempotencyKey = boundedText(body.idempotencyKey, 255) || (prospectId ? `sales-conv:${prospectId.slice(0, 8)}:${demoId ? demoId.slice(0, 8) : 'none'}:${crypto.randomUUID()}` : `sales-conv:${crypto.randomUUID()}`);

    const effectiveBusinessName = businessName || customerName;
    if (!effectiveBusinessName) {
      return NextResponse.json({ success: false, error: 'Business name or customer name is required' }, { status: 400 });
    }
    if (!customerName) {
      return NextResponse.json({ success: false, error: 'Customer name is required' }, { status: 400 });
    }
    if (!customerEmail) {
      return NextResponse.json({ success: false, error: 'Customer email is required' }, { status: 400 });
    }
    if (!planSlug) {
      return NextResponse.json({ success: false, error: 'Commercial plan is required' }, { status: 400 });
    }

    const canonicalPlan = getPricingPlan(planSlug);
    if (!canonicalPlan) {
      return NextResponse.json({ success: false, error: 'Commercial plan is not available' }, { status: 400 });
    }
    if (!paymentMethod) {
      return NextResponse.json({ success: false, error: 'Payment method is required' }, { status: 400 });
    }
    if (!idempotencyKey) {
      return NextResponse.json({ success: false, error: 'Idempotency key is required' }, { status: 400 });
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
      if (existing.data.plan_slug !== planSlug) {
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

    let prospectData: any = null;

    if (prospectId) {
      // Load existing prospect
      const prospect = await db.from('prospects').select('id,business_name,phone,category,city,address,assigned_to,google_maps_url').eq('id', prospectId).maybeSingle();
      if (prospect.error) return databaseFailure();
      if (!prospect.data) return NextResponse.json({ success: false, error: 'Prospect not found' }, { status: 404 });
      if (access.session.role === 'salesperson' && prospect.data.assigned_to && prospect.data.assigned_to !== access.session.staffId) {
        return NextResponse.json({ success: false, error: 'Cannot convert an unassigned prospect' }, { status: 403 });
      }
      prospectData = prospect.data;
    } else {
      // Auto-generate lead/prospect from details provided by salesperson to make onboarding instant & simple
      const targetAddress = boundedText(body.address || body.shippingAddress, 300) || null;
      const targetCity = boundedText(body.city, 100) || null;
      const newLead = await db.from('prospects').insert({
        business_name: effectiveBusinessName,
        contact_name: customerName,
        phone: customerPhone || null,
        email: customerEmail,
        category: category,
        city: targetCity,
        address: targetAddress,
        google_maps_url: boundedText(body.googleMapsUrl || body.website, 500) || null,
        lead_source: 'Field Sales',
        assigned_to: access.session.staffId || null,
        stage: 'Activated',
        is_converted: true,
        notes: 'Auto-generated lead from direct client onboarding',
      }).select('id,business_name,phone,category,city,address,assigned_to,google_maps_url').single();

      if (newLead.error || !newLead.data) {
        console.error('Failed to auto-generate lead:', newLead.error);
        return databaseFailure('Failed to auto-generate lead for client onboarding');
      }

      prospectId = newLead.data.id;
      prospectData = newLead.data;
    }

    const targetAddress = boundedText(body.address || body.shippingAddress, 300) || prospectData.address || null;
    const targetCity = boundedText(body.city, 100) || prospectData.city || null;
    const targetPhone = boundedText(body.customerPhone, 40) || prospectData.phone || null;

    // Determine business tenant & slug:
    // If demo is linked, use the demo's business.
    // If NO demo is linked (direct onboarding), auto-create the business tenant & funnel directly!
    let businessId: string;
    let businessSlug: string;

    if (demoId) {
      const demo = await db.from('sales_demos').select('id,slug,business_id,business_name,category,created_by,status,review_destination_url,prospect_id').eq('id', demoId).maybeSingle();
      if (demo.error || !demo.data?.business_id) {
        return NextResponse.json({ success: false, error: 'Associated demo could not be found' }, { status: 404 });
      }
      businessId = demo.data.business_id;
      businessSlug = demo.data.slug;

      // Link prospect to demo if it wasn't linked
      if (!demo.data.prospect_id && prospectId) {
        await db.from('sales_demos').update({ prospect_id: prospectId }).eq('id', demoId);
      }

      // Ensure category, review destination URL, address, city, and phone are synced to the business record
      const updateData: Record<string, any> = {};
      if (demo.data.category || prospectData.category) {
        updateData.category = demo.data.category || prospectData.category;
      }
      const targetReviewUrl = demo.data.review_destination_url || prospectData.google_maps_url;
      if (targetReviewUrl) {
        updateData.website = targetReviewUrl;
      }
      if (targetAddress) updateData.address = targetAddress;
      if (targetCity) updateData.city = targetCity;
      if (targetPhone) updateData.phone = targetPhone;
      if (Object.keys(updateData).length > 0) {
        await db.from('businesses').update(updateData).eq('id', businessId);
      }
    } else {
      // Direct onboarding without a prior demo
      businessSlug = await generateSlug(db, prospectData.business_name);
      const bizRes = await db.from('businesses').insert({
        name: prospectData.business_name,
        slug: businessSlug,
        category: prospectData.category || 'General Business',
        website: prospectData.google_maps_url || null,
        phone: targetPhone,
        address: targetAddress,
        city: targetCity,
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
          name: `${prospectData.business_name} QR`,
          short_code: `px-${crypto.randomUUID().slice(0, 8)}`,
          destination_url: `${APP_URL}/f/${businessSlug}`,
          status: 'active',
        });
      }
    }

    // Load commercial plan
    const planLookup = await db.from('commercial_plans').select('name,slug,price_paise,duration_years,is_lifetime,includes_nfc,is_active,max_slots').eq('slug', planSlug).eq('is_active', true).maybeSingle();
    if (planLookup.error) return databaseFailure();
    const authoritativePlan = canonicalPlan;

    const snapshot = {
      name: authoritativePlan.name,
      pricePaise: authoritativePlan.price_paise,
      durationYears: authoritativePlan.duration_years,
      isLifetime: authoritativePlan.is_lifetime,
      includesNfc: authoritativePlan.includes_nfc,
      customerName,
      customerEmail,
      customerPhone: boundedText(body.customerPhone, 40) || prospectData.phone || null,
      shippingAddress: boundedText(body.shippingAddress, 500),
      shippingCity: boundedText(body.city, 120) || prospectData.city || null,
      shippingState: boundedText(body.state, 120),
      shippingPincode: boundedText(body.pincode, 20),
    };

    // Transaction reference: If Cash, UTR is not requested and defaults to CASH-COLLECTED
    const txnRef = paymentMethod === 'Cash'
      ? (boundedText(body.transactionReference, 160) || 'CASH-COLLECTED')
      : boundedText(body.transactionReference, 160);

    const now = new Date();
    const expiresAt = authoritativePlan.is_lifetime
      ? null
      : new Date(now.getTime() + (authoritativePlan.duration_years || 1) * 365 * 24 * 60 * 60 * 1000).toISOString();

    const orderNo = `PX-${crypto.randomUUID().replace(/-/g, '').slice(0, 12).toUpperCase()}`;

    // verified_by references auth.users(id) - use authUserId, never staffId!
    const verifiedBy = access.session.authUserId || null;

    const baseOrderPayload = {
      order_no: orderNo,
      prospect_id: prospectId,
      demo_id: demoId || null,
      sales_staff_id: access.session.staffId || null,
      business_id: businessId,
      customer_id: null,
      plan_slug: planSlug,
      plan_snapshot: snapshot,
      amount_paise: authoritativePlan.price_paise,
      payment_method: paymentMethod,
      transaction_reference: txnRef,
      payment_status: 'VERIFIED',
      conversion_status: 'converted',
      converted_at: now.toISOString(),
      verified_at: now.toISOString(),
      verified_by: verifiedBy,
      idempotency_key: idempotencyKey,
    };

    if (authoritativePlan.includes_nfc) {
      const requiredShipping = [
        snapshot.shippingAddress,
        snapshot.shippingCity,
        snapshot.shippingState,
        snapshot.shippingPincode,
        snapshot.customerPhone,
      ];
      if (requiredShipping.some((value) => !value)) {
        return NextResponse.json({
          success: false,
          error: 'NFC doorstep delivery requires shipping address, city, state, pincode, and customer phone.',
        }, { status: 400 });
      }
    }

    // Try insert with optional hardening columns first
    let order = await db.from('sales_orders').insert({
      ...baseOrderPayload,
      activated_at: now.toISOString(),
      verification_reason: paymentMethod === 'Cash' ? 'Cash Collected - Direct Plan Activation' : 'Salesperson Onboarding - Plan Directly Activated',
    }).select().single();

    // Fallback 1: If optional columns don't exist in older migrations, retry with baseOrderPayload
    if (order.error && (order.error.code === '42703' || order.error.message?.includes('does not exist'))) {
      console.warn('sales_orders optional columns missing, falling back to base payload:', order.error.message);
      order = await db.from('sales_orders').insert(baseOrderPayload).select().single();
    }

    // Fallback 2: If foreign key violation on verified_by, retry with verified_by: null
    if (order.error && (order.error.code === '23503' || order.error.message?.includes('verified_by'))) {
      console.warn('sales_orders foreign key violation, retrying with verified_by: null:', order.error.message);
      order = await db.from('sales_orders').insert({
        ...baseOrderPayload,
        verified_by: null,
      }).select().single();
    }

    if (order.error || !order.data) {
      console.error('Order creation error:', order.error);
      return NextResponse.json({
        success: false,
        error: order.error?.message || 'Unable to record order'
      }, { status: 400 });
    }

    if (authoritativePlan.includes_nfc) {
      const { error: nfcError } = await db.from('nfc_orders').insert({
        sales_order_id: order.data.id,
        business_id: businessId,
        recipient_name: customerName,
        shipping_address: snapshot.shippingAddress,
        city: snapshot.shippingCity,
        state: snapshot.shippingState,
        pincode: snapshot.shippingPincode,
        contact_phone: snapshot.customerPhone,
        nfc_asset_type: 'Card + Stand',
        status: 'Ordered',
        notes: 'Lifetime Software + NFC doorstep delivery plan',
      });

      if (nfcError) {
        console.error('NFC fulfillment record creation failed:', nfcError);
        await db.from('sales_orders').delete().eq('id', order.data.id);
        return NextResponse.json({ success: false, error: 'The NFC fulfillment record could not be created. The order was not activated.' }, { status: 500 });
      }
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
          auth_user_id: authUserId,
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
      email: customerEmail,
      status: 'active',
      plan_status: 'active',
      trial_expires_at: null,
      updated_at: now.toISOString(),
      ...(targetAddress ? { address: targetAddress } : {}),
      ...(targetCity ? { city: targetCity } : {}),
      ...(targetPhone ? { phone: targetPhone } : {}),
    }).eq('id', businessId);

    // Sync address back to prospects if prospect record was missing it
    if (targetAddress || targetCity || targetPhone) {
      await db.from('prospects').update({
        ...(targetAddress ? { address: targetAddress } : {}),
        ...(targetCity ? { city: targetCity } : {}),
        ...(targetPhone ? { phone: targetPhone } : {}),
      }).eq('id', prospectId);
    }

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
        await db.from('sales_orders').update({
          customer_id: authUserId,
        }).eq('id', order.data.id);
      } catch {}

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
        type: 'converted',
        title: 'Client Plan Directly Activated',
        description: `Plan ${authoritativePlan.name} activated directly. Order ${orderNo}.`,
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
      businessName: prospectData.business_name,
      customerName,
      customerEmail,
      customerPhone: snapshot.customerPhone,
      businessSlug,
      loginUrl: `${APP_URL}/login`,
      publicFunnelUrl: `/f/${businessSlug}`,
      qrCodeDownloadUrl: `/api/qr/download?slug=${businessSlug}`,
      planName: authoritativePlan.name,
      isLifetime: authoritativePlan.is_lifetime,
      expiresAt,
       nfcOrdered: authoritativePlan.includes_nfc,
      nfcAssetType: authoritativePlan.includes_nfc ? 'Card + Stand' : undefined,
      initialPassword: customerPassword,
      whatsappMessageTemplate: `Hello ${customerName}! Welcome to Pixora Funnel.\nYour account for ${prospectData.business_name} has been activated!\n\nSign in to your Dashboard:\n🔗 ${APP_URL}/login\n📧 Email: ${customerEmail}\n🔑 Password: ${customerPassword}\n\nLive Customer Review Funnel:\n🔗 ${APP_URL}/f/${businessSlug}\n\nYou can change your password anytime in your Profile & Security section!`,
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
