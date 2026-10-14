import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase/server';

export async function GET() {
  const inMemoryOrders = Array.from(global.__pixoraOrders?.values() || []).sort(
    (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return NextResponse.json({
    success: true,
    orders: inMemoryOrders,
  });
}

// Manual Approve & Activate by Admin
export async function POST(req: NextRequest) {
  try {
    const { orderId, businessId } = await req.json();

    const order = global.__pixoraOrders?.get(orderId);
    if (order) {
      order.status = 'PAID';
      order.paidAt = new Date().toISOString();
      order.verificationMethod = 'ADMIN_MANUAL';
    }

    const targetBizId = businessId || order?.businessId;
    const twoYearsExpiry = new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000).toISOString();

    const supabase = getSupabaseAdminClient();
    if (supabase && targetBizId && !targetBizId.startsWith('biz_')) {
      await (supabase as any)
        .from('businesses')
        .update({ status: 'active', trial_expires_at: twoYearsExpiry })
        .or(`id.eq.${targetBizId},slug.eq.${targetBizId}`);

      await (supabase as any)
        .from('trials')
        .upsert({ business_id: targetBizId, status: 'active', expires_at: twoYearsExpiry });
    }

    return NextResponse.json({
      success: true,
      message: '✓ Order manually approved and business activated for 2 Years.',
      order,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
