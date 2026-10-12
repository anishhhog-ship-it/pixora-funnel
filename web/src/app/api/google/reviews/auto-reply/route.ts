import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const searchParams = req.nextUrl.searchParams;
    const businessId = body.businessId || searchParams.get('businessId');

    if (!businessId) {
      return NextResponse.json(
        { success: false, error: 'Missing businessId parameter.' },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdminClient();

    // 1. Fetch business record
    const { data: business, error: bizError } = await (supabaseAdmin as any)
      .from('businesses')
      .select('id, name, slug, plan_status')
      .eq('id', businessId)
      .maybeSingle();

    if (bizError || !business) {
      return NextResponse.json(
        { success: false, error: 'Business not found in database.' },
        { status: 404 }
      );
    }

    // 2. Strict Plan Entitlement Enforcement
    if (business.plan_status !== 'active') {
      return NextResponse.json(
        {
          success: false,
          status: 'trial_restricted',
          message:
            'Auto Reply is disabled for trial accounts. An active plan is required to enable live automated review replies.',
          processed: 0,
          posted: 0,
          drafted: 0,
        },
        { status: 403 }
      );
    }

    // 3. Query Auto-Reply Rules for this business
    const { data: rule } = await (supabaseAdmin as any)
      .from('reply_rules')
      .select('*')
      .eq('business_id', business.id)
      .maybeSingle();

    const isAutoReplyActive = rule ? rule.auto_reply_enabled : false;
    if (!isAutoReplyActive) {
      return NextResponse.json({
        success: false,
        status: 'disabled',
        message: 'Auto Reply is currently disabled for this business in settings.',
        processed: 0,
        posted: 0,
        drafted: 0,
      });
    }

    const minRating = rule?.rating_min ?? 4;
    const maxRating = rule?.rating_max ?? 5;
    const approvalRequired = rule?.approval_required ?? true;
    const sensitiveIssueReview = rule?.sensitive_issue_review ?? true;

    // 4. Query Unreplied Reviews
    const { data: unrepliedReviews, error: revError } = await (supabaseAdmin as any)
      .from('google_reviews')
      .select('id, business_id, google_review_id, reviewer_name, rating, review_text, sentiment, reply_status')
      .eq('business_id', business.id)
      .eq('reply_status', 'unanswered')
      .order('review_time', { ascending: false })
      .limit(30);

    if (revError || !unrepliedReviews || unrepliedReviews.length === 0) {
      return NextResponse.json({
        success: true,
        status: 'up_to_date',
        message: 'No pending or unanswered Google reviews require replies.',
        processed: 0,
        posted: 0,
        drafted: 0,
      });
    }

    // 5. Query Active Templates
    const { data: templates } = await (supabaseAdmin as any)
      .from('reply_templates')
      .select('*')
      .or(`business_id.eq.${business.id},business_id.is.null`)
      .eq('active', true);

    let postedCount = 0;
    let draftedCount = 0;
    let skippedCount = 0;
    const results: Array<{ reviewId: string; status: string; replyText: string }> = [];

    // Helper: generate reply text
    const generateReply = (rev: any): string => {
      const reviewerFirstName = (rev.reviewer_name || 'Valued Customer').split(' ')[0];
      const matchedTemplate = templates?.find((t: any) => {
        if (t.rating_range && t.rating_range.includes('-')) {
          const [low, high] = t.rating_range.split('-').map(Number);
          return rev.rating >= low && rev.rating <= high;
        }
        return Number(t.rating_range) === rev.rating;
      });

      if (matchedTemplate?.template_text) {
        return matchedTemplate.template_text
          .replace(/{name}/gi, reviewerFirstName)
          .replace(/{business}/gi, business.name);
      }

      if (rev.rating >= 4) {
        return `Thank you so much for the 5-star review, ${reviewerFirstName}! We are thrilled you enjoyed your experience at ${business.name}. Looking forward to welcoming you back soon! ✨`;
      } else if (rev.rating === 3) {
        return `Dear ${reviewerFirstName}, thank you for taking the time to share your feedback with us. We appreciate your review and are constantly working to improve our offerings at ${business.name}.`;
      } else {
        return `Dear ${reviewerFirstName}, thank you for your candid feedback. We sincerely apologize that your experience did not meet expectations. We take this very seriously and would love the chance to make things right for you.`;
      }
    };

    // 6. Process each review
    for (const rev of unrepliedReviews) {
      // Check rating limits
      if (rev.rating < minRating || rev.rating > maxRating) {
        skippedCount++;
        continue;
      }

      // Check sensitive review policy
      const isSensitive = sensitiveIssueReview && (rev.rating <= 2 || rev.sentiment === 'negative');
      const shouldDraftOnly = approvalRequired || isSensitive;
      const replyText = generateReply(rev);

      if (shouldDraftOnly) {
        // Save as draft
        const now = new Date().toISOString();
        await (supabaseAdmin as any)
          .from('google_reviews')
          .update({
            reply_status: 'draft',
            reply_text: replyText,
            updated_at: now,
          })
          .eq('id', rev.id);

        await (supabaseAdmin as any)
          .from('review_replies')
          .upsert(
            {
              business_id: business.id,
              google_review_id: rev.id,
              reply_text: replyText,
              source: 'auto',
              status: 'draft',
              updated_at: now,
            },
            { onConflict: 'google_review_id' }
          );

        draftedCount++;
        results.push({ reviewId: rev.google_review_id, status: 'draft', replyText });
      } else {
        // Directly invoke reply route internally
        const host = req.headers.get('host') || 'localhost:3000';
        const protocol = host.includes('localhost') ? 'http' : 'https';
        const replyRes = await fetch(`${protocol}://${host}/api/google/reviews/reply`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            businessId: business.id,
            googleReviewId: rev.google_review_id,
            replyText,
            source: 'auto',
            mode: 'publish',
          }),
        }).catch(() => null);

        if (replyRes && replyRes.ok) {
          const replyData = await replyRes.json();
          if (replyData.status === 'posted') {
            postedCount++;
            results.push({ reviewId: rev.google_review_id, status: 'posted', replyText });
          } else {
            draftedCount++;
            results.push({ reviewId: rev.google_review_id, status: 'draft', replyText });
          }
        } else {
          draftedCount++;
          results.push({ reviewId: rev.google_review_id, status: 'draft', replyText });
        }
      }
    }

    return NextResponse.json({
      success: true,
      status: 'completed',
      totalUnreplied: unrepliedReviews.length,
      processed: unrepliedReviews.length - skippedCount,
      posted: postedCount,
      drafted: draftedCount,
      skipped: skippedCount,
      results,
      message: `Auto-reply run complete: ${postedCount} posted live, ${draftedCount} saved as drafts for review.`,
    });
  } catch (error: any) {
    console.error('Fatal error in Auto-Reply worker endpoint:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error running auto-reply worker.',
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  return POST(req);
}
