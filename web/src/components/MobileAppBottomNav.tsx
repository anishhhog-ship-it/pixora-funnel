'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Play, Tag, Plus, Download, User, Sparkles } from 'lucide-react';
import { triggerPwaInstall } from '@/components/PwaInstallPrompt';
import { smoothScrollTo } from '@/lib/scrollUtils';
import { authService } from '@/services';

interface MobileAppBottomNavProps {
  onOpenDemo?: () => void;
}

export default function MobileAppBottomNav({ onOpenDemo }: MobileAppBottomNavProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(authService.isAuthenticated());
  }, []);

  return (
    <nav 
      aria-label="Mobile Bottom Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200/90 shadow-[0_-8px_30px_rgba(15,23,42,0.08)] px-2 pt-1 pb-[calc(0.4rem+env(safe-area-inset-bottom,0px))]"
    >
      <div className="grid grid-cols-5 items-center justify-between max-w-md mx-auto relative">
        
        {/* OPTION 1: Watch Demo */}
        <button
          type="button"
          onClick={onOpenDemo}
          className="flex flex-col items-center justify-center py-1 rounded-xl text-slate-600 hover:text-blue-600 active:scale-90 transition-all cursor-pointer group"
          title="Watch Interactive Live Demo"
        >
          <div className="w-8 h-8 rounded-full bg-slate-100/90 group-hover:bg-blue-50 flex items-center justify-center text-slate-700 group-hover:text-blue-600 transition-colors">
            <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
          </div>
          <span className="text-[10px] font-semibold mt-0.5 text-slate-600 group-hover:text-blue-600 transition-colors">
            Demo
          </span>
        </button>

        {/* OPTION 2: Lifetime Pricing */}
        <button
          type="button"
          onClick={() => smoothScrollTo('#pricing')}
          className="flex flex-col items-center justify-center py-1 rounded-xl text-slate-600 hover:text-blue-600 active:scale-90 transition-all cursor-pointer group"
          title="Jump to Pricing Plans"
        >
          <div className="w-8 h-8 rounded-full bg-slate-100/90 group-hover:bg-blue-50 flex items-center justify-center text-slate-700 group-hover:text-blue-600 transition-colors relative">
            <Tag className="w-3.5 h-3.5" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" />
          </div>
          <span className="text-[10px] font-semibold mt-0.5 text-slate-600 group-hover:text-blue-600 transition-colors">
            Pricing
          </span>
        </button>

        {/* OPTION 3 (CENTER): CREATE FUNNEL + (Elevated Action Button) */}
        <div className="flex flex-col items-center justify-center -mt-6 z-10">
          <Link
            href="/onboarding"
            className="group relative flex items-center justify-center active:scale-95 transition-all"
            title="Create Review Funnel for Your Business"
            aria-label="Create Review Funnel"
          >
            {/* Ambient Animated Glow */}
            <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 blur-sm opacity-60 group-hover:opacity-100 animate-pulse transition-opacity" />

            {/* Main Center Floating Circular Button */}
            <div className="relative w-14 h-14 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/35 ring-4 ring-white group-hover:scale-105 transition-transform">
              <Plus className="w-6 h-6 stroke-[3] transition-transform group-hover:rotate-90 duration-300" />
              
              {/* Mini Top Sparkle Indicator */}
              <Sparkles className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 text-amber-300 animate-bounce" />
            </div>
          </Link>
          <span className="text-[10px] font-extrabold text-blue-600 mt-1 tracking-tight text-center whitespace-nowrap">
            Create Funnel +
          </span>
        </div>

        {/* OPTION 4: Install PWA */}
        <button
          type="button"
          onClick={() => triggerPwaInstall()}
          className="flex flex-col items-center justify-center py-1 rounded-xl text-slate-600 hover:text-emerald-700 active:scale-90 transition-all cursor-pointer group"
          title="Install Pixora Funnel App on Phone"
        >
          <div className="w-8 h-8 rounded-full bg-emerald-50/80 group-hover:bg-emerald-100 flex items-center justify-center text-emerald-700 transition-colors">
            <Download className="w-3.5 h-3.5" />
          </div>
          <span className="text-[10px] font-semibold mt-0.5 text-slate-600 group-hover:text-emerald-700 transition-colors">
            Install
          </span>
        </button>

        {/* OPTION 5: Account / Login */}
        <Link
          href={isLoggedIn ? '/dashboard' : '/login'}
          className="flex flex-col items-center justify-center py-1 rounded-xl text-slate-600 hover:text-slate-900 active:scale-90 transition-all group"
          title={isLoggedIn ? 'Client Dashboard' : 'Client Portal Login'}
        >
          <div className="w-8 h-8 rounded-full bg-slate-100/90 group-hover:bg-slate-200 flex items-center justify-center text-slate-700 group-hover:text-slate-900 transition-colors">
            <User className="w-3.5 h-3.5" />
          </div>
          <span className="text-[10px] font-semibold mt-0.5 text-slate-600 group-hover:text-slate-900 transition-colors">
            {isLoggedIn ? 'Portal' : 'Login'}
          </span>
        </Link>

      </div>
    </nav>
  );
}
