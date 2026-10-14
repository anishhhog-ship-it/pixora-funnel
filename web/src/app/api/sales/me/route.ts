import { NextRequest, NextResponse } from 'next/server';
import { verifySalesStaffAccess, extractAuthToken } from '@/services/salesAuthService';

export async function GET(req: NextRequest) {
  const session = await verifySalesStaffAccess(extractAuthToken(req));

  if (!session.isAuthenticated || !session.role || !session.staffId) {
    return NextResponse.json({ success: false, error: 'Unauthorized sales access' }, { status: 401 });
  }

  return NextResponse.json({
    success: true,
    staff: {
      staffId: session.staffId,
      role: session.role,
      fullName: session.fullName || 'Sales team member',
      email: session.email || '',
      isSuperAdmin: Boolean(session.isSuperAdmin),
    },
  });
}
