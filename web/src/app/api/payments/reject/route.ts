import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAccess } from '@/services/adminService';

export async function POST(req: NextRequest) {
  try {
    const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
    const access = await verifyAdminAccess(token);
    if (!access.isAdmin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    const body = await req.json();
    const { orderId, reason = 'Invalid UPI Reference / Payment not credited' } = body;

    if (!orderId) {
      return NextResponse.json({ success: false, error: 'Missing orderId' }, { status: 400 });
    }

    if (!global.__pixoraOrders) {
      global.__pixoraOrders = new Map();
    }

    const order = global.__pixoraOrders.get(orderId);
    if (!order) return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });

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
