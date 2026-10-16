import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase/server';
import { databaseFailure } from '@/services/salesServer';
import { verifySalesStaffAccess, extractAuthToken } from '@/services/salesAuthService';

export async function GET(req: NextRequest) {
  try {
    const token = extractAuthToken(req);
    const session = await verifySalesStaffAccess(token);

    if (!session.isAuthenticated) {
      return NextResponse.json({ success: false, error: 'Unauthorized sales access' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const stage = searchParams.get('stage');
    const assignedTo = searchParams.get('assignedTo');
    const search = searchParams.get('search');

    const supabase = getSupabaseAdminClient();
    let query = (supabase as any)
      .from('prospects')
      .select('*, assigned_staff:assigned_to(id, full_name, email, role)')
      .order('created_at', { ascending: false });

    // Strict role-based isolation:
    // Salesperson can only view their own assigned prospects
    if (session.role === 'salesperson') {
      query = query.eq('assigned_to', session.staffId);
    } else if (assignedTo) {
      query = query.eq('assigned_to', assignedTo);
    }

    if (stage) {
      query = query.eq('stage', stage);
    }

    if (search) {
      query = query.or(`business_name.ilike.%${search}%,contact_name.ilike.%${search}%,phone.ilike.%${search}%,city.ilike.%${search}%`);
    }

    const { data: prospects, error } = await query;
    if (error) {
      console.warn('Error fetching prospects:', error);
      return databaseFailure();
    }

    return NextResponse.json({ success: true, prospects: prospects || [] });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = extractAuthToken(req);
    const session = await verifySalesStaffAccess(token);

    if (!session.isAuthenticated) {
      return NextResponse.json({ success: false, error: 'Unauthorized sales access' }, { status: 401 });
    }

    const body = await req.json();
    const {
      businessName,
      contactName,
      phone,
      email,
      category = 'General Business',
      city,
      address,
      website,
      googleMapsUrl,
      leadSource = 'Field Sales',
      notes,
      assignedTo,
      nextFollowupDate,
      ignoreDuplicateWarning = false,
    } = body;

    if (!businessName || !businessName.trim()) {
      return NextResponse.json({ success: false, error: 'Business name is required' }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();

    // 1. Duplicate detection check
    if (!ignoreDuplicateWarning) {
      let duplicateQuery = (supabase as any).from('prospects').select('id, business_name, phone, stage');
      const conditions: string[] = [];

      if (phone && phone.trim()) {
        conditions.push(`phone.eq.${phone.trim()}`);
      }
      if (email && email.trim()) {
        conditions.push(`email.ilike.${email.trim()}`);
      }
      conditions.push(`business_name.ilike.${businessName.trim()}`);

      duplicateQuery = duplicateQuery.or(conditions.join(','));
      const duplicateResult = await duplicateQuery.limit(1);
      if (duplicateResult.error) return databaseFailure();
      const matches = duplicateResult.data;

      if (matches && matches.length > 0) {
        return NextResponse.json({
          success: false,
          warning: 'DUPLICATE_POSSIBLE',
          message: `A lead named "${matches[0].business_name}" already exists in stage "${matches[0].stage}". Pass ignoreDuplicateWarning=true to confirm creation.`,
          existingLead: matches[0],
        }, { status: 409 });
      }
    }

    // Determine assignee: Salesperson cannot assign to someone else; Admins can assign
    const targetAssignee = (session.role === 'admin' || session.role === 'sales_manager') && assignedTo
      ? assignedTo
      : session.staffId;

    const { data: newProspect, error: insertErr } = await (supabase as any)
      .from('prospects')
      .insert({
        business_name: businessName.trim(),
        contact_name: contactName || null,
        phone: phone || null,
        email: email || null,
        category: category || 'General Business',
        city: city || null,
        address: address || null,
        website: website || null,
        google_maps_url: googleMapsUrl || null,
        lead_source: leadSource,
        assigned_to: targetAssignee,
        stage: 'New Lead',
        notes: notes || null,
        next_followup_date: nextFollowupDate || null,
      })
      .select('*, assigned_staff:assigned_to(id, full_name, email, role)')
      .single();

    if (insertErr) {
      return NextResponse.json({ success: false, error: insertErr.message }, { status: 500 });
    }

    // Insert activity log
    const activityResult = await (supabase as any).from('sales_activities').insert({
      prospect_id: newProspect.id,
      staff_id: session.staffId,
      type: 'note',
      title: 'Lead Created',
      description: `Prospect added from source: ${leadSource}. Initial notes: ${notes || 'None'}`,
    });

    if (activityResult.error) return databaseFailure();
    return NextResponse.json({
      success: true,
      message: `✓ Lead "${businessName}" created successfully!`,
      prospect: newProspect,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const token = extractAuthToken(req);
    const session = await verifySalesStaffAccess(token);

    if (!session.isAuthenticated) {
      return NextResponse.json({ success: false, error: 'Unauthorized sales access' }, { status: 401 });
    }

    const body = await req.json();
    const { id, stage, notes, nextFollowupDate, contactName, phone, city, address, assignedTo, activityNote } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Prospect ID is required' }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();

    // Verify access
    const { data: existing, error: checkErr } = await (supabase as any)
      .from('prospects')
      .select('*')
      .eq('id', id)
      .single();

    if (checkErr || !existing) {
      return NextResponse.json({ success: false, error: 'Prospect not found' }, { status: 404 });
    }

    if (session.role === 'salesperson' && existing.assigned_to !== session.staffId) {
      return NextResponse.json({ success: false, error: 'Cannot modify unassigned prospect' }, { status: 403 });
    }

    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
      last_contact_date: new Date().toISOString(),
    };

    if (stage) updatePayload.stage = stage;
    if (notes !== undefined) updatePayload.notes = notes;
    if (nextFollowupDate !== undefined) updatePayload.next_followup_date = nextFollowupDate;
    if (contactName !== undefined) updatePayload.contact_name = contactName;
    if (phone !== undefined) updatePayload.phone = phone;
    if (city !== undefined) updatePayload.city = city;
    if (address !== undefined) updatePayload.address = address;
    if (assignedTo && (session.role === 'admin' || session.role === 'sales_manager')) {
      updatePayload.assigned_to = assignedTo;
    }

    const { data: updated, error: updateErr } = await (supabase as any)
      .from('prospects')
      .update(updatePayload)
      .eq('id', id)
      .select('*, assigned_staff:assigned_to(id, full_name, email, role)')
      .single();

    if (updateErr) {
      return NextResponse.json({ success: false, error: updateErr.message }, { status: 500 });
    }

    // Record activity
    if (stage && stage !== existing.stage) {
      await (supabase as any).from('sales_activities').insert({
        prospect_id: id,
        staff_id: session.staffId,
        type: 'stage_change',
        title: `Stage Changed to ${stage}`,
        description: activityNote || `Updated from ${existing.stage} to ${stage}`,
      });
    } else if (activityNote) {
      await (supabase as any).from('sales_activities').insert({
        prospect_id: id,
        staff_id: session.staffId,
        type: 'note',
        title: 'Note Added',
        description: activityNote,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Prospect updated successfully',
      prospect: updated,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
