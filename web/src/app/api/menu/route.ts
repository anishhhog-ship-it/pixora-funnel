import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase/server';
import { MenuItem } from '@/types';

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

  // Look up by slug
  const { data: bizBySlug } = await supabase
    .from('businesses')
    .select('id')
    .eq('slug', rawIdOrSlug)
    .maybeSingle();

  if (bizBySlug?.id) return bizBySlug.id;

  // Fallback to first business
  const { data: fallbackBiz } = await supabase.from('businesses').select('id').limit(1).maybeSingle();
  return fallbackBiz?.id || null;
}

async function ensureActiveMenu(supabase: any, businessId: string) {
  const { data: existingMenu } = await supabase
    .from('menus')
    .select('*')
    .eq('business_id', businessId)
    .eq('status', 'active')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (existingMenu) {
    return existingMenu;
  }

  // Create default active menu
  const { data: newMenu, error } = await supabase
    .from('menus')
    .insert({
      business_id: businessId,
      name: 'Main Menu',
      description: 'Default catalogue menu',
      status: 'active',
    })
    .select()
    .single();

  if (error || !newMenu) {
    console.error('Failed to create default menu:', error);
    throw new Error('Could not create business menu');
  }

  return newMenu;
}

async function resolveCategoryId(
  supabase: any,
  menuId: string,
  categoryId?: string | null,
  categoryName?: string | null
): Promise<string | null> {
  if (!categoryId || categoryId === 'cat_all' || categoryId === 'all') {
    return null;
  }

  if (UUID_REGEX.test(categoryId)) {
    // Verify it exists
    const { data: existing } = await supabase
      .from('menu_categories')
      .select('id')
      .eq('id', categoryId)
      .maybeSingle();
    if (existing) return existing.id;
  }

  // If categoryId is a friendly name or custom slug (e.g. 'cat_general', 'Starters', etc.)
  const cleanName = categoryName || categoryId.replace(/^cat_/, '').replace(/_/g, ' ');
  const capitalized = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);

  const { data: foundByName } = await supabase
    .from('menu_categories')
    .select('id')
    .eq('menu_id', menuId)
    .ilike('name', capitalized)
    .maybeSingle();

  if (foundByName) {
    return foundByName.id;
  }

  // Create the category if not found
  const { data: createdCat } = await supabase
    .from('menu_categories')
    .insert({
      menu_id: menuId,
      name: capitalized,
      sort_order: 0,
      active: true,
    })
    .select('id')
    .single();

  return createdCat?.id || null;
}

