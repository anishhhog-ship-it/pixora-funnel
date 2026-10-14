import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, businessId } = body;

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
        businessId: businessId || 'active',
        businessName: body.businessName || 'Client Business',
        planId: 'plan_2year_software',
        planName: 'Standard 2-Year Plan',
        amount: 2599,
        currency: 'INR',
        createdAt: new Date().toISOString(),
      };
      global.__pixoraOrders.set(orderId, order);
    }

    order.status = 'PAID';
    order.paidAt = new Date().toISOString();
    order.approvedAt = new Date().toISOString();
    order.verificationMethod = 'ADMIN_APPROVED';

    const targetBizId = businessId || order.businessId;
    const twoYearsExpiry = new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000).toISOString();

    // 1. Supabase Cloud Sync
    try {
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
    } catch (e) {
      console.warn('Supabase cloud activation error in approve:', e);
    }

    return NextResponse.json({
      success: true,
      message: `✓ Order #${orderId} approved! Business dashboard has been activated for 2 Years.`,
      order: order || { id: orderId, status: 'PAID' },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
