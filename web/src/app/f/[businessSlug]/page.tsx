'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star, Zap, Bot, Clock, TrendingUp } from 'lucide-react';
import { businessService, analyticsService, normalizeBusinessCategory, getCatalogTerminology } from '@/services';
import { Business } from '@/types';
import { useParams } from 'next/navigation';

export default function BusinessLandingPage() {
  const router = useRouter();
  const routeParams = useParams();
  const businessSlug = (routeParams?.businessSlug as string) || 'your-business';
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [business, setBusiness] = useState<Business | null>(null);
  
  const terminology = getCatalogTerminology(business?.category);

  useEffect(() => {
    analyticsService.trackEvent('landing_view', { slug: businessSlug });
    businessService.getBusinessBySlug(businessSlug).then(setBusiness);
  }, [businessSlug]);

  const handleContinue = () => {
    if (rating > 0) {
      analyticsService.trackEvent('rating_selected', { rating });
      sessionStorage.setItem('temp_rating', rating.toString());
      if (rating <= 3) {
        router.push(`/f/${businessSlug}/feedback`);
      } else {
        router.push(`/f/${businessSlug}/review`);
      }
    }
  };

  const primaryColor = business?.theme?.primaryColor || '#0B3D2E';
  const secondaryColor = business?.theme?.secondaryColor || '#D4AF37';
  const businessName = business?.name || 'Your Business';
  const catConfig = business?.category ? businessService : null; // check
  const categoryConfig = normalizeBusinessCategory(business?.category);

  return (
    <div className="flex flex-col items-center animate-in fade-in slide-in-from-bottom-3 duration-500 w-full max-w-sm mx-auto">
      
      {/* ── Main Question Title & Subtitle ── */}
      <div className="text-center mb-6 text-white max-w-[320px]">
        <h2 
          className="text-3xl sm:text-4xl font-serif font-bold mb-3 leading-tight tracking-tight text-[#FAF5EB]"
          style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
        >
          {categoryConfig.headline}
        </h2>
        <p className="text-xs sm:text-sm text-stone-200/90 leading-relaxed font-light">
          {categoryConfig.subheadline}
        </p>
      </div>

      {/* ── Central White Review Card (Exact Reference Screenshot Layout) ── */}
      <Card className="w-full rounded-[28px] p-6 shadow-2xl border-0 mb-6 bg-white/98 backdrop-blur-md">
        
        {/* Google 'G' Logo Badge */}
        <div className="flex justify-center mb-5">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-md border border-gray-100">
            <svg viewBox="0 0 24 24" width="26" height="26">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.31-1.03 2.41-2.16 3.16v2.62h3.49c2.04-1.89 3.22-4.67 3.22-7.79z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.49-2.62c-.98.66-2.23 1.05-3.79 1.05-2.91 0-5.38-1.97-6.26-4.62H2.12v2.71C3.94 20.48 7.68 23 12 23z" fill="#34A853" />
              <path d="M5.74 14.15c-.22-.66-.35-1.36-.35-2.15s.13-1.49.35-2.15V7.14H2.12C1.4 8.59 1 10.25 1 12s.4 3.41 1.12 4.86l3.62-2.71z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.07.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.68 1 3.94 3.52 2.12 7.14l3.62 2.71c.88-2.65 3.35-4.47 6.26-4.47z" fill="#EA4335" />
            </svg>
          </div>
        </div>

        {/* 5 Outline / Filled Gold Stars */}
        <div className="flex justify-center gap-2 mb-6">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              className="focus:outline-hidden transition-transform hover:scale-115 active:scale-125 cursor-pointer p-0.5"
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => setRating(star)}
              aria-label={`Rate ${star} stars`}
            >
              <Star
                className={`w-9 h-9 sm:w-10 sm:h-10 transition-all duration-200 ${
                  star <= (hoverRating || rating)
                    ? 'fill-[#F4B400] text-[#F4B400] drop-shadow-sm'
                    : 'text-[#E5A812] stroke-[#E5A812] fill-transparent hover:text-[#F4B400]'
                }`}
                strokeWidth={1.75}
              />
            </button>
          ))}
        </div>

        {/* Pill Continue Button */}
        <Button 
          className="w-full text-base font-semibold shadow-lg text-white rounded-full h-13 transition-all duration-300 disabled:opacity-50 cursor-pointer"
          style={{ 
            backgroundColor: rating > 0 ? primaryColor : '#0B3D2E',
            boxShadow: rating > 0 ? '0 10px 25px -5px rgba(11, 61, 46, 0.4)' : undefined 
          }}
          size="lg"
          disabled={rating === 0}
          onClick={handleContinue}
        >
          <span>Continue</span>
          <span className="ml-2">→</span>
        </Button>

        {/* 3 Circular Micro-Features */}
        <div className="grid grid-cols-3 gap-1 mt-7 pt-4 border-t border-gray-100 text-center">
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-[#FFF7ED] flex items-center justify-center mb-1.5 shadow-2xs border border-[#FED7AA]/50">
              <Zap className="w-4 h-4 text-[#D97706]" />
            </div>
            <span className="text-[11px] font-semibold text-gray-800 leading-tight">Quick<br/>&amp; Easy</span>
          </div>

          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-[#FFF7ED] flex items-center justify-center mb-1.5 shadow-2xs border border-[#FED7AA]/50">
              <Bot className="w-4 h-4 text-[#D97706]" />
            </div>
            <span className="text-[11px] font-semibold text-gray-800 leading-tight">AI Helps<br/>You Write</span>
          </div>

          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-[#FFF7ED] flex items-center justify-center mb-1.5 shadow-2xs border border-[#FED7AA]/50">
              <Clock className="w-4 h-4 text-[#D97706]" />
            </div>
            <span className="text-[11px] font-semibold text-gray-800 leading-tight">Takes<br/>30 Seconds</span>
          </div>
        </div>
      </Card>

      {/* ── Optional Digital Menu Link (if enabled) ── */}
      {business?.theme?.menuEnabled !== false && (
        <Link 
          href={`/f/${businessSlug}/menu`}
          className="w-full mb-4 bg-white/90 hover:bg-white text-gray-800 rounded-2xl p-3.5 flex items-center justify-between text-xs font-semibold shadow-md border border-white/40 backdrop-blur-md transition-transform hover:scale-[1.01]"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs">
              ✨
            </div>
            <div className="text-left">
              <p className="font-bold text-gray-900 leading-tight">
                {terminology.isFood ? 'View Digital Menu & Specials' : 'View Product & Service Catalogue'}
              </p>
              <p className="text-[10px] text-gray-500 font-normal">
                {terminology.isFood ? 'Explore prices, items & photo gallery' : 'Explore offerings, prices & photo gallery'}
              </p>
            </div>
          </div>
          <span className="font-bold text-xs" style={{ color: primaryColor }}>
            Open →
          </span>
        </Link>
      )}

      {/* ── Happy Customers Banner (Matches Reference Screenshot) ── */}
      <div className="w-full bg-[#EAF2EC]/95 backdrop-blur-md rounded-[26px] p-3.5 flex items-center justify-between shadow-lg border border-[#D1E0D9]/80 mb-2">
        <div className="flex -space-x-2.5 shrink-0">
          <img src="https://i.pravatar.cc/100?u=priya" alt="Customer" className="w-9 h-9 rounded-full border-2 border-white shadow-xs object-cover" />
          <img src="https://i.pravatar.cc/100?u=rohit" alt="Customer" className="w-9 h-9 rounded-full border-2 border-white shadow-xs object-cover" />
          <img src="https://i.pravatar.cc/100?u=karan" alt="Customer" className="w-9 h-9 rounded-full border-2 border-white shadow-xs object-cover" />
        </div>
        <div className="text-left ml-3 flex-grow truncate">
          <p className="font-bold text-xs text-gray-900 leading-tight">Join our happy customers</p>
          <p className="text-[11px] text-gray-600 truncate mt-0.5">Your review helps others choose with confidence.</p>
        </div>
        <div className="w-8 h-8 rounded-full bg-[#D7E8DE] flex items-center justify-center shrink-0 ml-2">
          <TrendingUp className="w-4 h-4 text-[#0B3D2E]" />
        </div>
      </div>

    </div>
  );
}
