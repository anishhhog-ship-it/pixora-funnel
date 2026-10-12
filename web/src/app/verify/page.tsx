'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function VerifyPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/login');
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="text-center space-y-2">
        <p className="text-sm font-semibold text-slate-700">Redirecting to login...</p>
      </div>
    </div>
  );
}
