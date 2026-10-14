import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { orderId, utr, businessId, businessName, amount, planName } = await req.json();

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

    let order = global.__pixoraOrders.get(orderId);
    if (!order) {
      order = {
        id: orderId,
        businessId: businessId || 'active',
        businessName: businessName || 'Client Business',
        planId: 'plan_2year_software',
        planName: planName || 'Standard 2-Year Plan',
        amount: Number(amount) || 2599,
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

