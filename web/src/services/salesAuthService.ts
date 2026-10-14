import { getSupabaseAdminClient } from '@/lib/supabase/server';
import { SalesRole } from '@/types/sales';

export interface SalesSession {
  isAuthenticated: boolean;
  role?: SalesRole;
  staffId?: string;
  email?: string;
  fullName?: string;
  isSuperAdmin?: boolean;
  authUserId?: string;
}

/**
 * Authoritatively verifies whether a user token belongs to an active staff member or Super Admin.
 * Runs strictly server-side using Supabase Admin Client.
 */
export async function verifySalesStaffAccess(token: string): Promise<SalesSession> {
  try {
    if (!token) return { isAuthenticated: false };

    const supabase = getSupabaseAdminClient();
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return { isAuthenticated: false };
    }

    // A platform-admin row is not, by itself, a sales role. Only an explicitly
    // designated super_admin may receive the global sales-admin capability.
    const { data: adminRecord } = await (supabase as any)
      .from('platform_admins')
      .select('auth_user_id,email,full_name,role,is_active')
      .eq('auth_user_id', user.id)
      .eq('role', 'super_admin')
      .eq('is_active', true)
      .maybeSingle();

    if (adminRecord) {
      // Find or link a sales_staff row for this super admin
      const { data: existingStaff } = await (supabase as any)
        .from('sales_staff')
        .select('*')
        .eq('auth_user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (!existingStaff || existingStaff.role !== 'admin') return { isAuthenticated: false };

      return {
        isAuthenticated: true,
        role: 'admin',
        staffId: existingStaff.id,
        email: adminRecord.email || user.email,
        fullName: existingStaff.full_name || 'Super Admin',
        isSuperAdmin: true,
        authUserId: user.id,
      };
    }

    // 2. Check if user is in sales_staff with active status
    const { data: staffRecord, error: staffErr } = await (supabase as any)
      .from('sales_staff')
      .select('*')
      .eq('auth_user_id', user.id)
      .eq('status', 'active')
      .maybeSingle();

    if (staffErr || !staffRecord) {
      return { isAuthenticated: false };
    }

    // Update last_active_at asynchronously
    (supabase as any)
      .from('sales_staff')
      .update({ last_active_at: new Date().toISOString() })
      .eq('id', staffRecord.id)
      .then(() => {})
      .catch(() => {});

    return {
      isAuthenticated: true,
      role: staffRecord.role as SalesRole,
      staffId: staffRecord.id,
      email: staffRecord.email,
      fullName: staffRecord.full_name,
      // A sales-admin role is not the platform super-admin role.
      isSuperAdmin: false,
      authUserId: user.id,
    };
  } catch (err) {
    console.error('verifySalesStaffAccess error:', err);
    return { isAuthenticated: false };
  }
}

/**
 * Extracts Bearer token from incoming Request header
 */
export function extractAuthToken(req: Request): string {
  const authHeader = req.headers.get('authorization') || '';
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }
  return '';
}
