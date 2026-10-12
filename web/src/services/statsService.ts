export interface PlatformStats {
  demosProvided: number;     // Starting baseline: 581
  liveFunnels: number;       // Starting baseline: 499
  reviewsDelivered: number;  // Starting baseline: 43,892
  autoRepliesSent: number;   // Starting baseline: 37,640
  lastUpdated: string;
}

const STATS_STORAGE_KEY = 'pixora_platform_live_stats';
const STATS_UPDATE_EVENT = 'pixora_stats_updated';

export const BASELINE_STATS: PlatformStats = {
  demosProvided: 581,
  liveFunnels: 499,
  reviewsDelivered: 43892,
  autoRepliesSent: 37640,
  lastUpdated: '2025-01-01T00:00:00.000Z',
};

const isBrowser = typeof window !== 'undefined';

function loadStoredStats(): PlatformStats {
  if (!isBrowser) return { ...BASELINE_STATS };
  try {
    const raw = localStorage.getItem(STATS_STORAGE_KEY);
    if (!raw) return { ...BASELINE_STATS };
    const parsed = JSON.parse(raw);
    return {
      demosProvided: Math.max(BASELINE_STATS.demosProvided, Number(parsed.demosProvided) || BASELINE_STATS.demosProvided),
      liveFunnels: Math.max(BASELINE_STATS.liveFunnels, Number(parsed.liveFunnels) || BASELINE_STATS.liveFunnels),
      reviewsDelivered: Math.max(BASELINE_STATS.reviewsDelivered, Number(parsed.reviewsDelivered) || BASELINE_STATS.reviewsDelivered),
      autoRepliesSent: Math.max(BASELINE_STATS.autoRepliesSent, Number(parsed.autoRepliesSent) || BASELINE_STATS.autoRepliesSent),
      lastUpdated: parsed.lastUpdated || new Date().toISOString(),
    };
  } catch {
    return { ...BASELINE_STATS };
  }
}

function saveStats(stats: PlatformStats): void {
  if (!isBrowser) return;
  try {
    localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(stats));
    window.dispatchEvent(new CustomEvent(STATS_UPDATE_EVENT, { detail: stats }));
  } catch (err) {
    console.error('Failed to save platform stats', err);
  }
}

export const statsService = {
  getStats: (): PlatformStats => {
    return loadStoredStats();
  },

  /**
   * Called whenever a user starts a demo / free trial from onboarding, signup, or CTA strip.
   */
  recordTrialStarted: (increment: number = 1): PlatformStats => {
    const current = loadStoredStats();
    const updated: PlatformStats = {
      ...current,
      demosProvided: current.demosProvided + increment,
      reviewsDelivered: current.reviewsDelivered + Math.floor(increment * 6),
      autoRepliesSent: current.autoRepliesSent + Math.floor(increment * 5),
      lastUpdated: new Date().toISOString(),
    };
    saveStats(updated);
    return updated;
  },

  /**
   * Called whenever an admin activates a dashboard/business from the admin panel.
   */
  recordDashboardActivated: (increment: number = 1): PlatformStats => {
    const current = loadStoredStats();
    const updated: PlatformStats = {
      ...current,
      liveFunnels: current.liveFunnels + increment,
      reviewsDelivered: current.reviewsDelivered + Math.floor(increment * 38),
      autoRepliesSent: current.autoRepliesSent + Math.floor(increment * 32),
      lastUpdated: new Date().toISOString(),
    };
    saveStats(updated);
    return updated;
  },

  /**
   * Called whenever a review is delivered to Google.
   */
  recordReviewDelivered: (increment: number = 1): PlatformStats => {
    const current = loadStoredStats();
    const updated: PlatformStats = {
      ...current,
      reviewsDelivered: current.reviewsDelivered + increment,
      autoRepliesSent: current.autoRepliesSent + increment,
      lastUpdated: new Date().toISOString(),
    };
    saveStats(updated);
    return updated;
  },

  /**
   * Called whenever an AI automated reply is dispatched.
   */
  recordAutoReplySent: (increment: number = 1): PlatformStats => {
    const current = loadStoredStats();
    const updated: PlatformStats = {
      ...current,
      autoRepliesSent: current.autoRepliesSent + increment,
      lastUpdated: new Date().toISOString(),
    };
    saveStats(updated);
    return updated;
  },

  /**
   * Subscribe to real-time stats updates across components or tabs.
   */
  subscribe: (callback: (stats: PlatformStats) => void): (() => void) => {
    if (!isBrowser) return () => {};

    const handleCustomEvent = (e: Event) => {
      const custom = e as CustomEvent<PlatformStats>;
      if (custom.detail) {
        callback(custom.detail);
      } else {
        callback(loadStoredStats());
      }
    };

    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === STATS_STORAGE_KEY) {
        callback(loadStoredStats());
      }
    };

    window.addEventListener(STATS_UPDATE_EVENT, handleCustomEvent);
    window.addEventListener('storage', handleStorageEvent);

    return () => {
      window.removeEventListener(STATS_UPDATE_EVENT, handleCustomEvent);
      window.removeEventListener('storage', handleStorageEvent);
    };
  },
};
