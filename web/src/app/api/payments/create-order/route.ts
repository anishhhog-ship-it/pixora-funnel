import { NextRequest, NextResponse } from 'next/server';
import { constructUpiUri } from '@/lib/qrDecoder';
import { DEFAULT_PRICING_PLAN_SLUG, getPricingPlan } from '@/config/pricing';

// In-memory global order map for instant server-side status checks
declare global {
  var __pixoraOrders: Map<string, any> | undefined;
  var __pixoraPaymentConfig: any | undefined;
}

if (!global.__pixoraOrders) {
  global.__pixoraOrders = new Map();
}
if (!global.__pixoraPaymentConfig) {
  global.__pixoraPaymentConfig = {
    upiId: '9257378047@ybl',
    payeeName: 'Pixora Automations',
    qrImageUrl: '',
    autoActivateOnNotification: true,
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { businessId, businessName, planId } = body;
    const plan = getPricingPlan(planId || DEFAULT_PRICING_PLAN_SLUG);

    if (!businessId || !plan) {
      return NextResponse.json({ success: false, error: 'Missing required parameters' }, { status: 400 });
    }

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderId = `PX-ORD-${Date.now().toString().slice(-6)}${randomSuffix}`;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 15 * 60 * 1000).toISOString();

    const config = global.__pixoraPaymentConfig;
    const upiUri = constructUpiUri({
      upiId: config.upiId,
      payeeName: config.payeeName,
      amount: plan.price_inr,
      orderId,
      note: `Pixora ${plan.name} - ${orderId}`,
    });

    const order = {
      id: orderId,
      businessId,
      businessName: businessName || 'Client Business',
      planId: plan.slug,
      planName: plan.name,
      amount: plan.price_inr,
      isLifetime: plan.is_lifetime,
      includesNfc: plan.includes_nfc,
      currency: 'INR',
      status: 'PENDING',
      upiUri,
      upiId: config.upiId,
      payeeName: config.payeeName,
      qrImageUrl: config.qrImageUrl,
      createdAt: now.toISOString(),
      expiresAt,
    };

    global.__pixoraOrders!.set(orderId, order);

    return NextResponse.json({ success: true, order });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
