'use client';

import dynamic from 'next/dynamic';
import { RefreshCw } from 'lucide-react';

const OnboardingContent = dynamic(() => import('./OnboardingContent'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center bg-stone-50" suppressHydrationWarning>
      <div className="flex items-center gap-2 text-xs font-semibold text-stone-500">
        <RefreshCw className="w-4 h-4 animate-spin text-emerald-700" />
        <span>Loading Smart Business Setup...</span>
      </div>
    </div>
  ),
});

export default function OnboardingPage() {
  return <OnboardingContent />;
}
