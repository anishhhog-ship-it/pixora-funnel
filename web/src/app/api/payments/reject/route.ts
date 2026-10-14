import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, reason = 'Invalid UPI Reference / Payment not credited' } = body;

    if (!orderId) {
      return NextResponse.json({ success: false, error: 'Missing orderId' }, { status: 400 });
    }

    if (!global.__pixoraOrders) {
      global.__pixoraOrders = new Map();
    }

    let order = global.__pixoraOrders.get(orderId);
    if (!order) {
      order = {
        id: orderId,
        businessId: body.businessId || 'active',
        businessName: body.businessName || 'Client Business',
        planId: 'plan_2year_software',
        planName: 'Standard 2-Year Plan',
        amount: 2599,
        currency: 'INR',
        createdAt: new Date().toISOString(),
      };
      global.__pixoraOrders.set(orderId, order);
    }

    order.status = 'REJECTED';
    order.rejectionReason = reason;
    order.rejectedAt = new Date().toISOString();

    return NextResponse.json({
      success: true,
      message: `Order #${orderId} has been rejected.`,
      order: order || { id: orderId, status: 'REJECTED', rejectionReason: reason },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
