import { NextRequest, NextResponse } from 'next/server';
import {
  commerceErrorResponse,
  createAdminCommerceProduct,
  getAdminCommerceProducts,
  updateAdminCommerceProduct,
  archiveAdminCommerceProduct,
} from '@/services/commerceService';
import { extractAuthToken } from '@/services/salesAuthService';

export const dynamic = 'force-dynamic';

function tokenFrom(req: NextRequest) {
  return extractAuthToken(req);
}

/** Admin product CRUD. DELETE archives a product to preserve order history. */
export async function GET(req: NextRequest) {
  try {
    const products = await getAdminCommerceProducts(tokenFrom(req));
    return NextResponse.json({ success: true, products });
  } catch (error) {
    return commerceErrorResponse(error, 'Admin product catalog is temporarily unavailable');
  }
}

export async function POST(req: NextRequest) {
  try {
    const product = await createAdminCommerceProduct(tokenFrom(req), await req.json());
    return NextResponse.json({ success: true, product }, { status: 201 });
  } catch (error) {
    return commerceErrorResponse(error, 'Product could not be created');
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const productId = new URL(req.url).searchParams.get('productId') || new URL(req.url).searchParams.get('id') || '';
    const product = await updateAdminCommerceProduct(tokenFrom(req), productId, await req.json());
    return NextResponse.json({ success: true, product });
  } catch (error) {
    return commerceErrorResponse(error, 'Product could not be updated');
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const productId = new URL(req.url).searchParams.get('productId') || new URL(req.url).searchParams.get('id') || '';
    const product = await archiveAdminCommerceProduct(tokenFrom(req), productId);
    return NextResponse.json({ success: true, product, archived: true });
  } catch (error) {
    return commerceErrorResponse(error, 'Product could not be archived');
  }
}
