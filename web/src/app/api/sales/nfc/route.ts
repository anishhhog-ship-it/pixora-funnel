import { NextRequest, NextResponse } from 'next/server';
import { requireSalesSession, salesDb, databaseFailure, isUuid, boundedText } from '@/services/salesServer';

export async function GET(req: NextRequest) {
  try {
    const access = await requireSalesSession(req);
    if ('response' in access) return access.response;
    const supabase = salesDb();
    let query = supabase.from('nfc_orders').select('*, sales_order:sales_order_id(order_no, amount_inr, plan_snapshot, sales_staff_id), business:business_id(name, slug)').order('created_at', { ascending: false });
    if (access.session.role === 'salesperson') {
      const staffOrders = await supabase.from('sales_orders').select('id').eq('sales_staff_id', access.session.staffId);
      if (staffOrders.error) return databaseFailure();
      const orderIds = (staffOrders.data || []).map((order: { id: string }) => order.id);
      if (!orderIds.length) return NextResponse.json({ success: true, nfcOrders: [] });
      query = query.in('sales_order_id', orderIds);
    }
    const { data: nfcOrders, error } = await query;

    if (error) {
      return databaseFailure();
    }

    return NextResponse.json({ success: true, nfcOrders: nfcOrders || [] });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const access = await requireSalesSession(req, ['admin', 'sales_manager']);
    if ('response' in access) return access.response;

    const { nfcOrderId, status, courierName, trackingNumber, notes } = await req.json();
    if (!isUuid(nfcOrderId) || !['Ordered', 'In Production', 'Dispatched', 'Delivered', 'Cancelled'].includes(status)) {
      return NextResponse.json({ success: false, error: 'NFC Order ID and status required' }, { status: 400 });
    }

    const supabase = salesDb();
    const updatePayload: Record<string, any> = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (courierName !== undefined) updatePayload.courier_name = boundedText(courierName, 160);
    if (trackingNumber !== undefined) updatePayload.tracking_number = boundedText(trackingNumber, 160);
    if (notes !== undefined) updatePayload.notes = boundedText(notes, 1000);
    if (status === 'Dispatched') updatePayload.shipped_at = new Date().toISOString();
    if (status === 'Delivered') updatePayload.delivered_at = new Date().toISOString();

    const { data: updated, error } = await (supabase as any)
      .from('nfc_orders')
      .update(updatePayload)
      .eq('id', nfcOrderId)
      .select()
      .single();

    if (error) {
      return databaseFailure();
    }

    return NextResponse.json({
      success: true,
      message: `NFC physical shipment marked as ${status}.`,
      nfcOrder: updated,
    });
  } catch {
    return databaseFailure();
  }
}
