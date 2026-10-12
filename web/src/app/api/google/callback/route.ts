import { NextRequest, NextResponse } from 'next/server';
import { verifyOAuthState, encryptToken } from '@/lib/encryption';
import { getSupabaseAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const googleError = searchParams.get('error');
  const googleErrorDescription = searchParams.get('error_description');

  let returnUrl = '/dashboard/settings';
  let businessId: string | null = null;

  // 1. Verify and unpack signed OAuth state
  if (state) {
    const statePayload = verifyOAuthState<{ businessId: string; returnUrl?: string; timestamp: number }>(state);
    if (statePayload) {
      businessId = statePayload.businessId;
      if (statePayload.returnUrl) returnUrl = statePayload.returnUrl;
    }
  }

  const redirectTarget = new URL(returnUrl, req.nextUrl.origin);

  // 2. Handle Google-side OAuth errors (e.g. user cancelled)
  if (googleError) {
    redirectTarget.searchParams.set('google_status', 'cancelled');
    redirectTarget.searchParams.set(
      'google_message',
      googleErrorDescription || googleError || 'Google Business authorization was cancelled by the user.'
    );
    return NextResponse.redirect(redirectTarget.toString());
  }

  // 3. Validate state and required parameters
  if (!businessId || !code) {
    redirectTarget.searchParams.set('google_status', 'invalid_request');
    redirectTarget.searchParams.set('google_message', 'Invalid or expired OAuth state or missing authorization code.');
    return NextResponse.redirect(redirectTarget.toString());
  }

  const clientId = process.env.GOOGLE_CLIENT_ID || '';
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || '';
  const defaultRedirect = `${req.nextUrl.origin}/api/google/callback`;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || defaultRedirect;

  if (!clientId || !clientSecret) {
    redirectTarget.searchParams.set('google_status', 'credentials_missing');
    redirectTarget.searchParams.set('google_message', 'Server Google OAuth credentials are not configured.');
    return NextResponse.redirect(redirectTarget.toString());
  }

  // 4. Exchange authorization code for tokens
  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenRes.json();

    if (!tokenRes.ok) {
      console.warn('Google token exchange error:', tokenData);
      redirectTarget.searchParams.set('google_status', 'token_error');
      redirectTarget.searchParams.set(
        'google_message',
        tokenData.error_description || tokenData.error || 'Failed to exchange authorization code for tokens.'
      );
      return NextResponse.redirect(redirectTarget.toString());
    }

    const accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token;
    const grantedScopes = tokenData.scope || '';

    // 5. Verify that the mandatory business.manage scope was granted
    if (!grantedScopes.includes('business.manage')) {
      redirectTarget.searchParams.set('google_status', 'insufficient_scope');
      redirectTarget.searchParams.set(
        'google_message',
        'Google Business Profile management permission was not granted. Please re-authorize and select all requested permissions.'
      );
      return NextResponse.redirect(redirectTarget.toString());
    }

    // 6. Retrieve authorized Google user information
    let accountEmail = '';
    try {
      const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (userInfoRes.ok) {
        const userInfo = await userInfoRes.json();
        accountEmail = userInfo.email || '';
      }
    } catch (e) {
      console.warn('Could not fetch userinfo from Google:', e);
    }

    // 7. Persist connection and encrypted refresh token in Supabase
    const encryptedRefreshToken = refreshToken ? encryptToken(refreshToken) : null;
    const supabaseAdmin = getSupabaseAdminClient();

    // Query existing connection so we don't clear an existing refresh token if Google didn't reissue one
    let finalEncryptedToken = encryptedRefreshToken;
    if (!finalEncryptedToken) {
      const { data: existingConn } = await (supabaseAdmin as any)
        .from('google_connections')
        .select('encrypted_refresh_token')
        .eq('business_id', businessId)
        .maybeSingle();

      if (existingConn?.encrypted_refresh_token) {
        finalEncryptedToken = existingConn.encrypted_refresh_token;
      }
    }

    const { error: dbError } = await (supabaseAdmin as any).from('google_connections').upsert(
      {
        business_id: businessId,
        provider: 'google',
        google_account_id: accountEmail || 'google_business_user',
        status: 'connected',
        scopes: grantedScopes.split(' '),
        connected_at: new Date().toISOString(),
        last_synced_at: new Date().toISOString(),
        encrypted_refresh_token: finalEncryptedToken,
      },
      { onConflict: 'business_id' }
    );

    if (dbError) {
      console.error('Failed to update google_connections in Supabase:', dbError);
    }

    await (supabaseAdmin as any).from('google_integrations').upsert(
      {
        business_id: businessId,
        google_account_id: accountEmail || 'google_business_user',
        status: 'Connected',
        last_synced_at: new Date().toISOString(),
      },
      { onConflict: 'business_id' }
    );

    // 8. Probe Account Management API to verify actual Google API approval status
    let apiApproved = false;
    let approvalMessage = '';

    try {
      const probeRes = await fetch('https://mybusinessaccountmanagement.googleapis.com/v1/accounts', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (probeRes.ok) {
        apiApproved = true;
      } else {
        const probeData = await probeRes.json().catch(() => ({}));
        approvalMessage = probeData.error?.message || 'Access pending or project unapproved';
      }
    } catch (probeErr: any) {
      approvalMessage = probeErr?.message || 'Probe error';
    }

    if (apiApproved) {
      redirectTarget.searchParams.set('google_status', 'connected');
      redirectTarget.searchParams.set('google_approval', 'approved');
      redirectTarget.searchParams.set('google_email', accountEmail);
    } else {
      // Token is valid and stored, but Google Cloud project approval is pending
      redirectTarget.searchParams.set('google_status', 'access_pending');
      redirectTarget.searchParams.set('google_email', accountEmail);
      redirectTarget.searchParams.set(
        'google_message',
        'Google OAuth successful, but Business Profile API access is pending approval for project pixora-funnel-511104.'
      );
    }

    return NextResponse.redirect(redirectTarget.toString());
  } catch (error: any) {
    console.error('Fatal error in Google OAuth callback:', error);
    redirectTarget.searchParams.set('google_status', 'server_error');
    redirectTarget.searchParams.set('google_message', error.message || 'Internal error processing Google OAuth callback.');
    return NextResponse.redirect(redirectTarget.toString());
  }
}
