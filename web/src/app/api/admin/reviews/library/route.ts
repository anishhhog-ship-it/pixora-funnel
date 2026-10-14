import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase/server';
import { verifyAdminAccess } from '@/services/adminService';
import { MASSIVE_CATEGORY_REVIEWS } from '@/data/categoryReviews';

export const dynamic = 'force-dynamic';

function parseSqlInserts(sql: string): Array<{ category: string; fragment_type: string; content: string }> {
  const results: Array<{ category: string; fragment_type: string; content: string }> = [];
  
  // Match single or multi-row insert statements:
  // e.g. VALUES ('Clothes Stores', 'body', 'Great store!'), ('Perfume Stores', 'body', 'Long lasting!')
  const valueRegex = /\(\s*'([^']+)'\s*,\s*'([^']+)'\s*,\s*'((?:''|[^'])*)'\s*\)/g;
  let match;
  while ((match = valueRegex.exec(sql)) !== null) {
    const category = match[1].trim();
    const fragment_type = match[2].trim() || 'body';
    const content = match[3].replace(/''/g, "'").trim();
    if (category && content) {
      results.push({ category, fragment_type, content });
    }
  }

  return results;
}

function parseTextLines(text: string, defaultCategory: string = 'General Business'): Array<{ category: string; fragment_type: string; content: string }> {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const results: Array<{ category: string; fragment_type: string; content: string }> = [];

  for (const line of lines) {
    if (line.startsWith('#') || line.startsWith('--')) continue; // Skip comment lines
    
    // Check if line contains category delimiter: e.g. "Clothes Stores | Beautiful fabric quality" or "Perfumes :: Long lasting"
    if (line.includes('|') || line.includes('::')) {
      const parts = line.includes('|') ? line.split('|') : line.split('::');
      const cat = parts[0].trim();
      const review = parts.slice(1).join(' ').trim();
      if (cat && review) {
        results.push({ category: cat, fragment_type: 'body', content: review });
        continue;
      }
    }

    // Default category fallback
    if (line.length > 5) {
      results.push({ category: defaultCategory, fragment_type: 'body', content: line });
    }
  }

  return results;
}

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '');
    const session = await verifyAdminAccess(token);
    if (!session.isAdmin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseAdminClient();
    const { data: dbTemplates, error } = await (supabase as any)
      .from('review_category_templates')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching review templates:', error);
    }

    // Compute built-in library stats
    let totalBuiltInReviews = 0;
    const categoryStats: Record<string, number> = {};

    for (const key of Object.keys(MASSIVE_CATEGORY_REVIEWS)) {
      const cat = MASSIVE_CATEGORY_REVIEWS[key];
      totalBuiltInReviews += cat.reviews.length;
      categoryStats[cat.category] = (categoryStats[cat.category] || 0) + cat.reviews.length;
    }

    // Count database custom templates per category
    const templates = dbTemplates || [];
    for (const t of templates) {
      categoryStats[t.category] = (categoryStats[t.category] || 0) + 1;
    }

    return NextResponse.json({
      success: true,
      stats: {
        totalBuiltInReviews,
        totalCustomTemplates: templates.length,
        totalLibraryItems: totalBuiltInReviews + templates.length,
        categoriesCount: Object.keys(categoryStats).length,
      },
      categoryStats,
      customTemplates: templates,
    });
  } catch (err: any) {
    console.error('API /admin/reviews/library GET error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '');
    const session = await verifyAdminAccess(token);
    if (!session.isAdmin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { mode = 'text', content = '', category = 'Clothes Stores' } = body;

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json({ success: false, error: 'Content cannot be empty' }, { status: 400 });
    }

    let parsedItems: Array<{ category: string; fragment_type: string; content: string }> = [];

    if (mode === 'sql') {
      parsedItems = parseSqlInserts(content);
      if (parsedItems.length === 0) {
        return NextResponse.json({
          success: false,
          error: 'No valid INSERT INTO ... VALUES (...) tuples were detected in the SQL text.',
        }, { status: 400 });
      }
    } else {
      // Text mode
      parsedItems = parseTextLines(content, category);
      if (parsedItems.length === 0) {
        return NextResponse.json({
          success: false,
          error: 'No valid review lines found. Provide at least one review with 5+ characters.',
        }, { status: 400 });
      }
    }

    const supabase = getSupabaseAdminClient();
    const { data: inserted, error } = await (supabase as any)
      .from('review_category_templates')
      .insert(parsedItems)
      .select('id, category, content');

    if (error) {
      console.error('Error inserting review templates into Supabase:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const uniqueCats = Array.from(new Set(parsedItems.map(p => p.category)));

    return NextResponse.json({
      success: true,
      message: `Successfully uploaded ${inserted?.length || parsedItems.length} reviews across ${uniqueCats.length} category/categories.`,
      count: inserted?.length || parsedItems.length,
      categories: uniqueCats,
    });
  } catch (err: any) {
    console.error('API /admin/reviews/library POST error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '');
    const session = await verifyAdminAccess(token);
    if (!session.isAdmin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const category = searchParams.get('category');

    const supabase = getSupabaseAdminClient();

    if (id) {
      const { error } = await (supabase as any)
        .from('review_category_templates')
        .delete()
        .eq('id', id);
      if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, message: 'Review deleted successfully' });
    }

    if (category) {
      const { error } = await (supabase as any)
        .from('review_category_templates')
        .delete()
        .eq('category', category);
      if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, message: `All reviews for ${category} deleted` });
    }

    return NextResponse.json({ success: false, error: 'Missing id or category parameter' }, { status: 400 });
  } catch (err: any) {
    console.error('API /admin/reviews/library DELETE error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