function mapRowToMenuItem(row: any, businessId: string): MenuItem {
  return {
    itemId: row.id,
    businessId,
    categoryId: row.category_id || 'cat_all',
    name: row.name,
    description: row.description || '',
    price: Number(row.price) || 0,
    image: row.image_url || '',
    isBestseller: Boolean(row.bestseller),
    isVegetarian: true,
    isLive: row.active !== false,
  };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const businessIdOrSlug = searchParams.get('businessId') || searchParams.get('slug') || searchParams.get('id');

    const supabaseAdmin = getSupabaseAdminClient() as any;
    const targetBusinessId = await resolveBusinessId(supabaseAdmin, businessIdOrSlug);

    if (!targetBusinessId) {
      return NextResponse.json({ success: true, items: [] });
    }

    const menu = await ensureActiveMenu(supabaseAdmin, targetBusinessId);

    const { data: rows, error } = await supabaseAdmin
      .from('menu_items')
      .select('*')
      .eq('menu_id', menu.id)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching menu items:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const items: MenuItem[] = (rows || []).map((r: any) => mapRowToMenuItem(r, targetBusinessId));

    return NextResponse.json({
      success: true,
      businessId: targetBusinessId,
      menuId: menu.id,
      items,
    });
  } catch (err: any) {
    console.error('GET /api/menu exception:', err);
    return NextResponse.json({ success: false, error: err?.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { businessId, item } = body;

    const supabaseAdmin = getSupabaseAdminClient() as any;
    const targetBusinessId = await resolveBusinessId(supabaseAdmin, businessId || item?.businessId);

    if (!targetBusinessId) {
      return NextResponse.json({ success: false, error: 'Valid business ID required' }, { status: 400 });
    }

    if (!item?.name || !item.name.trim()) {
      return NextResponse.json({ success: false, error: 'Item name is required' }, { status: 400 });
    }

    const menu = await ensureActiveMenu(supabaseAdmin, targetBusinessId);
    const validCategoryId = await resolveCategoryId(supabaseAdmin, menu.id, item.categoryId, item.categoryName);

    const { data: inserted, error } = await supabaseAdmin
      .from('menu_items')
      .insert({
        menu_id: menu.id,
        category_id: validCategoryId,
        name: item.name.trim(),
        description: item.description?.trim() || '',
        price: Number(item.price) || 0,
        image_url: item.image || null,
        active: item.isLive !== false,
        bestseller: Boolean(item.isBestseller),
        sort_order: 0,
      })
      .select()
      .single();

    if (error) {
      console.error('Error inserting menu item:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const createdItem = mapRowToMenuItem(inserted, targetBusinessId);

    return NextResponse.json({
      success: true,
      item: createdItem,
    });
  } catch (err: any) {
    console.error('POST /api/menu exception:', err);
    return NextResponse.json({ success: false, error: err?.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { itemId, businessId, item } = body;

    const targetItemId = itemId || item?.itemId;
    if (!targetItemId) {
      return NextResponse.json({ success: false, error: 'Item ID is required' }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdminClient() as any;
    const targetBusinessId = await resolveBusinessId(supabaseAdmin, businessId || item?.businessId);

    let validCategoryId: string | null = null;
    if (targetBusinessId && (item.categoryId || item.categoryName)) {
      const menu = await ensureActiveMenu(supabaseAdmin, targetBusinessId);
      validCategoryId = await resolveCategoryId(supabaseAdmin, menu.id, item.categoryId, item.categoryName);
    }

    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (item.name !== undefined) updatePayload.name = item.name.trim();
    if (item.description !== undefined) updatePayload.description = item.description.trim();
    if (item.price !== undefined) updatePayload.price = Number(item.price) || 0;
    if (item.image !== undefined) updatePayload.image_url = item.image;
    if (item.isLive !== undefined) updatePayload.active = Boolean(item.isLive);
    if (item.isBestseller !== undefined) updatePayload.bestseller = Boolean(item.isBestseller);
    if (validCategoryId !== null) updatePayload.category_id = validCategoryId;

    // Check if itemId is a valid UUID
    if (UUID_REGEX.test(targetItemId)) {
      const { data: updated, error } = await supabaseAdmin
        .from('menu_items')
        .update(updatePayload)
        .eq('id', targetItemId)
        .select()
        .single();

      if (error) {
        console.error('Error updating menu item:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        item: mapRowToMenuItem(updated, targetBusinessId || ''),
      });
    } else {
      // Non-UUID mock / local item: if it doesn't exist in Supabase yet, insert it!
      const menu = await ensureActiveMenu(supabaseAdmin, targetBusinessId!);
      const { data: inserted, error } = await supabaseAdmin
        .from('menu_items')
        .insert({
          menu_id: menu.id,
          category_id: validCategoryId,
          name: item.name?.trim() || 'Catalogue Item',
          description: item.description?.trim() || '',
          price: Number(item.price) || 0,
          image_url: item.image || null,
          active: item.isLive !== false,
          bestseller: Boolean(item.isBestseller),
          sort_order: 0,
        })
        .select()
        .single();

      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        item: mapRowToMenuItem(inserted, targetBusinessId || ''),
      });
    }
  } catch (err: any) {
    console.error('PUT /api/menu exception:', err);
    return NextResponse.json({ success: false, error: err?.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    let itemId = searchParams.get('itemId') || searchParams.get('id');

    if (!itemId) {
      try {
        const body = await req.json();
        itemId = body?.itemId;
      } catch {}
    }

    if (!itemId) {
      return NextResponse.json({ success: false, error: 'Item ID required' }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdminClient() as any;
    if (UUID_REGEX.test(itemId)) {
      const { error } = await supabaseAdmin
        .from('menu_items')
        .delete()
        .eq('id', itemId);

      if (error) {
        console.error('Error deleting menu item:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true, deletedId: itemId });
  } catch (err: any) {
    console.error('DELETE /api/menu exception:', err);
    return NextResponse.json({ success: false, error: err?.message || 'Internal server error' }, { status: 500 });
  }
}
