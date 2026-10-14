'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function PublicDemoRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const slug = (params?.slug as string) || '';

  useEffect(() => {
    if (slug) {
      // Clean up demo- prefix if present so it lands on the real customer funnel
      router.replace(`/f/${slug}`);
    }
  }, [slug, router]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white text-xs font-mono">
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
        <span>Loading...</span>
      </div>
    </div>
  );
}
