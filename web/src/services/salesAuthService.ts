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

    const userEmail = (user.email || '').toLowerCase().trim();
    const isDefaultAdminEmail = userEmail === 'admin@pixoraautomations.com';

    // 1. Check if user is a platform administrator (super_admin or admin)
    let adminRecord: any = null;
    try {
      const orFilter = userEmail
        ? `auth_user_id.eq.${user.id},email.ilike.${userEmail}`
        : `auth_user_id.eq.${user.id}`;

      const { data: adminData } = await (supabase as any)
        .from('platform_admins')
        .select('*')
        .or(orFilter)
        .eq('is_active', true)
        .maybeSingle();

      adminRecord = adminData;
    } catch (adminQueryErr) {
      console.warn('verifySalesStaffAccess: platform_admins query warning:', adminQueryErr);
    }

    const isPlatformAdmin = Boolean(
      adminRecord && (adminRecord.role === 'super_admin' || adminRecord.role === 'admin')
    ) || isDefaultAdminEmail;

    if (isPlatformAdmin) {
      // Find or link an active sales_staff row with role 'admin' for this administrator
      let existingStaff: any = null;
      try {
        const staffOrFilter = userEmail
          ? `auth_user_id.eq.${user.id},email.ilike.${userEmail}`
          : `auth_user_id.eq.${user.id}`;

        const { data: foundStaff } = await (supabase as any)
          .from('sales_staff')
          .select('*')
          .or(staffOrFilter)
          .maybeSingle();

        existingStaff = foundStaff;
      } catch (staffFindErr) {
        console.warn('verifySalesStaffAccess: finding existing staff for admin warning:', staffFindErr);
      }

      if (existingStaff) {
        // Ensure auth_user_id, admin role, and active status are linked
        if (existingStaff.auth_user_id !== user.id || existingStaff.role !== 'admin' || existingStaff.status !== 'active') {
          await (supabase as any)
            .from('sales_staff')
            .update({
              auth_user_id: user.id,
              role: 'admin',
              status: 'active',
              last_active_at: new Date().toISOString(),
            })
            .eq('id', existingStaff.id);
        } else {
          (supabase as any)
            .from('sales_staff')
            .update({ last_active_at: new Date().toISOString() })
            .eq('id', existingStaff.id)
            .then(() => {})
            .catch(() => {});
        }
      } else {
        // Auto-provision an admin sales_staff row so conversions, demos, and sales orders work properly
        try {
          const { data: newStaff } = await (supabase as any)
            .from('sales_staff')
            .insert({
              auth_user_id: user.id,
              email: userEmail || adminRecord?.email || 'admin@pixoraautomations.com',
              full_name: adminRecord?.full_name || user.user_metadata?.full_name || 'Super Admin',
              role: 'admin',
              status: 'active',
              last_active_at: new Date().toISOString(),
            })
            .select('*')
            .single();

          if (newStaff) {
            existingStaff = newStaff;
          }
        } catch (insertErr) {
          console.warn('verifySalesStaffAccess: auto-provision sales_staff error:', insertErr);
        }
      }

      const staffId = existingStaff?.id || user.id;

      return {
        isAuthenticated: true,
        role: 'admin',
        staffId,
        email: userEmail || adminRecord?.email || user.email,
        fullName: existingStaff?.full_name || adminRecord?.full_name || 'Super Admin',
        isSuperAdmin: true,
        authUserId: user.id,
      };
    }

    // 2. Check if user is in sales_staff with active status (match by auth_user_id OR email)
    const staffOrFilter = userEmail
      ? `auth_user_id.eq.${user.id},email.ilike.${userEmail}`
      : `auth_user_id.eq.${user.id}`;

    const { data: staffRecord, error: staffErr } = await (supabase as any)
      .from('sales_staff')
      .select('*')
      .or(staffOrFilter)
      .eq('status', 'active')
      .maybeSingle();

    if (staffErr || !staffRecord) {
      return { isAuthenticated: false };
    }

    // If staff record had NULL auth_user_id, link it now
    if (!staffRecord.auth_user_id || staffRecord.auth_user_id !== user.id) {
      (supabase as any)
        .from('sales_staff')
        .update({ auth_user_id: user.id, last_active_at: new Date().toISOString() })
        .eq('id', staffRecord.id)
        .then(() => {})
        .catch(() => {});
    } else {
      (supabase as any)
        .from('sales_staff')
        .update({ last_active_at: new Date().toISOString() })
        .eq('id', staffRecord.id)
        .then(() => {})
        .catch(() => {});
    }

    return {
      isAuthenticated: true,
      role: staffRecord.role as SalesRole,
      staffId: staffRecord.id,
      email: staffRecord.email,
      fullName: staffRecord.full_name,
      isSuperAdmin: staffRecord.role === 'admin',
      authUserId: user.id,
    };
  } catch (err) {
    console.error('verifySalesStaffAccess error:', err);
    return { isAuthenticated: false };
  }
}

/**
 * Extracts Bearer token from incoming Request header or cookies
 */
export function extractAuthToken(req: Request): string {
  const authHeader = req.headers.get('authorization') || '';
  if (authHeader.startsWith('Bearer ')) {
    const bearer = authHeader.substring(7).trim();
    if (bearer) return bearer;
  }

  // Fallback to cookie if Bearer header is missing
  const cookieHeader = req.headers.get('cookie') || '';
  if (cookieHeader) {
    const match = cookieHeader.match(/sb-[a-zA-Z0-9_-]+-auth-token=([^;]+)/);
    if (match) {
      try {
        const decoded = decodeURIComponent(match[1]);
        if (decoded.startsWith('base64-')) {
          const jsonStr = Buffer.from(decoded.substring(7), 'base64').toString('utf8');
          const parsed = JSON.parse(jsonStr);
          if (parsed && (parsed.access_token || parsed[0])) {
            return parsed.access_token || parsed[0];
          }
        } else {
          const parsed = JSON.parse(decoded);
          if (parsed && (parsed.access_token || parsed[0])) {
            return parsed.access_token || parsed[0];
          }
        }
      } catch {
        // ignore cookie parse error
      }
    }
  }

  return '';
}
