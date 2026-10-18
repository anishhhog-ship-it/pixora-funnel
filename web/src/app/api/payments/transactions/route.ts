import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase/server';
import { verifyAdminAccess } from '@/services/adminService';

async function requireAdmin(req: NextRequest) {
  const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  const access = await verifyAdminAccess(token);
  return access.isAdmin;
}

export async function GET(req: NextRequest) {
  if (!(await requireAdmin(req))) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
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
  if (!(await requireAdmin(req))) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  try {
    const { orderId, businessId } = await req.json();

    const order = global.__pixoraOrders?.get(orderId);
    if (order) {
      order.status = 'PAID';
      order.paidAt = new Date().toISOString();
      order.verificationMethod = 'ADMIN_MANUAL';
    }

    const targetBizId = businessId || order?.businessId;
    const lifetimeExpiry = order?.isLifetime === false
      ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
      : null;

    const supabase = getSupabaseAdminClient();
    if (supabase && targetBizId && !targetBizId.startsWith('biz_')) {
      await (supabase as any)
        .from('businesses')
         .update({ status: 'active', plan_status: 'active', trial_expires_at: lifetimeExpiry })
        .or(`id.eq.${targetBizId},slug.eq.${targetBizId}`);

       if (lifetimeExpiry) {
         await (supabase as any)
           .from('trials')
           .upsert({ business_id: targetBizId, status: 'active', expires_at: lifetimeExpiry });
       } else {
         await (supabase as any)
           .from('trials')
           .update({ status: 'cancelled' })
           .eq('business_id', targetBizId)
           .eq('status', 'active');
       }
    }

    return NextResponse.json({
      success: true,
      message: '✓ Order manually approved and business activated with lifetime access.',
      order,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
