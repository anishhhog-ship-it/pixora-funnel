import { NextRequest, NextResponse } from 'next/server';
import { requireSalesSession, salesDb, databaseFailure } from '@/services/salesServer';

export async function GET(req: NextRequest) {
  try {
    const access = await requireSalesSession(req);
    if ('response' in access) return access.response;
    const supabase = salesDb();

    let businessIds: string[] | null = null;
    if (access.session.role === 'salesperson') {
      const orders = await supabase.from('sales_orders').select('business_id').eq('sales_staff_id', access.session.staffId).not('business_id', 'is', null);
      if (orders.error) return databaseFailure();
       const ids = ((orders.data || []) as Array<{ business_id?: string | null }>)
         .map((o) => o.business_id)
         .filter((id): id is string => Boolean(id));
       businessIds = Array.from(new Set<string>(ids));
       if (!businessIds || businessIds.length === 0) return NextResponse.json({ success: true, customers: [] });
    }

    // Query active businesses
    let query = supabase
      .from('businesses')
      .select('id, name, slug, phone, email, category, status, created_at, plan_status, trial_expires_at')
      .order('created_at', { ascending: false });
    if (businessIds) query = query.in('id', businessIds);
    const { data: businesses, error } = await query;

    if (error) {
      return databaseFailure();
    }

    return NextResponse.json({
      success: true,
      customers: businesses || [],
    });
  } catch {
    return databaseFailure();
  }
}
