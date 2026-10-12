'use client';

import { useState, useEffect } from 'react';
import LandingPageClient from '@/components/LandingPageClient';

/**
 * Client-side mounted wrapper for LandingPageClient.
 * Ensures the landing page mounts cleanly on the client without hydration mismatches
 * from third-party browser extensions (e.g. Bitdefender, Best Image Search injecting bis_skin_checked).
 */
export default function LandingPageWrapper() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        suppressHydrationWarning
        className="min-h-screen bg-white"
        aria-hidden="true"
      />
    );
  }

  return <LandingPageClient />;
}
