'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { businessService, analyticsService, normalizeBusinessCategory } from '@/services';
import { Business } from '@/types';
import { Check, Utensils, Leaf, Users, Heart } from 'lucide-react';

export default function ThankYouPage() {
  const router = useRouter();
  const routeParams = useParams();
  const businessSlug = (routeParams?.businessSlug as string) || 'your-business';
  const [business, setBusiness] = useState<Business | null>(null);

  useEffect(() => {
    analyticsService.trackEvent('thank_you_view', { slug: businessSlug });
    businessService.getBusinessBySlug(businessSlug).then(setBusiness);
  }, [businessSlug]);

  if (!business) return null;

  const categoryConfig = normalizeBusinessCategory(business.category);
  const primaryColor = business?.theme?.primaryColor || categoryConfig.defaultPrimaryColor || '#0B3D2E';
  const businessName = business?.name || 'Your Business';

  return (
    <div className="flex flex-col items-center justify-center animate-in fade-in duration-500 h-full w-full max-w-sm mx-auto relative z-10 pt-4 pb-8">
      
      <div className="bg-[#FAF7F2]/98 backdrop-blur-md rounded-[32px] p-6 sm:p-8 shadow-2xl w-full flex flex-col items-center text-center border border-white/40">
        
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
          className="w-full text-base font-semibold shadow-lg text-white rounded-full h-13 mb-6 transition-all duration-300 cursor-pointer"
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
            { label: 'Authentic Taste', icon: 'Utensils' },
            { label: 'Warm Ambience', icon: 'Heart' },
            { label: 'Attentive Service', icon: 'Sparkles' },
          ]).map((feat: { label: string; icon: string }, idx: number) => (
            <div key={idx} className="flex flex-col items-center text-center">
              <div className="w-9 h-9 rounded-full bg-[#FFF7ED] flex items-center justify-center mb-1.5 border border-[#FED7AA]/60">
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
