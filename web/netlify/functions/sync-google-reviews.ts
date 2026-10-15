/**
 * Netlify-owned worker for the authorized Google Business Profile review sync.
 * It never receives Google credentials. The Next.js route resolves the stored
 * encrypted refresh tokens and calls Google's official Business Profile API.
 */
export const handler = async () => {
  const siteUrl = (process.env.URL || process.env.DEPLOY_PRIME_URL || process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '');
  const syncSecret = process.env.NETLIFY_REVIEW_SYNC_SECRET;

  if (!siteUrl || !syncSecret) {
    console.error('Google review scheduled sync is missing server configuration.');
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: 'Scheduled sync is not configured.' }),
    };
  }

  try {
    const response = await fetch(`${siteUrl}/api/google/reviews/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-pixora-cron-secret': syncSecret,
      },
      body: JSON.stringify({ syncAll: true, pageSize: 50 }),
    });

    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.success) {
      console.error('Google review scheduled sync failed.', { status: response.status, businesses: result.businesses });
      return {
        statusCode: response.ok ? 500 : response.status,
        body: JSON.stringify({ success: false, error: 'Review sync failed.', businesses: result.businesses || 0 }),
      };
    }

    console.log('Google review scheduled sync completed.', {
      businesses: result.businesses || 0,
      syncedCount: result.syncedCount || 0,
    });
    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, businesses: result.businesses || 0, syncedCount: result.syncedCount || 0 }),
    };
  } catch (error) {
    console.error('Google review scheduled sync request failed.', error instanceof Error ? error.message : 'unknown error');
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: 'Review sync request failed.' }),
    };
  }
};
