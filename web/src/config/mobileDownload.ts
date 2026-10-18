import { PLATFORM_CONFIG } from '@/config/env';

export type MobilePlatform = 'android' | 'ios';

function readConfiguredUrl(...keys: string[]): string | null {
  for (const key of keys) {
    const value = process.env[key]?.trim();

    if (!value) {
      continue;
    }

    try {
      const url = new URL(value);

      if (url.protocol === 'https:' || url.protocol === 'http:') {
        return url.toString();
      }
    } catch {
      // Treat invalid values as unconfigured so the page never renders a dead link.
    }
  }

  return null;
}

const version = process.env.NEXT_PUBLIC_MOBILE_APP_VERSION?.trim() || '1.0.0';

export const MOBILE_DOWNLOAD_CONFIG = {
  appName: PLATFORM_CONFIG.appName,
  version,
  android: {
    platform: 'android' as const,
    packageId: process.env.NEXT_PUBLIC_ANDROID_PACKAGE_ID?.trim() || 'com.pixora.funnel',
    url: readConfiguredUrl('NEXT_PUBLIC_ANDROID_DOWNLOAD_URL'),
  },
  ios: {
    platform: 'ios' as const,
    bundleId: process.env.NEXT_PUBLIC_IOS_BUNDLE_ID?.trim() || 'com.pixora.funnel',
    url: readConfiguredUrl('NEXT_PUBLIC_IOS_STORE_URL', 'NEXT_PUBLIC_IOS_DOWNLOAD_URL'),
  },
} satisfies {
  appName: string;
  version: string;
  android: { platform: 'android'; packageId: string; url: string | null };
  ios: { platform: 'ios'; bundleId: string; url: string | null };
};
