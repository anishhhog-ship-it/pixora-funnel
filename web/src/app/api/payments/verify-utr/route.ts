import { NextRequest, NextResponse } from 'next/server';
import { DEFAULT_PRICING_PLAN_SLUG, getPricingPlan } from '@/config/pricing';

export async function POST(req: NextRequest) {
  try {
    const { orderId, utr, businessId, businessName, planId } = await req.json();

    const cleanUtr = (utr || '').replace(/\D/g, '').trim();
    if (cleanUtr.length < 10) {
      return NextResponse.json(
        { success: false, message: 'Please enter a valid 12-digit UPI Reference Number / UTR.' },
        { status: 400 }
      );
    }

    if (!global.__pixoraOrders) {
      global.__pixoraOrders = new Map();
    }

    if (!orderId) {
      return NextResponse.json({ success: false, message: 'Missing order ID.' }, { status: 400 });
    }

    let order = global.__pixoraOrders.get(orderId);
    if (!order) {
      const plan = getPricingPlan(planId || DEFAULT_PRICING_PLAN_SLUG);
      if (!plan) {
        return NextResponse.json({ success: false, message: 'Invalid commercial plan.' }, { status: 400 });
      }
      order = {
        id: orderId,
        businessId: businessId || 'active',
        businessName: businessName || 'Client Business',
        planId: plan.slug,
        planName: plan.name,
        amount: plan.price_inr,
        isLifetime: plan.is_lifetime,
        includesNfc: plan.includes_nfc,
        currency: 'INR',
        createdAt: new Date().toISOString(),
      };
      global.__pixoraOrders.set(orderId, order);
    }

    order.utrNumber = cleanUtr;
    order.status = 'PENDING_APPROVAL';
    order.submittedAt = new Date().toISOString();
    order.verificationMethod = 'UTR_SUBMITTED';

    return NextResponse.json({
      success: true,
      status: 'PENDING_APPROVAL',
      message: '✓ UTR Reference received! Your payment has been submitted for Admin verification. Your dashboard will activate automatically as soon as the admin approves.',
      order,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
