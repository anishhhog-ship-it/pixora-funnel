import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase/server';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    if (!slug) {
      return NextResponse.json({ success: false, error: 'Slug required' }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();
    const { data: demo, error } = await (supabase as any)
      .from('sales_demos')
      .select('id, slug, business_name, category, review_destination_url, primary_color, logo_url, cover_url, template_slug, config, status, expires_at')
      .eq('slug', slug)
      .in('status', ['active', 'shared'])
      .single();

    if (error || !demo) {
      return NextResponse.json({ success: false, error: 'Demo not found' }, { status: 404 });
    }

    if (demo.status === 'revoked') {
      return NextResponse.json({ success: false, error: 'This demo preview has been revoked' }, { status: 410 });
    }

    if (demo.expires_at && new Date(demo.expires_at).getTime() < Date.now()) {
      return NextResponse.json({ success: false, error: 'This demo preview has expired' }, { status: 410 });
    }

    // Increment view count asynchronously
    (supabase as any)
      .from('sales_demos')
      .update({ view_count: (demo.view_count || 0) + 1 })
      .eq('id', demo.id)
      .then(() => {})
      .catch(() => {});

    // Return strictly public-safe information
    return NextResponse.json({
      success: true,
      demo: {
        slug: demo.slug,
        businessName: demo.business_name,
        category: demo.category,
        reviewDestinationUrl: demo.review_destination_url,
        primaryColor: demo.primary_color || '#2563EB',
        logoUrl: demo.logo_url,
        coverUrl: demo.cover_url,
        templateSlug: demo.template_slug || 'classic',
        config: demo.config || {},
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
