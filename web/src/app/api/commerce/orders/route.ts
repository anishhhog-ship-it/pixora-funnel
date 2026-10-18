import { NextRequest, NextResponse } from 'next/server';
import {
  commerceErrorResponse,
  createClientCommerceOrder,
  getClientCommerceOrders,
  requireCommerceUser,
} from '@/services/commerceService';

export const dynamic = 'force-dynamic';

/** Authenticated client contract: read only the caller's orders. */
export async function GET(req: NextRequest) {
  const access = await requireCommerceUser(req);
  if ('response' in access) return access.response;
  try {
    const orders = await getClientCommerceOrders(access.user.id);
    return NextResponse.json({ success: true, orders });
  } catch (error) {
    return commerceErrorResponse(error, 'Your orders are temporarily unavailable');
  }
}

/** Authenticated client contract: create a pending/admin-review order. */
export async function POST(req: NextRequest) {
  const access = await requireCommerceUser(req);
  if ('response' in access) return access.response;
  try {
    const body = await req.json();
    const order = await createClientCommerceOrder(access.user.id, body);
    return NextResponse.json({
      success: true,
      order,
      paymentStatus: order.paymentStatus,
      message: 'Order submitted for admin review; payment has not been marked successful.',
    }, { status: 201 });
  } catch (error) {
    return commerceErrorResponse(error, 'Order could not be created');
  }
}
