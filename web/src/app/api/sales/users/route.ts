import { NextRequest, NextResponse } from 'next/server';
import { requireSalesSession, salesDb, databaseFailure, boundedText, isUuid } from '@/services/salesServer';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://funnel.pixoraautomations.com';

/**
 * POST /api/sales/users
 * Enables sales staff to generate or reset a client user account with email & password,
 * and link the account to the client's business tenant.
 */
export async function POST(req: NextRequest) {
  const access = await requireSalesSession(req);
  if ('response' in access) return access.response;

  try {
    const body = await req.json();
    const email = boundedText(body.email, 320)?.toLowerCase().trim();
    const password = boundedText(body.password, 120);
    const fullName = boundedText(body.fullName, 160) || 'Business Owner';
    const businessId = body.businessId;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ success: false, error: 'Valid client email address is required' }, { status: 400 });
    }

    if (!password || password.length < 6) {
      return NextResponse.json({ success: false, error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    if (businessId && !isUuid(businessId)) {
      return NextResponse.json({ success: false, error: 'Invalid business ID' }, { status: 400 });
    }

    const db = salesDb();

    // 1. Check if user already exists in auth.users
    let authUserId: string;
    const { data: userList, error: listErr } = await db.auth.admin.listUsers();
    if (listErr) {
      console.error('Failed to list auth users:', listErr);
      return databaseFailure('Unable to inspect user directory');
    }

    const existingUser = userList?.users?.find(
      (u: any) => u.email?.toLowerCase().trim() === email
    );

    if (existingUser) {
      authUserId = existingUser.id;
      // Update password for existing user
      const { error: updateErr } = await db.auth.admin.updateUserById(authUserId, {
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          role: 'business_owner',
        },
      });
      if (updateErr) {
        console.error('Failed to update client password:', updateErr);
        return databaseFailure('Failed to update user password');
      }
    } else {
      // Create new user in auth.users
      const { data: newUser, error: createErr } = await db.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          role: 'business_owner',
        },
      });

      if (createErr || !newUser.user) {
        console.error('Failed to create auth user:', createErr);
        return databaseFailure(createErr?.message || 'Failed to generate user account');
      }
      authUserId = newUser.user.id;
    }

    // 2. Ensure public.profiles has the user
    try {
      await db.from('profiles').upsert(
        {
          id: authUserId,
          email,
          full_name: fullName,
          role: 'business_owner',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );
    } catch (e) {
      console.warn('Profiles upsert warning:', e);
    }

    // 3. Link business to user if businessId is supplied or found by email
    let businessSlug = '';
    let targetBusinessId = businessId;

    if (!targetBusinessId) {
      // Auto-resolve business by matching email
      const { data: matchedBiz } = await db
        .from('businesses')
        .select('id,slug')
        .ilike('email', email)
        .order('created_at', { ascending: false })
        .maybeSingle();

      if (matchedBiz) {
        targetBusinessId = matchedBiz.id;
        businessSlug = matchedBiz.slug;
      }
    }

    if (targetBusinessId) {
      const { data: biz } = await db
        .from('businesses')
        .select('id,slug')
        .eq('id', targetBusinessId)
        .maybeSingle();

      businessSlug = biz?.slug || businessSlug;

      await db
        .from('businesses')
        .update({
          owner_id: authUserId,
          email,
          status: 'active',
          plan_status: 'active',
          trial_expires_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', targetBusinessId);

      try {
        await db.from('business_members').upsert(
          {
            business_id: targetBusinessId,
            user_id: authUserId,
            role: 'owner',
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'business_id,user_id' }
        );
      } catch (e) {
        console.warn('business_members upsert warning:', e);
      }

      // Link any orders for this business or email to this auth user
      try {
        await db
          .from('sales_orders')
          .update({ customer_id: authUserId })
          .eq('business_id', targetBusinessId);
      } catch {}
    }

    // 4. Record sales audit log
    try {
      await db.from('sales_audit_logs').insert({
        staff_id: access.session.staffId,
        staff_email: access.session.email,
        action: 'CLIENT_CREDENTIALS_GENERATED',
        target_type: 'auth_users',
        target_id: authUserId,
        details: { email, businessId, businessSlug },
      });
    } catch {}

    return NextResponse.json({
      success: true,
      message: 'Client credentials generated successfully',
      credentials: {
        email,
        password,
        loginUrl: `${APP_URL}/login`,
        authUserId,
        businessId,
        businessSlug,
      },
    });
  } catch (err: any) {
    console.error('User generation error:', err);
    return databaseFailure('Failed to generate client user account');
  }
}
