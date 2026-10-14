import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get('slug') || searchParams.get('businessSlug') || 'business';

  let businessName = 'Digital Menu';
  let themeColor = '#0B3D2E';
  let logoUrl = '/icon-192.png';

  try {
    const supabaseAdmin = getSupabaseAdminClient() as any;
    const { data: biz } = await supabaseAdmin
      .from('businesses')
      .select('name, theme, logo')
      .eq('slug', slug)
      .maybeSingle();

    if (biz) {
      businessName = (biz as any).name || businessName;
      themeColor = (biz as any).theme?.primaryColor || themeColor;
      logoUrl = (biz as any).theme?.logo || (biz as any).logo || logoUrl;
    }
  } catch (err) {
    // Fallback defaults
  }

  const manifest = {
    name: `${businessName} — Menu & App`,
    short_name: businessName.length > 12 ? businessName.slice(0, 12) : businessName,
    description: `Official digital menu and catalogue for ${businessName}. Tap to browse items and specials.`,
    start_url: `/f/${slug}/menu?source=homescreen`,
    scope: `/f/${slug}`,
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: '#FDFBF7',
    theme_color: themeColor,
    icons: [
      {
        src: logoUrl.startsWith('http') ? logoUrl : '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: logoUrl.startsWith('http') ? logoUrl : '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable',
      },
    ],
  };

  return NextResponse.json(manifest, {
    headers: {
      'Content-Type': 'application/manifest+json',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
