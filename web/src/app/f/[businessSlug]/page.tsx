'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star, Zap, Bot, Clock, ShieldCheck, ArrowRight, UtensilsCrossed, Smartphone, Sparkles } from 'lucide-react';
import { businessService, menuService, analyticsService, normalizeBusinessCategory, getCatalogTerminology } from '@/services';
import { Business, MenuItem } from '@/types';
import { useParams } from 'next/navigation';

export default function BusinessLandingPage() {
  const router = useRouter();
  const routeParams = useParams();
  const businessSlug = (routeParams?.businessSlug as string) || 'your-business';
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [business, setBusiness] = useState<Business | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  
  const terminology = getCatalogTerminology(business?.category);

  useEffect(() => {
    analyticsService.trackEvent('landing_view', { slug: businessSlug });
    let isActive = true;

    Promise.resolve().then(() => {
      if (isActive) {
        setIsLoading(true);
        setLoadError(false);
      }
      const saved = sessionStorage.getItem('temp_rating');
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed > 0 && parsed <= 5) {
          setRating(parsed);
        }
      }
    });

    businessService.getBusinessBySlug(businessSlug)
      .then(async (result) => {
        if (!isActive || !result) return;
        setBusiness(result);
        try {
          const items = await menuService.getItems(result.businessId);
          if (isActive) setMenuItems(items.filter(i => i.isLive !== false));
        } catch (e) {
          console.warn('Could not load menu items in funnel:', e);
        }
      })
      .catch(() => {
        if (isActive) setLoadError(true);
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [businessSlug]);

  const handleContinue = () => {
    if (rating > 0) {
      analyticsService.trackEvent('rating_selected', { rating });
      sessionStorage.setItem('temp_rating', rating.toString());
      if (rating <= 3) {
        router.push(`/f/${businessSlug}/feedback?rating=${rating}`);
      } else {
        router.push(`/f/${businessSlug}/review?rating=${rating}`);
      }
    }
  };

  const primaryColor = business?.theme?.primaryColor || '#0B3D2E';
  const categoryConfig = normalizeBusinessCategory(business?.category);

  const getRatingFeedback = (val: number) => {
    switch (val) {
      case 5:
        return { label: 'Outstanding Experience!', sub: 'Ready for 1-click Google review', badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
      case 4:
        return { label: 'Very Good Experience!', sub: 'Ready for 1-click Google review', badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
      case 3:
        return { label: 'Average / Fair Visit', sub: 'Help us improve with private feedback', badgeColor: 'bg-amber-50 text-amber-800 border-amber-200' };
      case 2:
        return { label: 'Below Expectations', sub: 'Direct private message to the owner', badgeColor: 'bg-orange-50 text-orange-800 border-orange-200' };
      case 1:
        return { label: 'Unsatisfactory', sub: 'Direct private resolution guaranteed', badgeColor: 'bg-rose-50 text-rose-800 border-rose-200' };
      default:
        return null;
    }
  };

  const activeRating = hoverRating || rating;
  const ratingFeedback = activeRating > 0 ? getRatingFeedback(activeRating) : null;

  if (isLoading) {
    return (
      <div className="mx-auto flex w-full max-w-sm flex-col gap-4" role="status" aria-live="polite">
        <div className="space-y-3 text-center">
          <div className="mx-auto h-8 w-3/4 rounded-full bg-white/20 funnel-skeleton" />
          <div className="mx-auto h-3 w-2/3 rounded-full bg-white/15 funnel-skeleton" />
        </div>
        <div className="rounded-[28px] border border-white/20 bg-white/90 p-6 shadow-2xl backdrop-blur-md">
          <div className="mx-auto mb-6 h-12 w-12 rounded-full bg-slate-200 funnel-skeleton" />
          <div className="mb-3 h-3 rounded-full bg-slate-200 funnel-skeleton" />
          <div className="mb-7 h-10 rounded-full bg-slate-100 funnel-skeleton" />
          <div className="h-12 rounded-full bg-slate-200 funnel-skeleton" />
          <span className="sr-only">Loading this business&apos;s review page…</span>
        </div>
      </div>
    );
  }

  if (loadError || !business) {
    return (
      <div className="mx-auto w-full max-w-sm rounded-[28px] border border-white/20 bg-white/95 p-7 text-center text-slate-900 shadow-2xl backdrop-blur-md" role="alert">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
          <ShieldCheck className="h-6 w-6" aria-hidden="true" />
        </div>
        <h2 className="font-serif text-2xl font-bold">This page is unavailable</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          We could not load this business&apos;s public experience right now. Please try the link again in a moment.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col items-center gap-1 animate-in fade-in slide-in-from-bottom-3 duration-500">
      
      {/* ── Main Question Title & Subtitle ── */}
      <div className="mb-6 max-w-[320px] text-center text-white">
        <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/20 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/80 backdrop-blur-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-[#D4AF37]" aria-hidden="true" />
          Your experience matters
        </div>
        <h2 
          className="font-serif text-3xl font-bold leading-tight tracking-tight text-[#FAF5EB] sm:text-4xl"
          style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
        >
          {categoryConfig.headline}
        </h2>
        <p className="text-xs font-light leading-relaxed text-stone-200/90 sm:text-sm">
          {categoryConfig.subheadline}
        </p>
      </div>

      {/* ── Central White Review Card (Exact Reference Screenshot Layout) ── */}
      <Card className="mb-5 w-full rounded-[28px] border border-white/70 bg-white/95 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.24)] backdrop-blur-md sm:p-7">
        
        {/* Google 'G' Logo Badge */}
        <div className="flex justify-center mb-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-gray-100 bg-white shadow-md">
            <svg viewBox="0 0 24 24" width="26" height="26">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.31-1.03 2.41-2.16 3.16v2.62h3.49c2.04-1.89 3.22-4.67 3.22-7.79z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.49-2.62c-.98.66-2.23 1.05-3.79 1.05-2.91 0-5.38-1.97-6.26-4.62H2.12v2.71C3.94 20.48 7.68 23 12 23z" fill="#34A853" />
              <path d="M5.74 14.15c-.22-.66-.35-1.36-.35-2.15s.13-1.49.35-2.15V7.14H2.12C1.4 8.59 1 10.25 1 12s.4 3.41 1.12 4.86l3.62-2.71z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.07.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.68 1 3.94 3.52 2.12 7.14l3.62 2.71c.88-2.65 3.35-4.47 6.26-4.47z" fill="#EA4335" />
            </svg>
          </div>
        </div>

        {/* 5 Outline / Filled Gold Stars */}
        <div className="mb-4 flex justify-center gap-2" role="group" aria-label="Select a rating">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              className={`funnel-focus-ring cursor-pointer rounded-xl p-1.5 transition-all duration-200 hover:scale-115 active:scale-95 ${
                star <= (hoverRating || rating) ? 'scale-105' : 'opacity-85 hover:opacity-100'
              }`}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => setRating(star)}
              aria-label={`Rate ${star} stars`}
              aria-pressed={rating === star}
            >
              <Star
                className={`h-9 w-9 transition-all duration-200 sm:h-10 sm:w-10 ${
                  star <= (hoverRating || rating)
                    ? 'fill-[#F4B400] text-[#F4B400] drop-shadow-[0_4px_12px_rgba(244,180,0,0.45)]'
                    : 'text-[#E5A812] stroke-[#E5A812] fill-transparent hover:text-[#F4B400]'
                }`}
                strokeWidth={1.8}
              />
            </button>
          ))}
        </div>

        {/* Dynamic Rating Feedback Badge */}
        {ratingFeedback ? (
          <div className="mb-5 flex flex-col items-center animate-in fade-in duration-200">
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold shadow-xs ${ratingFeedback.badgeColor}`}>
              <span>{'★'.repeat(activeRating)}</span>
              <span>{ratingFeedback.label}</span>
            </span>
            <span className="mt-1 text-[11px] font-medium text-stone-500">
              {ratingFeedback.sub}
            </span>
          </div>
        ) : (
          <div className="mb-5 text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs font-medium text-stone-600">
              <span>Tap a star to rate your visit</span>
            </span>
          </div>
        )}

        {/* Pill Continue Button */}
        <Button 
          className="funnel-focus-ring h-13 w-full cursor-pointer rounded-full text-base font-semibold text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-40"
          style={{ 
            backgroundColor: rating > 0 ? primaryColor : '#0B3D2E',
            boxShadow: rating > 0 ? `0 14px 30px -8px ${primaryColor}99` : undefined
          }}
          size="lg"
          disabled={rating === 0}
          onClick={handleContinue}
        >
          <span>
            {rating === 5 ? 'Continue with 5 Stars' : rating > 0 ? `Continue with ${rating} Stars` : 'Select rating to continue'}
          </span>
          <span className="ml-2 font-bold">→</span>
        </Button>

        {/* 3 Circular Micro-Features */}
        <div className="mt-7 grid grid-cols-3 gap-2 border-t border-gray-100 pt-5 text-center">
          <div className="flex flex-col items-center">
            <div className="mx-auto mb-1.5 flex h-8 w-8 items-center justify-center rounded-full border border-[#FED7AA]/50 bg-[#FFF7ED] shadow-sm">
              <Zap className="w-4 h-4 text-[#D97706]" />
            </div>
            <span className="text-[11px] font-semibold leading-tight text-gray-800">Quick<br/>&amp; easy</span>
          </div>

          <div className="flex flex-col items-center">
            <div className="mx-auto mb-1.5 flex h-8 w-8 items-center justify-center rounded-full border border-[#FED7AA]/50 bg-[#FFF7ED] shadow-sm">
              <Bot className="w-4 h-4 text-[#D97706]" />
            </div>
            <span className="text-[11px] font-semibold leading-tight text-gray-800">Writing<br/>support</span>
          </div>

          <div className="flex flex-col items-center">
            <div className="mx-auto mb-1.5 flex h-8 w-8 items-center justify-center rounded-full border border-[#FED7AA]/50 bg-[#FFF7ED] shadow-sm">
              <Clock className="w-4 h-4 text-[#D97706]" />
            </div>
            <span className="text-[11px] font-semibold leading-tight text-gray-800">Private<br/>feedback path</span>
          </div>
        </div>
      </Card>

      {/* ── Client Portal Catalogue / Menu Integration ── */}
      {business?.theme?.menuEnabled !== false && (
        <div className="mb-4 w-full rounded-3xl border border-white/60 bg-white/95 p-4 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-amber-100 text-xs font-bold text-amber-800">
                ✨
              </div>
              <div>
                <p className="font-bold text-gray-900 text-xs leading-tight">
                  {terminology.isFood ? 'Live Digital Menu' : 'Live Product & Service Catalogue'}
                </p>
                <p className="text-[10px] text-gray-500 font-normal">
                  {menuItems.length > 0 ? `${menuItems.length} items & offerings listed` : 'Explore prices, photos & specials'}
                </p>
              </div>
            </div>
            <Link 
              href={`/f/${businessSlug}/menu`}
              className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-[#0B3D2E] hover:bg-emerald-100 transition-colors"
            >
              View All <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {/* Quick Preview Chips of Real Items Added by Client Portal */}
          {menuItems.length > 0 && (
            <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-gray-100">
              {menuItems.slice(0, 2).map((item) => (
                <Link
                  key={item.itemId}
                  href={`/f/${businessSlug}/menu`}
                  className="flex items-center gap-2 p-2 rounded-xl bg-stone-50 hover:bg-stone-100 transition-colors border border-stone-200/60"
                >
                  <img
                    src={item.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100&h=100&fit=crop'}
                    alt={item.name}
                    className="w-10 h-10 rounded-lg object-cover shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold text-gray-900 truncate leading-tight">{item.name}</p>
                    <p className="text-[10px] font-bold text-[#0B3D2E]">₹{item.price}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Direct Homescreen Quick Action */}
          <div className="mt-2.5 pt-2 border-t border-dashed border-gray-200 flex items-center justify-between text-[10px] text-gray-500">
            <span className="flex items-center gap-1 text-[#0B3D2E] font-medium">
              <Smartphone className="w-3.5 h-3.5" /> Save to mobile home screen
            </span>
            <Link 
              href={`/f/${businessSlug}/menu`}
              className="font-bold text-[#0B3D2E] hover:underline"
            >
              Open Menu →
            </Link>
          </div>
        </div>
      )}

      {/* ── Happy Customers Banner (Matches Reference Screenshot) ── */}
      <div className="mb-2 flex w-full items-center gap-3 rounded-[26px] border border-[#D1E0D9]/80 bg-[#EAF2EC]/95 p-3.5 shadow-lg backdrop-blur-md">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#D7E8DE]">
          <ShieldCheck className="h-4 w-4 text-[#0B3D2E]" aria-hidden="true" />
        </div>
        <div className="min-w-0 text-left">
          <p className="text-xs font-bold leading-tight text-gray-900">A direct line to this business</p>
          <p className="mt-0.5 truncate text-[11px] text-gray-600">Share what went well or what could be better.</p>
        </div>
      </div>

    </div>
  );
}
