import { NextRequest, NextResponse } from 'next/server';
import { getValidGoogleToken } from '@/lib/google/tokens';
import { getSupabaseAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const searchParams = req.nextUrl.searchParams;
    const businessId = body.businessId || searchParams.get('businessId');
    const googleReviewId = body.googleReviewId || body.reviewId || searchParams.get('googleReviewId');
    const replyText = (body.replyText || body.comment || searchParams.get('replyText') || searchParams.get('comment') || '').trim();
    const source = (body.source || 'manual') as 'manual' | 'smart' | 'auto';
    const mode = (body.mode || 'publish') as 'publish' | 'draft';

    if (!businessId) {
      return NextResponse.json(
        { success: false, error: 'Missing businessId parameter.' },
        { status: 400 }
      );
    }

    if (!googleReviewId) {
      return NextResponse.json(
        { success: false, error: 'Missing googleReviewId parameter.' },
        { status: 400 }
      );
    }

    if (!replyText) {
      return NextResponse.json(
        { success: false, error: 'replyText cannot be empty.' },
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

    // 2. Fetch target review from Supabase
    // Match by either google_review_id (Google ID string) or id (Supabase UUID)
    let reviewQuery = (supabaseAdmin as any)
      .from('google_reviews')
      .select('id, business_id, google_review_id, rating, sentiment, reply_status, reply_text')
      .eq('business_id', business.id);

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(googleReviewId);
    if (isUuid) {
      reviewQuery = reviewQuery.or(`id.eq.${googleReviewId},google_review_id.eq.${googleReviewId}`);
    } else {
      reviewQuery = reviewQuery.eq('google_review_id', googleReviewId);
    }

    const { data: reviewRow, error: revError } = await reviewQuery.maybeSingle();

    if (revError || !reviewRow) {
      return NextResponse.json(
        { success: false, error: 'Review not found for this business.' },
        { status: 404 }
      );
    }

    // 3. Automated reply policy check
    if (source === 'auto') {
      if (business.plan_status !== 'active') {
        return NextResponse.json(
          {
            success: false,
            status: 'trial_restricted',
            message: 'Auto-reply is strictly disabled for trial accounts. An active plan is required to publish automated replies.',
          },
          { status: 403 }
        );
      }

      const { data: rule } = await (supabaseAdmin as any)
        .from('reply_rules')
        .select('*')
        .eq('business_id', business.id)
        .maybeSingle();

      if (rule) {
        if (reviewRow.rating < rule.rating_min || reviewRow.rating > rule.rating_max) {
          return NextResponse.json(
            {
              success: false,
              status: 'rule_mismatch',
              message: `Review rating (${reviewRow.rating} stars) falls outside configured auto-reply range (${rule.rating_min}-${rule.rating_max} stars).`,
            },
            { status: 400 }
          );
        }

        if (rule.sensitive_issue_review && (reviewRow.rating <= 2 || reviewRow.sentiment === 'negative')) {
          // Sensitive issue: save as draft only, require manual review
          await (supabaseAdmin as any)
            .from('google_reviews')
            .update({
              reply_status: 'draft',
              reply_text: replyText,
              updated_at: new Date().toISOString(),
            })
            .eq('id', reviewRow.id);

          await (supabaseAdmin as any)
            .from('review_replies')
            .upsert(
              {
                business_id: business.id,
                google_review_id: reviewRow.id,
                reply_text: replyText,
                source: 'auto',
                status: 'draft',
                updated_at: new Date().toISOString(),
              },
              { onConflict: 'google_review_id' }
            );

          return NextResponse.json({
            success: true,
            status: 'draft_pending_human_review',
            message: 'Sensitive or low-rating review flagged for manual human review. Reply saved as draft.',
          });
        }
      }
    }

    // 4. Draft mode: save locally in Supabase without attempting upstream Google publish
    if (mode === 'draft') {
      await (supabaseAdmin as any)
        .from('google_reviews')
        .update({
          reply_status: 'draft',
          reply_text: replyText,
          updated_at: new Date().toISOString(),
        })
        .eq('id', reviewRow.id);

      await (supabaseAdmin as any)
        .from('review_replies')
        .upsert(
          {
            business_id: business.id,
            google_review_id: reviewRow.id,
            reply_text: replyText,
            source,
            status: 'draft',
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'google_review_id' }
        );

      return NextResponse.json({
        success: true,
        status: 'draft',
        message: 'Reply draft saved successfully.',
        reviewId: reviewRow.google_review_id,
        replyText,
      });
    }

    // 5. Live Publish Mode: query Google OAuth token
    const tokenResult = await getValidGoogleToken(businessId);
    if (!tokenResult.success || !tokenResult.accessToken) {
      // Save locally as draft so merchant effort is never lost
      await (supabaseAdmin as any)
        .from('google_reviews')
        .update({
          reply_status: 'draft',
          reply_text: replyText,
          updated_at: new Date().toISOString(),
        })
        .eq('id', reviewRow.id);

      await (supabaseAdmin as any)
        .from('review_replies')
        .upsert(
          {
            business_id: business.id,
            google_review_id: reviewRow.id,
            reply_text: replyText,
            source,
            status: 'draft',
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'google_review_id' }
        );

      return NextResponse.json({
        success: false,
        status: 'requires_auth',
        message:
          'Google authorization required to publish live replies. Your reply has been saved locally as a draft.',
        reviewId: reviewRow.google_review_id,
        replyText,
      });
    }

    const accessToken = tokenResult.accessToken;

    // 6. Resolve Google Account and Location hierarchy
    const { data: conn } = await (supabaseAdmin as any)
      .from('google_connections')
      .select('*')
      .eq('business_id', businessId)
      .maybeSingle();

    let accountName = conn?.google_account_id;
    if (!accountName || !accountName.startsWith('accounts/')) {
      try {
        const accRes = await fetch('https://mybusinessaccountmanagement.googleapis.com/v1/accounts', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        });

        if (accRes.ok) {
          const accData = await accRes.json();
          if (accData.accounts && accData.accounts.length > 0) {
            accountName = accData.accounts[0].name;
          }
        }
      } catch (e) {}
    }

    if (!accountName || !accountName.startsWith('accounts/')) {
      // Record locally as draft
      await (supabaseAdmin as any)
        .from('google_reviews')
        .update({
          reply_status: 'draft',
          reply_text: replyText,
          updated_at: new Date().toISOString(),
        })
        .eq('id', reviewRow.id);

      return NextResponse.json({
        success: false,
        status: 'access_pending',
        message:
          'Google Business Profile API access approval is pending on your Google Cloud project. Reply saved locally as a draft.',
        googleConsoleUrl:
          `https://console.cloud.google.com/apis/library/mybusiness.googleapis.com?project=${process.env.GOOGLE_PROJECT_ID || ''}`,
        reviewId: reviewRow.google_review_id,
        replyText,
      });
    }

    let locationName = conn?.google_location_id;
    let fullLocationPath = '';

    if (locationName && locationName.startsWith('accounts/')) {
      fullLocationPath = locationName;
    } else if (locationName && locationName.startsWith('locations/')) {
      fullLocationPath = `${accountName}/${locationName}`;
    } else {
      fullLocationPath = `${accountName}/locations/${locationName || 'primary'}`;
    }

    // 7. Clean review ID resource path
    // Google review IDs look like 'AbCdEf123' or 'accounts/.../locations/.../reviews/AbCdEf123'
    const rawRevId = reviewRow.google_review_id;
    const cleanReviewId = rawRevId.includes('/reviews/')
      ? rawRevId.split('/reviews/').pop()
      : rawRevId;

    // 8. Publish reply to Google My Business API v4
    const replyUrl = `https://mybusiness.googleapis.com/v4/${fullLocationPath}/reviews/${cleanReviewId}/reply`;

    const gmbRes = await fetch(replyUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        comment: replyText,
      }),
    });

    if (!gmbRes.ok) {
      const gmbErrData = await gmbRes.json().catch(() => ({}));
      const errMsg = gmbErrData.error?.message || '';
      const errStatus = gmbErrData.error?.status || '';

      // Check if Google project API approval is pending (403 PERMISSION_DENIED)
      if (
        gmbRes.status === 403 ||
        errStatus === 'PERMISSION_DENIED' ||
        errMsg.toLowerCase().includes('permission') ||
        errMsg.toLowerCase().includes('not been used') ||
        errMsg.toLowerCase().includes('disabled')
      ) {
        // Record reply locally as draft in Supabase
        const now = new Date().toISOString();
        await (supabaseAdmin as any)
          .from('google_reviews')
          .update({
            reply_status: 'draft',
            reply_text: replyText,
            updated_at: now,
          })
          .eq('id', reviewRow.id);

        await (supabaseAdmin as any)
          .from('review_replies')
          .upsert(
            {
              business_id: business.id,
              google_review_id: reviewRow.id,
              reply_text: replyText,
              source,
              status: 'draft',
              updated_at: now,
            },
            { onConflict: 'google_review_id' }
          );

        return NextResponse.json({
          success: false,
          status: 'access_pending',
          message:
            'Google Business Profile API access request is pending Google approval. Your reply has been saved locally as a draft and is ready to post once Google approves project access.',
          googleConsoleUrl:
            `https://console.cloud.google.com/apis/library/mybusiness.googleapis.com?project=${process.env.GOOGLE_PROJECT_ID || ''}`,
          reviewId: reviewRow.google_review_id,
          replyText,
        });
      }

      if (gmbRes.status === 401) {
        return NextResponse.json(
          {
            success: false,
            status: 'reconnect_required',
            message: 'Google authorization expired or revoked. Please reconnect in Settings.',
          },
          { status: 401 }
        );
      }

      // Other upstream error: preserve locally as draft
      await (supabaseAdmin as any)
        .from('google_reviews')
        .update({
          reply_status: 'draft',
          reply_text: replyText,
          updated_at: new Date().toISOString(),
        })
        .eq('id', reviewRow.id);

      return NextResponse.json(
        {
          success: false,
          status: 'api_error',
          message: errMsg || 'Google My Business API v4 returned an error while posting reply.',
          reviewId: reviewRow.google_review_id,
        },
        { status: gmbRes.status }
      );
    }

    // 9. Successfully published live to Google!
    const gmbSuccessData = await gmbRes.json();
    const now = new Date().toISOString();

    await (supabaseAdmin as any)
      .from('google_reviews')
      .update({
        reply_status: 'replied',
        reply_text: replyText,
        updated_at: now,
      })
      .eq('id', reviewRow.id);

    await (supabaseAdmin as any)
      .from('review_replies')
      .upsert(
        {
          business_id: business.id,
          google_review_id: reviewRow.id,
          reply_text: replyText,
          source,
          status: 'posted',
          updated_at: now,
        },
        { onConflict: 'google_review_id' }
      );

    return NextResponse.json({
      success: true,
      status: 'posted',
      message: 'Reply published to Google Maps successfully!',
      reviewId: reviewRow.google_review_id,
      replyText: gmbSuccessData.comment || replyText,
      postedAt: gmbSuccessData.updateTime || now,
    });
  } catch (error: any) {
    console.error('Fatal error in Google review reply endpoint:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error while processing Google review reply.',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const body = await req.json().catch(() => ({}));
    const businessId = body.businessId || searchParams.get('businessId');
    const googleReviewId = body.googleReviewId || searchParams.get('googleReviewId');

    if (!businessId || !googleReviewId) {
      return NextResponse.json(
        { success: false, error: 'Missing businessId or googleReviewId parameter.' },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdminClient();

    const { data: business } = await (supabaseAdmin as any)
      .from('businesses')
      .select('id')
      .eq('id', businessId)
      .maybeSingle();

    if (!business) {
      return NextResponse.json({ success: false, error: 'Business not found.' }, { status: 404 });
    }

    const tokenResult = await getValidGoogleToken(businessId);
    if (tokenResult.success && tokenResult.accessToken) {
      const { data: conn } = await (supabaseAdmin as any)
        .from('google_connections')
        .select('*')
        .eq('business_id', businessId)
        .maybeSingle();

      const accountName = conn?.google_account_id || 'accounts/primary';
      const locationName = conn?.google_location_id || 'primary';
      const cleanReviewId = googleReviewId.includes('/reviews/')
        ? googleReviewId.split('/reviews/').pop()
        : googleReviewId;

      const deleteUrl = `https://mybusiness.googleapis.com/v4/${accountName}/locations/${locationName}/reviews/${cleanReviewId}/reply`;
      await fetch(deleteUrl, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${tokenResult.accessToken}`,
        },
      }).catch(() => {});
    }

    // Reset local status
    await (supabaseAdmin as any)
      .from('google_reviews')
      .update({
        reply_status: 'unanswered',
        reply_text: null,
        updated_at: new Date().toISOString(),
      })
      .eq('google_review_id', googleReviewId);

    return NextResponse.json({
      success: true,
      message: 'Review reply deleted successfully.',
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Error deleting review reply.' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  return POST(req);
}

