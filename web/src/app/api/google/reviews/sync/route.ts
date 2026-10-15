import { NextRequest, NextResponse } from 'next/server';
import { getValidGoogleToken } from '@/lib/google/tokens';
import { getSupabaseAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// Star rating string mapping from Google My Business API v4
const STAR_RATING_MAP: Record<string, number> = {
  ONE: 1,
  TWO: 2,
  THREE: 3,
  FOUR: 4,
  FIVE: 5,
};

// Common customer review topic extractors
const TOPIC_KEYWORDS: Record<string, string[]> = {
  Food: ['food', 'dish', 'taste', 'flavor', 'delicious', 'menu', 'meal', 'cuisine', 'curry', 'dessert'],
  Service: ['service', 'staff', 'waiter', 'server', 'friendly', 'courteous', 'hospitality', 'attentive'],
  Ambience: ['ambience', 'atmosphere', 'vibe', 'decor', 'music', 'seating', 'aesthetic', 'cozy', 'interior'],
  Cleanliness: ['clean', 'hygiene', 'neat', 'spotless', 'tidy', 'sanitized'],
  Pricing: ['price', 'pricing', 'affordable', 'expensive', 'worth', 'value', 'bill', 'pocket-friendly'],
  Speed: ['quick', 'fast', 'slow', 'wait', 'waiting', 'delay', 'prompt', 'instant'],
  Delivery: ['delivery', 'packaging', 'takeaway', 'parcel', 'hot', 'arrived'],
};

function extractTopics(comment?: string | null): string[] {
  if (!comment) return [];
  const lower = comment.toLowerCase();
  const matchedTopics: string[] = [];

  for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      matchedTopics.push(topic);
    }
  }

  return matchedTopics.length > 0 ? matchedTopics : ['General Experience'];
}

function determineSentiment(rating: number): 'positive' | 'neutral' | 'negative' {
  if (rating >= 4) return 'positive';
  if (rating === 3) return 'neutral';
  return 'negative';
}

function parseStarRating(rawRating: any): number {
  if (typeof rawRating === 'number') return Math.min(5, Math.max(1, Math.round(rawRating)));
  if (typeof rawRating === 'string') {
    const upper = rawRating.toUpperCase();
    if (STAR_RATING_MAP[upper]) return STAR_RATING_MAP[upper];
    const parsed = parseInt(rawRating, 10);
    if (!isNaN(parsed)) return Math.min(5, Math.max(1, parsed));
  }
  return 5;
}

const MAX_REVIEW_PAGES_PER_SYNC = 100;

function isScheduledSync(req: NextRequest): boolean {
  const configuredSecret = process.env.NETLIFY_REVIEW_SYNC_SECRET;
  return Boolean(configuredSecret) && req.headers.get('x-pixora-cron-secret') === configuredSecret;
}

