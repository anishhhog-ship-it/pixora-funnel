import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const orderId = searchParams.get('orderId');

  if (!orderId) {
    return NextResponse.json({ success: false, error: 'Missing orderId' }, { status: 400 });
  }

  const order = global.__pixoraOrders?.get(orderId);
  if (!order) {
    return NextResponse.json({ success: false, status: 'NOT_FOUND' }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    orderId,
    status: order.status,
    order,
  });
}
