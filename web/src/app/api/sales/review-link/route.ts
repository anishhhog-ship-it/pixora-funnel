import { NextRequest, NextResponse } from 'next/server';
import { isUuid } from '@/services/salesServer';
import { extractAuthToken, verifySalesStaffAccess } from '@/services/salesAuthService';
import { generateGoogleReviewLink, GoogleReviewLinkError } from '@/services/googleReviewLinkService';

function requestIp(req: NextRequest) {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || req.headers.get('x-real-ip')
    || 'unknown';
}

export async function POST(req: NextRequest) {
  const session = await verifySalesStaffAccess(extractAuthToken(req));
  if (!session.isAuthenticated) return NextResponse.json({ success: false, error: 'Unauthorized sales access' }, { status: 401 });

  try {
    const body = await req.json();
    const mapsUrl = typeof body.mapsUrl === 'string' ? body.mapsUrl.trim() : '';
    const prospectId = body.prospectId == null ? null : body.prospectId;
    if (prospectId && !isUuid(prospectId)) return NextResponse.json({ success: false, error: 'Invalid prospect ID' }, { status: 400 });

    const result = await generateGoogleReviewLink({ mapsUrl, prospectId, ip: requestIp(req) });
    return NextResponse.json({
      success: true,
      placeId: result.placeId,
      reviewUrl: result.reviewUrl,
      verification: result.verification,
      source: result.source,
      requiresBusinessConfirmation: true,
    });
  } catch (error) {
    if (error instanceof GoogleReviewLinkError) {
      const response = NextResponse.json({ success: false, error: error.message, code: error.code }, { status: error.status });
      if (error.retryAfter) response.headers.set('Retry-After', String(error.retryAfter));
      return response;
    }
    return NextResponse.json({ success: false, error: 'Review-link generation is temporarily unavailable.' }, { status: 503 });
  }
}
