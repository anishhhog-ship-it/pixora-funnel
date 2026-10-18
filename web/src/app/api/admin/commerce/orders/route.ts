import { NextRequest, NextResponse } from 'next/server';
import {
  commerceErrorResponse,
  getAdminCommerceOrders,
  updateAdminCommerceOrderStatus,
} from '@/services/commerceService';
import { extractAuthToken } from '@/services/salesAuthService';
import type { CommerceOrderStatus } from '@/types/commerce';

export const dynamic = 'force-dynamic';

/** Admin monitoring contract: list all commerce orders, optionally by status. */
export async function GET(req: NextRequest) {
  try {
    const status = new URL(req.url).searchParams.get('status') || undefined;
    const orders = await getAdminCommerceOrders(extractAuthToken(req), status);
    return NextResponse.json({ success: true, orders });
  } catch (error) {
    return commerceErrorResponse(error, 'Admin orders are temporarily unavailable');
  }
}

/** Admin status contract: transitions are audited and stock is reconciled by RPC. */
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json() as { orderId?: unknown; newStatus?: unknown; notes?: unknown };
    const orderId = typeof body.orderId === 'string' ? body.orderId : '';
    const newStatus = typeof body.newStatus === 'string' ? body.newStatus as CommerceOrderStatus : '' as CommerceOrderStatus;
    const notes = typeof body.notes === 'string' ? body.notes : undefined;
    const order = await updateAdminCommerceOrderStatus(extractAuthToken(req), orderId, newStatus, notes);
    return NextResponse.json({ success: true, order });
  } catch (error) {
    return commerceErrorResponse(error, 'Order status could not be updated');
  }
}
