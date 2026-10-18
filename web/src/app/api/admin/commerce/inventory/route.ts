import { NextRequest, NextResponse } from 'next/server';
import {
  commerceErrorResponse,
  updateAdminCommerceInventory,
} from '@/services/commerceService';
import { extractAuthToken } from '@/services/salesAuthService';

export const dynamic = 'force-dynamic';

/** Admin inventory contract: explicitly set available stock and threshold. */
export async function PATCH(req: NextRequest) {
  try {
    const params = new URL(req.url).searchParams;
    const productId = params.get('productId') || params.get('id') || '';
    const inventory = await updateAdminCommerceInventory(extractAuthToken(req), productId, await req.json());
    return NextResponse.json({ success: true, inventory });
  } catch (error) {
    return commerceErrorResponse(error, 'Inventory could not be updated');
  }
}
