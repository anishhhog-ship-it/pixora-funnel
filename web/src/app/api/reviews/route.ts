import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase/server';
import { Review } from '@/types';

export const dynamic = 'force-dynamic';

function determineSentiment(rating: number): 'positive' | 'neutral' | 'negative' {
  if (rating >= 4) return 'positive';
  if (rating === 3) return 'neutral';
  return 'negative';
}

function mapRowToReview(r: any): Review {
  return {
    reviewId: r.google_review_id || r.id,
    businessId: r.business_id,
    reviewerName: r.reviewer_name || 'Verified Customer',
    reviewerImage: r.reviewer_photo_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop',
    rating: r.rating || 5,
    text: r.review_text || '',
    date: r.review_time || r.created_at || new Date().toISOString(),
    source: (r.google_review_id ? 'google' : 'direct') as 'google' | 'direct',
    status: 'published',
    sentiment: (r.sentiment || determineSentiment(r.rating || 5)) as 'positive' | 'neutral' | 'negative',
    replyStatus: (r.reply_status === 'replied' ? 'replied' : (r.reply_status === 'draft' ? 'draft' : 'pending')) as any,
    replyText: r.reply_text || undefined,
    tags: Array.isArray(r.topics) && r.topics.length > 0 ? r.topics : ['Customer Review'],
  };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rawBusinessId = searchParams.get('businessId') || searchParams.get('id');
    const slug = searchParams.get('slug');

    const supabaseAdmin = getSupabaseAdminClient();
    let targetBusinessId = rawBusinessId;

    // Resolve business ID if slug was passed or rawBusinessId is a slug
    if (slug || (rawBusinessId && !rawBusinessId.includes('-') && !rawBusinessId.startsWith('biz_'))) {
      const searchKey = slug || rawBusinessId;
      const { data: biz } = await (supabaseAdmin as any)
        .from('businesses')
        .select('id, slug')
        .eq('slug', searchKey)
        .maybeSingle();

      if (biz?.id) {
        targetBusinessId = biz.id;
      }
    } else if (rawBusinessId && rawBusinessId.includes('-')) {
      // Check if it's already a valid UUID
      targetBusinessId = rawBusinessId;
    }

    // If still no valid targetBusinessId, try to find active business by slug or query all reviews
    let query = (supabaseAdmin as any)
      .from('google_reviews')
      .select('*')
      .order('review_time', { ascending: false });

    if (targetBusinessId && !targetBusinessId.startsWith('biz_')) {
      query = query.eq('business_id', targetBusinessId);
    }

    const { data: rows, error } = await query;

    if (error) {
      console.error('Failed to fetch reviews from Supabase:', error);
      return NextResponse.json(
        { success: false, error: error.message, reviews: [] },
        { status: 500 }
      );
    }

    const reviews: Review[] = (rows || []).map(mapRowToReview);

    // Compute basic summary
    const count = reviews.length;
    const totalRating = reviews.reduce((sum, r) => sum + (r.rating || 0), 0);
    const averageRating = count > 0 ? parseFloat((totalRating / count).toFixed(1)) : 5.0;

    return NextResponse.json({
      success: true,
      businessId: targetBusinessId,
      reviews,
      count,
      averageRating,
    });
  } catch (err: any) {
    console.error('API reviews GET error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error', reviews: [] },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      businessId,
      reviewerName = 'Customer',
      rating = 5,
      text = '',
      reviewerImage,
      source = 'google',
      tags = ['Customer Review'],
    } = body;

    if (!businessId) {
      return NextResponse.json(
        { success: false, error: 'businessId is required.' },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdminClient();
    let resolvedBusinessId = businessId;

    // Resolve slug if needed
    if (!resolvedBusinessId.includes('-')) {
      const { data: biz } = await (supabaseAdmin as any)
        .from('businesses')
        .select('id')
        .eq('slug', businessId)
        .maybeSingle();

      if (biz?.id) {
        resolvedBusinessId = biz.id;
      }
    }

    const reviewId = body.reviewId || `rev_${Date.now()}`;
    const sentiment = determineSentiment(rating);
    const now = new Date().toISOString();

    const insertPayload = {
      business_id: resolvedBusinessId,
      google_review_id: reviewId,
      reviewer_name: reviewerName,
      reviewer_photo_url: reviewerImage || null,
      rating: Math.min(5, Math.max(1, Math.round(rating))),
      review_text: text,
      review_time: now,
      sentiment,
      topics: tags,
      reply_status: 'unanswered',
    };

    const { data, error } = await (supabaseAdmin as any)
      .from('google_reviews')
      .upsert(insertPayload, { onConflict: 'business_id,google_review_id' })
      .select('*')
      .single();

    if (error) {
      console.error('Error inserting review in Supabase:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    const mapped = mapRowToReview(data || insertPayload);
    return NextResponse.json({
      success: true,
      review: mapped,
    });
  } catch (err: any) {
    console.error('API reviews POST error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
