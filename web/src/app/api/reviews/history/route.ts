import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase/server';

// Server-level in-memory cache to guarantee zero downtime even when Supabase is initializing
declare global {
  var __pixoraUsedReviews: Map<string, Set<string>> | undefined;
}

if (!global.__pixoraUsedReviews) {
  global.__pixoraUsedReviews = new Map();
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('businessId') || searchParams.get('slug') || 'default';

    const memorySet = global.__pixoraUsedReviews!.get(businessId) || new Set<string>();
    const usedHashes = new Set<string>(memorySet);

    // Attempt to fetch from Supabase
    try {
      const supabase = getSupabaseAdminClient();
      const { data, error } = await (supabase as any)
        .from('business_used_reviews')
        .select('review_hash')
        .eq('business_id', businessId)
        .limit(1000);

      if (!error && data) {
        data.forEach((row: { review_hash: string }) => {
          if (row.review_hash) {
            usedHashes.add(row.review_hash);
            memorySet.add(row.review_hash);
          }
        });
        global.__pixoraUsedReviews!.set(businessId, memorySet);
      }
    } catch (dbErr) {
      // Graceful fallback to memorySet
    }

    return NextResponse.json({
      success: true,
      businessId,
      usedHashes: Array.from(usedHashes),
      totalUsed: usedHashes.size,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to fetch review history' },
      { status: 500 }
    );
  }
}
