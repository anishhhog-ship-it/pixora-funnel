import { getSupabaseAdminClient } from '@/lib/supabase/server';
import { decryptToken } from '@/lib/encryption';

export interface GoogleAuthResult {
  success: boolean;
  accessToken?: string;
  accountId?: string | null;
  locationId?: string | null;
  error?: string;
  statusCode?: number;
}

/**
 * Retrieves a valid, fresh Google OAuth Access Token for a tenant's business.
 * Automatically exchanges the stored encrypted refresh token.
 * Strictly executes on server-side.
 */
export async function getValidGoogleToken(businessId: string): Promise<GoogleAuthResult> {
  if (!businessId) {
    return { success: false, error: 'Business ID is required', statusCode: 400 };
  }

  const clientId = process.env.GOOGLE_CLIENT_ID || '';
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || '';

  if (!clientId || !clientSecret) {
    return {
      success: false,
      error: 'Google OAuth credentials (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET) not configured in server environment.',
      statusCode: 503,
    };
  }

  try {
    const supabaseAdmin = getSupabaseAdminClient();
    const { data: conn, error: connError } = await supabaseAdmin
      .from('google_connections')
      .select('*')
      .eq('business_id', businessId)
      .maybeSingle();

    if (connError || !conn) {
      return { success: false, error: 'No Google Business Profile connection found for this business.', statusCode: 404 };
    }

    if (conn.status === 'disconnected') {
      return { success: false, error: 'Google Business Profile is disconnected.', statusCode: 400 };
    }

    if (!conn.encrypted_refresh_token) {
      return {
        success: false,
        error: 'No refresh token stored. Re-authorization required.',
        statusCode: 401,
      };
    }

    const refreshToken = decryptToken(conn.encrypted_refresh_token);
    if (!refreshToken) {
      return {
        success: false,
        error: 'Failed to decrypt refresh token. Reconnection required.',
        statusCode: 500,
      };
    }

    // Call Google OAuth Token Endpoint to exchange refresh token for fresh access token
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    const tokenData = await tokenRes.json();

    if (!tokenRes.ok) {
      if (tokenData.error === 'invalid_grant') {
        // User revoked access or token expired
        await supabaseAdmin
          .from('google_connections')
          .update({ status: 'expired', updated_at: new Date().toISOString() })
          .eq('business_id', businessId);

        return {
          success: false,
          error: 'Google authorization has expired or was revoked. Please reconnect your Google profile.',
          statusCode: 401,
        };
      }

      return {
        success: false,
        error: tokenData.error_description || tokenData.error || 'Failed to refresh Google access token',
        statusCode: tokenRes.status,
      };
    }

    return {
      success: true,
      accessToken: tokenData.access_token,
      accountId: conn.google_account_id,
      locationId: conn.google_location_id,
    };
  } catch (err: any) {
    console.error('Error getting valid Google token for business:', businessId, err);
    return {
      success: false,
      error: err.message || 'Internal error retrieving Google access token',
      statusCode: 500,
    };
  }
}
