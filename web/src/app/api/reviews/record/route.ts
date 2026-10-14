import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase/server';

declare global {
  var __pixoraUsedReviews: Map<string, Set<string>> | undefined;
}

if (!global.__pixoraUsedReviews) {
  global.__pixoraUsedReviews = new Map();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { businessId, reviewHash, reviewText, category = 'general' } = body;

    if (!businessId || !reviewHash) {
      return NextResponse.json(
        { success: false, error: 'businessId and reviewHash are required' },
        { status: 400 }
      );
    }

    // 1. Update memory set
    if (!global.__pixoraUsedReviews!.has(businessId)) {
      global.__pixoraUsedReviews!.set(businessId, new Set());
    }
    global.__pixoraUsedReviews!.get(businessId)!.add(reviewHash);

    // 2. Persist to Supabase
    try {
      const supabase = getSupabaseAdminClient();
      await (supabase as any).from('business_used_reviews').insert({
        business_id: businessId,
        review_hash: reviewHash,
        review_text: reviewText || '',
        category,
        source: 'ai_engine',
      });
    } catch (dbErr) {
      // In-memory fallback logged
    }

    return NextResponse.json({
      success: true,
      businessId,
      reviewHash,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to record used review' },
      { status: 500 }
    );
  }
}