async function assertBusinessAccess(req: NextRequest, businessId: string, admin: any): Promise<NextResponse | null> {
  const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim();
  if (!token) {
    return NextResponse.json({ success: false, status: 'requires_auth', message: 'Sign in and connect your Google Business Profile before syncing reviews.' }, { status: 401 });
  }

  const { data: { user }, error } = await admin.auth.getUser(token);
  if (error || !user) {
    return NextResponse.json({ success: false, status: 'requires_auth', message: 'Your session is invalid or expired. Please sign in again.' }, { status: 401 });
  }

  const [{ data: business }, { data: membership }] = await Promise.all([
    admin.from('businesses').select('id').eq('id', businessId).eq('owner_id', user.id).maybeSingle(),
    admin.from('business_members').select('business_id').eq('business_id', businessId).eq('user_id', user.id).maybeSingle(),
  ]);

  if (!business && !membership) {
    return NextResponse.json({ success: false, error: 'You do not have access to this business.' }, { status: 403 });
  }

  return null;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const searchParams = req.nextUrl.searchParams;
    const businessId = body.businessId || searchParams.get('businessId');
    const pageToken = body.pageToken || searchParams.get('pageToken') || undefined;
    const pageSize = Math.min(50, Math.max(1, body.pageSize || parseInt(searchParams.get('pageSize') || '50', 10)));

    const syncAll = Boolean(body.syncAll || searchParams.get('syncAll') === 'true');
    if (!businessId && !syncAll) {
      return NextResponse.json(
        { success: false, error: 'Missing businessId parameter for Google review synchronization.' },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdminClient();

    // The scheduled worker is the only caller allowed to request a batch sync.
    // Client requests must identify a business and carry the signed-in user's token.
    const scheduled = isScheduledSync(req);
    if (syncAll) {
      if (!scheduled) {
        return NextResponse.json({ success: false, error: 'Scheduled sync authorization required.' }, { status: 401 });
      }

      const { data: connections, error: connectionsError } = await (supabaseAdmin as any)
        .from('google_connections')
        .select('business_id')
        .eq('status', 'connected');

      if (connectionsError) {
        return NextResponse.json({ success: false, error: 'Could not load connected Google Business Profiles.' }, { status: 500 });
      }

      const results = await Promise.all(
        (connections || []).map(async ({ business_id }: { business_id: string }) => {
          const internalRequest = new NextRequest(req.url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-pixora-cron-secret': process.env.NETLIFY_REVIEW_SYNC_SECRET || '',
            },
            body: JSON.stringify({ businessId: business_id, pageSize }),
          });
          const response = await POST(internalRequest);
          return response.json();
        })
      );

      return NextResponse.json({
        success: results.every((result) => result.success),
        status: 'scheduled',
        businesses: results.length,
        syncedCount: results.reduce((sum, result) => sum + (result.syncedCount || 0), 0),
        results,
      });
    }

    if (!scheduled) {
      const accessError = await assertBusinessAccess(req, businessId, supabaseAdmin);
      if (accessError) return accessError;
    }

    // 1. Fetch business and connection records from Supabase
    const { data: business, error: bizError } = await (supabaseAdmin as any)
      .from('businesses')
      .select('id, name, slug, website, google_review_url, google_maps_url')
      .eq('id', businessId)
      .maybeSingle();

    if (bizError || !business) {
      return NextResponse.json(
        { success: false, error: 'Business not found in database.' },
        { status: 404 }
      );
    }

    const { data: conn } = await (supabaseAdmin as any)
      .from('google_connections')
      .select('*')
      .eq('business_id', businessId)
      .maybeSingle();

    // 2. Resolve fresh Google OAuth access token
    const tokenResult = await getValidGoogleToken(businessId);
    if (!tokenResult.success || !tokenResult.accessToken) {
      return NextResponse.json({
        success: false,
        status: 'requires_auth',
        message:
          tokenResult.error ||
          'No active Google OAuth authorization found. Please authorize Google Business Profile in Settings to enable live review sync.',
        syncedCount: 0,
      });
    }

    const accessToken = tokenResult.accessToken;

    // 3. Resolve Account Resource Name (e.g. accounts/1029384756)
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
            // Persist the verified account name for future calls
            await (supabaseAdmin as any)
              .from('google_connections')
              .update({ google_account_id: accountName })
              .eq('business_id', businessId);
          }
        } else {
          const accErr = await accRes.json().catch(() => ({}));
          const errMsg = accErr.error?.message || '';
          if (
            accRes.status === 403 ||
            errMsg.toLowerCase().includes('permission') ||
            errMsg.toLowerCase().includes('not been used')
          ) {
            return NextResponse.json({
              success: false,
              status: 'access_pending',
              message:
                'Google Business Profile API access approval is pending on your Google Cloud project. Merchant OAuth is connected, but Google has not yet approved API access.',
              googleConsoleUrl:
                `https://console.cloud.google.com/apis/library/mybusiness.googleapis.com?project=${process.env.GOOGLE_PROJECT_ID || ''}`,
              syncedCount: 0,
            });
          }
        }
      } catch (accLookupErr) {
        console.warn('Account lookup warning in review sync:', accLookupErr);
      }
    }

    if (!accountName || !accountName.startsWith('accounts/')) {
      return NextResponse.json({
        success: false,
        status: 'access_pending',
        message:
          'Could not retrieve Google Business account name. Google Business Profile API access request for this project is pending approval.',
        googleConsoleUrl:
          `https://console.cloud.google.com/apis/library/mybusiness.googleapis.com?project=${process.env.GOOGLE_PROJECT_ID || ''}`,
        syncedCount: 0,
      });
    }

    // 4. Resolve Location Resource Name (e.g. locations/987654321)
    let locationName = conn?.google_location_id;
    let fullLocationPath = '';

    if (locationName && locationName.startsWith('accounts/')) {
      fullLocationPath = locationName;
    } else if (locationName && locationName.startsWith('locations/')) {
      fullLocationPath = `${accountName}/${locationName}`;
    } else {
      // Look up location name via Business Information API
      try {
        const locRes = await fetch(
          `https://mybusinessbusinessinformation.googleapis.com/v1/${accountName}/locations?readMask=name,metadata,title`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (locRes.ok) {
          const locData = await locRes.json();
          if (locData.locations && locData.locations.length > 0) {
            // Find location matching Place ID or location ID if available, else first location
            const matched =
              (conn?.google_location_id &&
                locData.locations.find(
                  (l: any) =>
                    l.metadata?.placeId === conn.google_location_id ||
                    l.name === conn.google_location_id ||
                    l.name?.endsWith(`/${conn.google_location_id}`)
                )) ||
              locData.locations[0];

            if (matched?.name) {
              locationName = matched.name;
              fullLocationPath = matched.name.startsWith('accounts/')
                ? matched.name
                : `${accountName}/${matched.name}`;

              await (supabaseAdmin as any)
                .from('google_connections')
                .update({ google_location_id: matched.name })
                .eq('business_id', businessId);
            }
          }
        }
      } catch (locErr) {
        console.warn('Location lookup warning in review sync:', locErr);
      }
    }

    if (!fullLocationPath) {
      fullLocationPath = `${accountName}/locations/${locationName || 'primary'}`;
    }

    // 5. Query every page through the official Google Business Profile API.
    // This imports the historical set on first connection and remains idempotent
    // because rows are upserted by (business_id, google_review_id) below.
    let nextPageToken = pageToken;
    let gmbData: any = {};
    const rawReviews: any[] = [];

    for (let page = 0; page < MAX_REVIEW_PAGES_PER_SYNC; page += 1) {
      const reviewsUrl = new URL(`https://mybusiness.googleapis.com/v4/${fullLocationPath}/reviews`);
      reviewsUrl.searchParams.set('pageSize', pageSize.toString());
      reviewsUrl.searchParams.set('orderBy', 'updateTime desc');
      if (nextPageToken) reviewsUrl.searchParams.set('pageToken', nextPageToken);

      const gmbRes = await fetch(reviewsUrl.toString(), {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!gmbRes.ok) {
        const gmbErrData = await gmbRes.json().catch(() => ({}));
        const errMsg = gmbErrData.error?.message || '';
        const errStatus = gmbErrData.error?.status || '';

        if (
          gmbRes.status === 403 ||
          errStatus === 'PERMISSION_DENIED' ||
          errMsg.toLowerCase().includes('permission') ||
          errMsg.toLowerCase().includes('not been used') ||
          errMsg.toLowerCase().includes('disabled')
        ) {
        // Record last synced probe attempt
        const now = new Date().toISOString();
        await (supabaseAdmin as any)
          .from('google_connections')
          .update({ last_synced_at: now, updated_at: now })
          .eq('business_id', businessId);

        return NextResponse.json({
          success: false,
          status: 'access_pending',
          message:
            'Google Business Profile API access approval is pending on your Google Cloud project. Review sync will activate once Google approves project access.',
          googleConsoleUrl:
            `https://console.cloud.google.com/apis/library/mybusiness.googleapis.com?project=${process.env.GOOGLE_PROJECT_ID || ''}`,
          syncedCount: 0,
        });
      }

        if (gmbRes.status === 401) {
          return NextResponse.json(
            {
              success: false,
              status: 'reconnect_required',
              message: 'Google authorization expired or revoked. Please reconnect in Settings.',
              syncedCount: 0,
            },
            { status: 401 }
          );
        }

        return NextResponse.json(
          {
            success: false,
            status: 'api_error',
            message: errMsg || 'Google Business Profile API returned an error during review sync.',
            syncedCount: 0,
          },
          { status: gmbRes.status }
        );
      }

      const pageData = await gmbRes.json();
      gmbData = { ...gmbData, ...pageData };
      if (Array.isArray(pageData.reviews)) rawReviews.push(...pageData.reviews);
      nextPageToken = pageData.nextPageToken || undefined;
      if (!nextPageToken) break;
    }

    // Query existing local reviews to avoid overwriting pending local drafts
    const { data: existingReviews } = await (supabaseAdmin as any)
      .from('google_reviews')
      .select('google_review_id, reply_status, reply_text')
      .eq('business_id', businessId);

    const existingReviewMap = new Map<string, { reply_status: string; reply_text: string | null }>();
    if (existingReviews) {
      for (const er of existingReviews) {
        existingReviewMap.set(er.google_review_id, {
          reply_status: er.reply_status,
          reply_text: er.reply_text,
        });
      }
    }

    const reviewsToUpsert = rawReviews.map((r: any) => {
      const reviewId = r.reviewId || r.name?.split('/').pop() || `g_rev_${Date.now()}`;
      const rating = parseStarRating(r.starRating);
      const existing = existingReviewMap.get(reviewId);

      let replyStatus: 'unanswered' | 'replied' | 'draft' = 'unanswered';
      let replyText: string | null = null;

      if (r.reviewReply?.comment) {
        // Merchant has already replied on Google directly
        replyStatus = 'replied';
        replyText = r.reviewReply.comment;
      } else if (existing && existing.reply_status === 'draft') {
        // Preserve local draft in progress
        replyStatus = 'draft';
        replyText = existing.reply_text;
      }

      const reviewText = r.comment || '';
      const topics = extractTopics(reviewText);
      const sentiment = determineSentiment(rating);
      const reviewTime = r.createTime || r.updateTime || new Date().toISOString();

      return {
        business_id: businessId,
        google_review_id: reviewId,
        reviewer_name: r.reviewer?.displayName || 'Google Reviewer',
        reviewer_photo_url: r.reviewer?.profilePhotoUrl || null,
        rating,
        review_text: reviewText,
        review_time: reviewTime,
        sentiment,
        topics,
        reply_status: replyStatus,
        reply_text: replyText,
        google_review_url:
          business.google_review_url ||
          (conn?.google_location_id && conn.google_location_id.startsWith('ChI')
            ? `https://search.google.com/local/writereview?placeid=${conn.google_location_id}`
            : business.google_maps_url || business.website || null),
        updated_at: new Date().toISOString(),
      };
    });

    // 7. Upsert reviews into Supabase
    if (reviewsToUpsert.length > 0) {
      const { error: upsertErr } = await (supabaseAdmin as any)
        .from('google_reviews')
        .upsert(reviewsToUpsert, { onConflict: 'business_id,google_review_id' });

      if (upsertErr) {
        console.error('Error upserting reviews into Supabase:', upsertErr);
      }
    }

    // 8. Update timestamps
    const now = new Date().toISOString();
    const nextSyncAt = new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString();
    const avgRating =
      typeof gmbData.averageRating === 'number'
        ? gmbData.averageRating
        : reviewsToUpsert.length > 0
        ? parseFloat((reviewsToUpsert.reduce((acc: number, r: any) => acc + r.rating, 0) / reviewsToUpsert.length).toFixed(1))
        : 5.0;

    const totalCount =
      typeof gmbData.totalReviewCount === 'number'
        ? gmbData.totalReviewCount
        : reviewsToUpsert.length;

    await (supabaseAdmin as any)
      .from('businesses')
      .update({
        updated_at: now,
      })
      .eq('id', businessId);

    await (supabaseAdmin as any)
      .from('google_connections')
      .update({
        last_synced_at: now,
        next_sync_at: nextSyncAt,
        initial_sync_completed_at: conn?.initial_sync_completed_at || now,
        sync_error: null,
        updated_at: now,
      })
      .eq('business_id', businessId);

    await (supabaseAdmin as any)
      .from('google_integrations')
      .update({ last_synced_at: now })
      .eq('business_id', businessId);

    return NextResponse.json({
      success: true,
      status: 'synced',
      syncedCount: reviewsToUpsert.length,
      totalReviewCount: totalCount,
      averageRating: avgRating,
      nextPageToken: gmbData.nextPageToken || null,
      message: `${reviewsToUpsert.length} reviews synchronized successfully from Google My Business.`,
    });
  } catch (error: any) {
    console.error('Fatal error in Google review synchronization:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error synchronizing Google reviews.',
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  return POST(req);
}
