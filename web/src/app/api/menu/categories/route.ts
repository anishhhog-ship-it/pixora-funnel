import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase/server';
import { MenuCategory } from '@/types';

export const dynamic = 'force-dynamic';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function resolveBusinessId(supabase: any, rawIdOrSlug?: string | null): Promise<string | null> {
  if (!rawIdOrSlug) {
    const { data: firstBiz } = await supabase.from('businesses').select('id').limit(1).maybeSingle();
    return firstBiz?.id || null;
  }

  if (UUID_REGEX.test(rawIdOrSlug)) {
    return rawIdOrSlug;
  }

  const { data: bizBySlug } = await supabase
    .from('businesses')
    .select('id')
    .eq('slug', rawIdOrSlug)
    .maybeSingle();

  if (bizBySlug?.id) return bizBySlug.id;

  const { data: fallbackBiz } = await supabase.from('businesses').select('id').limit(1).maybeSingle();
  return fallbackBiz?.id || null;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const businessIdOrSlug = searchParams.get('businessId') || searchParams.get('slug') || searchParams.get('id');

    const supabaseAdmin = getSupabaseAdminClient() as any;
    const targetBusinessId = await resolveBusinessId(supabaseAdmin, businessIdOrSlug);

    if (!targetBusinessId) {
      return NextResponse.json({
        success: true,
        categories: [{ categoryId: 'cat_all', businessId: 'all', name: 'All', order: 0 }],
      });
    }

    const { data: menu } = await supabaseAdmin
      .from('menus')
      .select('id')
      .eq('business_id', targetBusinessId)
      .eq('status', 'active')
      .maybeSingle();

    if (!menu) {
      return NextResponse.json({
        success: true,
        categories: [{ categoryId: 'cat_all', businessId: targetBusinessId, name: 'All', order: 0 }],
      });
    }

    const { data: rows, error } = await supabaseAdmin
      .from('menu_categories')
      .select('*')
      .eq('menu_id', menu.id)
      .eq('active', true)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const categories: MenuCategory[] = [
      { categoryId: 'cat_all', businessId: targetBusinessId, name: 'All', order: 0 },
      ...(rows || []).map((r: any) => ({
        categoryId: r.id,
        businessId: targetBusinessId,
        name: r.name,
        order: r.sort_order || 0,
      })),
    ];

    return NextResponse.json({
      success: true,
      categories,
    });
  } catch (err: any) {
    console.error('GET /api/menu/categories exception:', err);
    return NextResponse.json({ success: false, error: err?.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { businessId, name, description } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, error: 'Category name is required' }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdminClient() as any;
    const targetBusinessId = await resolveBusinessId(supabaseAdmin, businessId);

    if (!targetBusinessId) {
      return NextResponse.json({ success: false, error: 'Valid business ID required' }, { status: 400 });
    }

    // Ensure menu
    let { data: menu } = await supabaseAdmin
      .from('menus')
      .select('id')
      .eq('business_id', targetBusinessId)
      .eq('status', 'active')
      .maybeSingle();

    if (!menu) {
      const { data: newMenu } = await supabaseAdmin
        .from('menus')
        .insert({
          business_id: targetBusinessId,
          name: 'Main Menu',
          status: 'active',
        })
        .select('id')
        .single();
      menu = newMenu;
    }

    if (!menu?.id) {
      return NextResponse.json({ success: false, error: 'Could not resolve menu' }, { status: 500 });
    }

    const { data: created, error } = await supabaseAdmin
      .from('menu_categories')
      .insert({
        menu_id: menu.id,
        name: name.trim(),
        description: description?.trim() || null,
        active: true,
        sort_order: 0,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const createdRecord = created as any;
    const category: MenuCategory = {
      categoryId: createdRecord.id,
      businessId: targetBusinessId,
      name: createdRecord.name,
      order: createdRecord.sort_order || 0,
    };

    return NextResponse.json({
      success: true,
      category,
    });
  } catch (err: any) {
    console.error('POST /api/menu/categories exception:', err);
    return NextResponse.json({ success: false, error: err?.message || 'Internal server error' }, { status: 500 });
  }
}
