import { NextRequest, NextResponse } from 'next/server';
import { signOAuthState } from '@/lib/encryption';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const businessId = searchParams.get('businessId');
    const returnUrl = searchParams.get('returnUrl') || '/dashboard/settings';

    if (!businessId) {
      return NextResponse.json(
        { success: false, error: 'Missing businessId parameter for Google Business Profile connection' },
        { status: 400 }
      );
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      // If client credentials are not yet entered in environment, redirect cleanly with informative parameter
      const targetUrl = new URL(returnUrl, req.nextUrl.origin);
      targetUrl.searchParams.set('google_status', 'credentials_missing');
      targetUrl.searchParams.set('google_message', 'Google OAuth 2.0 Client ID is not configured in server environment.');
      return NextResponse.redirect(targetUrl.toString());
    }

    const defaultRedirect = `${req.nextUrl.origin}/api/google/callback`;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || defaultRedirect;

    // Sign the OAuth state with HMAC to prevent tampering and CSRF
    const statePayload = {
      businessId,
      returnUrl,
      timestamp: Date.now(),
    };
    const state = signOAuthState(statePayload);

    // Build Google OAuth 2.0 authorization URL with mandatory Business Profile management scope
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set(
      'scope',
      'https://www.googleapis.com/auth/business.manage openid email profile'
    );
    authUrl.searchParams.set('access_type', 'offline');
    authUrl.searchParams.set('prompt', 'consent');
    authUrl.searchParams.set('include_granted_scopes', 'true');
    authUrl.searchParams.set('state', state);

    return NextResponse.redirect(authUrl.toString());
  } catch (error: any) {
    console.error('Error initiating Google OAuth:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to initiate Google OAuth' },
      { status: 500 }
    );
  }
}
