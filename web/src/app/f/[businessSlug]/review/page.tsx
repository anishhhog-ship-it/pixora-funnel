'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function ReviewRedirectPage() {
  const router = useRouter();
  const routeParams = useParams();
  const businessSlug = (routeParams?.businessSlug as string) || 'your-business';

  useEffect(() => {
    // Forward query params if any
    const search = typeof window !== 'undefined' ? window.location.search : '';
    router.replace(`/f/${businessSlug}${search}`);
  }, [businessSlug, router]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center p-4">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
    </div>
  );
}
