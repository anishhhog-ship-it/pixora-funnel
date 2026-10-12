'use client';

import dynamic from 'next/dynamic';

const DashboardContent = dynamic(() => import('./DashboardContent'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center" suppressHydrationWarning>
      <div className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin mb-4" />
      <p className="text-sm font-semibold text-slate-600">Loading Dashboard...</p>
    </div>
  ),
});

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardContent>{children}</DashboardContent>;
}
