import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase/server';
import { extractAuthToken, SalesSession, verifySalesStaffAccess } from './salesAuthService';
import { SalesRole } from '@/types/sales';
export { boundedText, isUuid } from './salesValidation';

export async function requireSalesSession(
  req: NextRequest,
  roles?: SalesRole[],
): Promise<{ session: SalesSession } | { response: NextResponse }> {
  const session = await verifySalesStaffAccess(extractAuthToken(req));
  if (!session.isAuthenticated || !session.staffId || !session.role) {
    return { response: NextResponse.json({ success: false, error: 'Unauthorized sales access' }, { status: 401 }) };
  }
  if (roles && !roles.includes(session.role)) {
    return { response: NextResponse.json({ success: false, error: 'Insufficient sales permissions' }, { status: 403 }) };
  }
  return { session };
}

export function databaseFailure(message = 'Sales data is temporarily unavailable') {
  // Do not turn missing tables/columns or permission failures into an empty,
  // apparently-successful result.
  return NextResponse.json({ success: false, error: message }, { status: 503 });
}

export function salesDb() {
  return getSupabaseAdminClient() as any;
}
