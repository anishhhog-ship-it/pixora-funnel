'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { businessService, analyticsService, normalizeBusinessCategory } from '@/services';
import { Business } from '@/types';
import { Check, Utensils, Heart } from 'lucide-react';

export default function ThankYouPage() {
  const router = useRouter();
  const routeParams = useParams();
  const businessSlug = (routeParams?.businessSlug as string) || 'your-business';
  const [business, setBusiness] = useState<Business | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    analyticsService.trackEvent('thank_you_view', { slug: businessSlug });
    let isActive = true;
    businessService.getBusinessBySlug(businessSlug)
      .then((result) => {
        if (isActive) setBusiness(result);
      })
      .catch(() => {
        if (isActive) setLoadError(true);
      })
      .finally(() => {
        setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [businessSlug]);

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-sm rounded-[32px] border border-white/30 bg-white/80 p-8 shadow-2xl backdrop-blur-md" role="status" aria-live="polite">
        <div className="mx-auto mb-5 h-20 w-20 rounded-full bg-white/50 funnel-skeleton" />
        <div className="mx-auto mb-3 h-8 w-2/3 rounded-full bg-white/50 funnel-skeleton" />
        <div className="mx-auto h-3 w-4/5 rounded-full bg-white/40 funnel-skeleton" />
        <span className="sr-only">Loading confirmation…</span>
      </div>
    );
  }

  if (loadError || !business) {
    return (
      <div className="mx-auto w-full max-w-sm rounded-[32px] border border-white/40 bg-white/95 p-7 text-center text-slate-900 shadow-2xl backdrop-blur-md" role="alert">
        <h2 className="font-serif text-2xl font-bold">Confirmation unavailable</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">We could not load the business details for this confirmation. You can return to the public page.</p>
        <Button type="button" onClick={() => router.push(`/f/${businessSlug}`)} className="funnel-focus-ring mt-5 h-11 w-full rounded-full text-white">Return to public page</Button>
      </div>
    );
  }

  const categoryConfig = normalizeBusinessCategory(business.category);
  const primaryColor = business?.theme?.primaryColor || categoryConfig.defaultPrimaryColor || '#0B3D2E';
  const businessName = business?.name || 'Your Business';

  return (
    <div className="flex flex-col items-center justify-center animate-in fade-in duration-500 h-full w-full max-w-sm mx-auto relative z-10 pt-4 pb-8">
      
      <div className="flex w-full flex-col items-center rounded-[32px] border border-white/50 bg-[#FAF7F2]/98 p-6 text-center shadow-[0_24px_70px_rgba(0,0,0,0.24)] backdrop-blur-md sm:p-8">
        
        {/* Animated Celebratory Checkmark */}
        <div className="relative mb-5 flex items-center justify-center">
          {/* Confetti rays */}
          <div className="absolute -top-3 left-1 w-1.5 h-4 bg-amber-400 -rotate-45 rounded-full"></div>
          <div className="absolute -top-3 right-1 w-1.5 h-4 bg-emerald-600 rotate-45 rounded-full"></div>
          <div className="absolute top-6 -left-4 w-4 h-1.5 bg-[#0B3D2E] rotate-12 rounded-full"></div>
          <div className="absolute top-6 -right-4 w-4 h-1.5 bg-amber-500 -rotate-12 rounded-full"></div>
          
          <div className="w-20 h-20 bg-[#E8F2EC] rounded-full flex items-center justify-center relative z-10 shadow-inner">
            <Check className="w-10 h-10 text-[#0B3D2E]" strokeWidth={3} />
          </div>
        </div>

        <h2 
          className="text-3xl sm:text-4xl font-serif font-bold text-[#0B3D2E] mb-2 leading-tight"
          style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
        >
          Thank You!
        </h2>
        <p className="text-gray-700 font-medium text-sm sm:text-base mb-6 max-w-[240px] leading-relaxed">
          Your review has been posted on Google.
        </p>

        {/* Heart appreciation highlight box */}
        <div className="bg-[#EBF3EE] rounded-2xl p-4 mb-6 w-full border border-[#D5E5DC]">
           <div className="flex justify-center mb-1.5">
             <Heart className="w-5 h-5 text-[#D4AF37] fill-[#D4AF37]/20" />
           </div>
           <p className="text-xs text-gray-800 font-medium leading-relaxed">
             Your feedback means a lot to us and helps more people discover {businessName}.
           </p>
        </div>

        {/* Action Button: Dynamic Post-Completion CTA */}
        <Button 
           className="funnel-focus-ring mb-6 h-13 w-full cursor-pointer rounded-full text-base font-semibold text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
          style={{ backgroundColor: primaryColor }}
          size="lg"
          onClick={() => {
            if (categoryConfig.menuEnabled && business.theme?.menuEnabled !== false) {
              router.push(`/f/${businessSlug}/menu`);
            } else {
              router.push(`/f/${businessSlug}`);
            }
          }}
        >
          <div className="w-7 h-7 rounded-full border border-white/30 flex items-center justify-center mr-2.5 bg-white/10">
            <Utensils className="w-3.5 h-3.5" />
          </div>
          <span>{categoryConfig.postCompletionCTA || 'View Our Offerings'}</span>
          <span className="ml-1.5">→</span>
        </Button>

        {/* 3 Pillar Category Features */}
        <div className="grid grid-cols-3 gap-2 w-full pt-5 border-t border-gray-200/80">
          {(categoryConfig.footerFeatures || [
             { label: 'Feedback received', icon: 'Check' },
             { label: 'Public choice', icon: 'Heart' },
             { label: 'Thank you', icon: 'Sparkles' },
          ]).map((feat: { label: string; icon: string }, idx: number) => (
            <div key={idx} className="flex flex-col items-center text-center">
               <div className="mb-1.5 flex h-9 w-9 items-center justify-center rounded-full border border-[#FED7AA]/60 bg-[#FFF7ED]">
                <Heart className="w-4 h-4 text-[#8B5E34]" />
              </div>
              <span className="text-[10px] font-semibold text-gray-700 leading-tight">
                {feat.label}
              </span>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
