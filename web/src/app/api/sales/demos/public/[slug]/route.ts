import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase/server';
import { getPublicFunnelResolution } from '@/services/publicFunnelResolver';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    if (!slug) {
      return NextResponse.json({ success: false, error: 'Slug required' }, { status: 400 });
    }

    const resolution = await getPublicFunnelResolution(slug);
    const demo = resolution.demo;

    if (!demo || !resolution.business) {
      return NextResponse.json({ success: false, error: 'Demo not found' }, { status: 404 });
    }

    if (demo.status === 'revoked') {
      return NextResponse.json({ success: false, error: 'This demo preview has been revoked' }, { status: 410 });
    }

    if (!['active', 'shared', 'converted'].includes(demo.status)) {
      return NextResponse.json({ success: false, error: 'Demo not found' }, { status: 404 });
    }

    if (resolution.isLocked) {
      return NextResponse.json({ success: false, error: 'This demo preview has expired' }, { status: 410 });
    }

    // Increment view count asynchronously
    const supabase = getSupabaseAdminClient();
    // sales_demos is not present in the generated application Database type.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from('sales_demos')
      .update({ view_count: (demo.view_count || 0) + 1 })
      .eq('id', demo.id)
      .then(() => {})
      .catch(() => {});

    // Return strictly public-safe information. Contact details are copied from
    // the salesperson's bounded demo config; never expose the full prospect.
    const publicConfig = demo.config && typeof demo.config === 'object' ? demo.config as Record<string, unknown> : {};
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
         address: typeof publicConfig.address === 'string' ? publicConfig.address : null,
         city: typeof publicConfig.city === 'string' ? publicConfig.city : null,
         phone: typeof publicConfig.phone === 'string' ? publicConfig.phone : null,
         templateSlug: demo.template_slug || 'classic',
         config: publicConfig,
      },
    });
  } catch (err: unknown) {
    console.error('Public demo resolution failed:', err);
    return NextResponse.json({ success: false, error: 'Demo is temporarily unavailable' }, { status: 503 });
  }
}
