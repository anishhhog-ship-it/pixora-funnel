import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase/server';
import { verifySalesStaffAccess, extractAuthToken } from '@/services/salesAuthService';
import { databaseFailure } from '@/services/salesServer';

export async function GET(req: NextRequest) {
  try {
    const token = extractAuthToken(req);
    const session = await verifySalesStaffAccess(token);

    if (!session.isAuthenticated || (session.role !== 'admin' && session.role !== 'sales_manager')) {
      return NextResponse.json({ success: false, error: 'Unauthorized staff access' }, { status: 403 });
    }

    const supabase = getSupabaseAdminClient();
    let query = (supabase as any)
      .from('sales_staff')
      .select('id, auth_user_id, full_name, email, phone, role, manager_id, status, notes, created_at, last_active_at')
      .order('created_at', { ascending: false });

    // If manager, only show their direct reports or themselves
    if (session.role === 'sales_manager' && !session.isSuperAdmin) {
      query = query.or(`manager_id.eq.${session.staffId},id.eq.${session.staffId}`);
    }

    const { data: staffList, error } = await query;
    if (error) {
      console.warn('Error fetching sales staff:', error);
      return databaseFailure();
    }

    return NextResponse.json({ success: true, staff: staffList || [] });
  } catch {
    return databaseFailure();
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = extractAuthToken(req);
    const session = await verifySalesStaffAccess(token);

    if (!session.isAuthenticated || session.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Only administrators can create salesperson accounts' }, { status: 403 });
    }

    const body = await req.json();
    const { fullName, email, phone, role = 'salesperson', managerId, notes, temporaryPassword } = body;

    if (!fullName || !email) {
      return NextResponse.json({ success: false, error: 'Full name and email are required' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const supabase = getSupabaseAdminClient();

    // Check if staff already exists with this email
    const { data: existingStaff } = await (supabase as any)
      .from('sales_staff')
      .select('id, email, status')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (existingStaff) {
      return NextResponse.json({
        success: false,
        error: `A team member with email ${normalizedEmail} already exists (Status: ${existingStaff.status}).`,
      }, { status: 400 });
    }

    // Create real Supabase Auth Identity
    let authUserId: string | null = null;
    let inviteSent = false;

    if (temporaryPassword && temporaryPassword.length >= 6) {
      // Create account directly with password
      const { data: createdAuth, error: authErr } = await supabase.auth.admin.createUser({
        email: normalizedEmail,
        password: temporaryPassword,
        email_confirm: true,
        user_metadata: { full_name: fullName, role: role },
      });

      if (authErr) {
        // If user already registered in Supabase auth, link to existing auth id
        if (authErr.message?.toLowerCase().includes('already')) {
          const { data: listData } = await supabase.auth.admin.listUsers();
          const matched = listData.users.find(u => u.email?.toLowerCase() === normalizedEmail);
          if (matched) authUserId = matched.id;
        } else {
          return NextResponse.json({ success: false, error: `Auth account creation failed: ${authErr.message}` }, { status: 400 });
        }
      } else {
        authUserId = createdAuth.user.id;
      }
    } else {
      // Send secure invitation email
      const { data: inviteData, error: inviteErr } = await supabase.auth.admin.inviteUserByEmail(normalizedEmail, {
        data: { full_name: fullName, role: role },
      });

      if (inviteErr) {
        // If user already exists in auth, find their id
        const { data: listData } = await supabase.auth.admin.listUsers();
        const matched = listData.users.find(u => u.email?.toLowerCase() === normalizedEmail);
        if (matched) {
          authUserId = matched.id;
        } else {
          return NextResponse.json({ success: false, error: `Auth invitation failed: ${inviteErr.message}` }, { status: 400 });
        }
      } else {
        authUserId = inviteData.user.id;
        inviteSent = true;
      }
    }

    // Insert staff record
    const { data: newStaff, error: insertErr } = await (supabase as any)
      .from('sales_staff')
      .insert({
        auth_user_id: authUserId,
        full_name: fullName,
        email: normalizedEmail,
        phone: phone || null,
        role: role,
        manager_id: managerId || null,
        status: inviteSent ? 'invited' : 'active',
        notes: notes || null,
      })
      .select()
      .single();

    if (insertErr) {
      return NextResponse.json({ success: false, error: `Failed to insert staff profile: ${insertErr.message}` }, { status: 500 });
    }

    // Record audit log
    await (supabase as any)
      .from('sales_audit_logs')
      .insert({
        staff_id: session.staffId,
        staff_email: session.email,
        action: 'CREATE_SALESPERSON',
        target_type: 'sales_staff',
        target_id: newStaff.id,
        details: { email: normalizedEmail, role, inviteSent },
      });

    return NextResponse.json({
      success: true,
      message: inviteSent 
        ? `✓ Invitation email sent to ${normalizedEmail}! Salesperson profile created.` 
        : `✓ Account created successfully for ${fullName} (${normalizedEmail})!`,
      staff: newStaff,
    });
  } catch {
    return databaseFailure();
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const token = extractAuthToken(req);
    const session = await verifySalesStaffAccess(token);

    if (!session.isAuthenticated || session.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized to update staff members' }, { status: 403 });
    }

    const { staffId, status, role, notes, phone } = await req.json();
    if (!staffId) {
      return NextResponse.json({ success: false, error: 'Staff ID is required' }, { status: 400 });
    }
    if (role && !['salesperson', 'sales_manager', 'admin'].includes(role)) {
      return NextResponse.json({ success: false, error: 'Invalid sales role' }, { status: 400 });
    }
    if (staffId === session.staffId && role && role !== 'admin') {
      return NextResponse.json({ success: false, error: 'An administrator cannot demote their own account' }, { status: 409 });
    }

    const supabase = getSupabaseAdminClient();
    const updatePayload: Record<string, any> = { updated_at: new Date().toISOString() };
    if (status) updatePayload.status = status;
    if (role) updatePayload.role = role;
    if (notes !== undefined) updatePayload.notes = notes;
    if (phone !== undefined) updatePayload.phone = phone;

    const { data: updatedStaff, error } = await (supabase as any)
      .from('sales_staff')
      .update(updatePayload)
      .eq('id', staffId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // Record audit log
    await (supabase as any)
      .from('sales_audit_logs')
      .insert({
        staff_id: session.staffId,
        staff_email: session.email,
        action: status === 'deactivated' ? 'DEACTIVATE_STAFF' : 'UPDATE_STAFF',
        target_type: 'sales_staff',
        target_id: staffId,
        details: updatePayload,
      });

    return NextResponse.json({
      success: true,
      message: `Staff member updated successfully (${status || 'updated'}).`,
      staff: updatedStaff,
    });
  } catch {
    return databaseFailure();
  }
}
