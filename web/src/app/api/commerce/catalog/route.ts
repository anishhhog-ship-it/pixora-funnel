import { NextResponse } from 'next/server';
import { commerceErrorResponse, getPublicCommerceCatalog } from '@/services/commerceService';

export const dynamic = 'force-dynamic';

/** Public catalog contract: active products plus current stock availability. */
export async function GET() {
  try {
    const products = await getPublicCommerceCatalog();
    return NextResponse.json({ success: true, products });
  } catch (error) {
    return commerceErrorResponse(error, 'Product catalog is temporarily unavailable');
  }
}
