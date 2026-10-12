'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Star,
  Edit2,
  Info,
  ArrowDown,
  CheckCircle2,
  ChevronLeft,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { businessService, analyticsService } from '@/services';
import { Business } from '@/types';
import Image from 'next/image';

export default function PostOnGooglePage() {
  const router = useRouter();
  const routeParams = useParams();
  const businessSlug = (routeParams?.businessSlug as string) || 'your-business';

  const [reviewText, setReviewText] = useState(
    'Amazing food and wonderful experience at Your Business! The paneer tikka and thali were delicious. The ambience is beautiful and the staff is very polite and welcoming. Will surely visit again!'
  );
  const [rating, setRating] = useState(5);
  const [business, setBusiness] = useState<Business | null>(null);

  // Architecture state
  const [copied, setCopied] = useState(false);
  const [hasTriggeredGoogle, setHasTriggeredGoogle] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const text = sessionStorage.getItem('final_review_text');
    const storedRating = sessionStorage.getItem('temp_rating');
    if (text) setReviewText(text);
    if (storedRating) setRating(parseInt(storedRating));

    businessService.getBusinessBySlug(businessSlug).then(setBusiness);
  }, [businessSlug]);

  /**
   * Robust clipboard copy utility with fallback for mobile webviews & non-HTTPS environments
   */
  const copyToClipboard = async (textToCopy: string): Promise<boolean> => {
    let success = false;
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(textToCopy);
        success = true;
      }
    } catch (err) {
      console.warn('Clipboard writeText failed, trying fallback:', err);
    }

    if (!success && typeof document !== 'undefined') {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = textToCopy;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        textarea.style.left = '-9999px';
        textarea.style.top = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        textarea.setSelectionRange(0, 99999);
        success = document.execCommand('copy');
        document.body.removeChild(textarea);
      } catch (e) {
        console.warn('execCommand fallback copy failed:', e);
      }
    }

    return success;
  };

  /**
   * Resolves the direct Google write-review URL for this business
   */
  const resolveGoogleReviewUrl = (): string => {
    // 1. Explicit review URL stored on business
    if (business?.googleReviewUrl && business.googleReviewUrl.startsWith('http')) {
      return business.googleReviewUrl;
    }

    // 2. Official Google Place ID write-review dialog
    if (business?.googlePlaceId && business.googlePlaceId.startsWith('ChI')) {
      return `https://search.google.com/local/writereview?placeid=${business.googlePlaceId}`;
    }

    // 3. If googlePlaceId contains a full URL
    if (business?.googlePlaceId && business.googlePlaceId.startsWith('http')) {
      return business.googlePlaceId;
    }

    // 4. Default: Google Maps search for this business + city
    const name = business?.name || 'Your Business';
    const city = business?.city || '';
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name} ${city}`.trim())}`;
  };

  /**
   * Manual Copy Click (from review card)
   */
  const handleManualCopy = async () => {
    const ok = await copyToClipboard(reviewText);
    if (ok) {
      setCopied(true);
      setToastMessage('Review copied to clipboard!');
      setTimeout(() => setToastMessage(null), 3500);
      setTimeout(() => setCopied(false), 4000);
    }
  };

  /**
   * Master Google Review Trigger:
   * 1. Copies the selected review text to clipboard
   * 2. Opens the direct Google write-review dialog immediately
   * 3. Activates the on-screen posting assistant
   */
  const handlePost = async () => {
    setIsPosting(true);

    // 1. Copy review text to clipboard
    const ok = await copyToClipboard(reviewText);
    setCopied(true);
    setToastMessage('Review copied to clipboard! Opening Google...');
    setTimeout(() => setToastMessage(null), 4000);

    // 2. Determine target direct Google review interface
    const googleUrl = resolveGoogleReviewUrl();

    // 3. Analytics
    analyticsService.trackEvent('google_clicked', {
      slug: businessSlug,
      rating,
      googleUrl,
      copied: ok,
    });

    // 4. Open Google in a new window immediately in the user gesture
    if (typeof window !== 'undefined') {
      window.open(googleUrl, '_blank', 'noopener,noreferrer');
    }

    // 5. Activate helper screen
    setHasTriggeredGoogle(true);
    setIsPosting(false);
  };

  /**
   * User confirms review has been posted on Google
   */
  const handleFinished = () => {
    analyticsService.trackEvent('experience_submitted', { slug: businessSlug, rating });
    router.push(`/f/${businessSlug}/thank-you`);
  };

  const primaryColor = business?.theme?.primaryColor || '#0B3D2E';
  const businessName = business?.name || 'Your Business';
  const category = business?.category || 'Pure Vegetarian Restaurant';
  const city = business?.city || 'Jaipur';

  return (
    <div className="flex flex-col animate-in fade-in duration-500 pb-10 w-full max-w-sm mx-auto relative z-10">
      
      {/* ── Floating Notification Toast ── */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-3 duration-300">
          <div className="bg-slate-900/95 text-white backdrop-blur-md px-4 py-2.5 rounded-full shadow-2xl border border-white/20 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* ── Top Navigation Bar ── */}
      <div className="flex items-center justify-between mb-4 px-1 text-white">
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-1 text-xs font-semibold text-white/90 hover:text-white bg-black/25 px-2.5 py-1.5 rounded-full border border-white/10 transition cursor-pointer"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>Back</span>
        </button>

        {copied && (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-300 bg-emerald-950/60 border border-emerald-400/30 px-3 py-1 rounded-full">
            <Check className="w-3 h-3 text-emerald-400" />
            <span>Review Copied</span>
          </span>
        )}
      </div>

      {/* ── Stepper Header (1. Your Experience · 2. AI Suggestion · 3. Post on Google) ── */}
      <div className="flex items-center justify-between mb-6 px-3 text-xs font-medium text-white/90">
        <div className="flex flex-col items-center">
          <div className="w-7 h-7 rounded-full bg-white/20 border border-white/60 flex items-center justify-center mb-1 text-white text-[11px] font-bold">
            1
          </div>
          <span className="text-[10px] text-white/80">Your Experience</span>
        </div>
        <div className="h-px bg-white/30 flex-grow mx-2 mt-[-18px]"></div>
        <div className="flex flex-col items-center">
          <div className="w-7 h-7 rounded-full bg-white/20 border border-white/60 flex items-center justify-center mb-1 text-white text-[11px] font-bold">
            2
          </div>
          <span className="text-[10px] text-white/80">AI Suggestion</span>
        </div>
        <div className="h-px bg-white/30 flex-grow mx-2 mt-[-18px]"></div>
        <div className="flex flex-col items-center">
          <div className="w-7 h-7 rounded-full bg-[#0B3D2E] border-2 border-[#D4AF37] flex items-center justify-center mb-1 text-white text-[11px] font-bold shadow-md">
            3
          </div>
          <span className="text-[10px] font-bold text-white">Post on Google</span>
        </div>
      </div>

      {/* ── Main Container Card ── */}
      <div className="bg-[#FAF7F2]/98 backdrop-blur-md rounded-[32px] p-5 sm:p-6 shadow-2xl w-full flex flex-col items-center border border-white/40">
        
        {/* Google G Logo with Confetti Rays */}
        <div className="relative w-16 h-16 mb-2 flex items-center justify-center">
          <div className="absolute -top-1 left-2 w-1 h-3 bg-amber-400 -rotate-30 rounded-full"></div>
          <div className="absolute -top-1 right-2 w-1 h-3 bg-emerald-500 rotate-30 rounded-full"></div>
          <div className="absolute top-4 -left-2 w-3 h-1 bg-rose-500 rotate-15 rounded-full"></div>
          <div className="absolute top-4 -right-2 w-3 h-1 bg-blue-500 -rotate-15 rounded-full"></div>
          
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-md">
            <svg viewBox="0 0 24 24" width="28" height="28">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.31-1.03 2.41-2.16 3.16v2.62h3.49c2.04-1.89 3.22-4.67 3.22-7.79z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.49-2.62c-.98.66-2.23 1.05-3.79 1.05-2.91 0-5.38-1.97-6.26-4.62H2.12v2.71C3.94 20.48 7.68 23 12 23z" fill="#34A853" />
              <path d="M5.74 14.15c-.22-.66-.35-1.36-.35-2.15s.13-1.49.35-2.15V7.14H2.12C1.4 8.59 1 10.25 1 12s.4 3.41 1.12 4.86l3.62-2.71z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.07.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.68 1 3.94 3.52 2.12 7.14l3.62 2.71c.88-2.65 3.35-4.47 6.26-4.47z" fill="#EA4335" />
            </svg>
          </div>
        </div>

        <h2 
          className="text-2xl sm:text-3xl font-serif font-bold text-center mb-1 text-gray-900"
          style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
        >
          {hasTriggeredGoogle ? 'Just 1 Click on Google!' : 'Almost there!'}
        </h2>
        <p className="text-xs text-center text-gray-600 mb-5 max-w-[280px] leading-relaxed">
          {hasTriggeredGoogle
            ? 'Your review is copied to your clipboard. Paste it in Google and click Post!'
            : 'Your review is ready. When you tap Post, it will copy automatically so you just paste & submit on Google.'}
        </p>

        {/* Card 1: Your Selected Review with [✎ Edit] & [📋 Copy] */}
        <Card className="w-full border border-gray-100 shadow-xs p-4 rounded-2xl mb-3 bg-white">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold text-gray-900 font-serif text-sm">Your Selected Review</h3>
            
            <div className="flex items-center gap-2">
              <button 
                type="button"
                onClick={handleManualCopy}
                className="text-[11px] font-semibold text-emerald-800 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-full border border-emerald-200 transition cursor-pointer flex items-center gap-1"
                title="Copy to clipboard"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 text-emerald-700" />
                    <span>Copy</span>
                  </>
                )}
              </button>

              <button 
                type="button"
                className="text-xs text-gray-500 flex items-center font-medium hover:text-gray-900 transition cursor-pointer"
                onClick={() => router.back()}
              >
                <Edit2 className="w-3 h-3 mr-1 text-stone-600" />
                <span>Edit</span>
              </button>
            </div>
          </div>

          <div className="flex gap-0.5 mb-2.5">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className={`w-4 h-4 ${i < rating ? 'fill-[#F4B400] text-[#F4B400]' : 'text-gray-200'}`} />
            ))}
          </div>
          <p className="text-xs text-gray-700 leading-relaxed font-normal">
            {reviewText}
          </p>
        </Card>

        {/* ── IF USER HAS ALREADY TAPPED GOOGLE: Show Posting Assistant Card ── */}
        {hasTriggeredGoogle ? (
          <div className="w-full space-y-3 mb-2 animate-in fade-in duration-300">
            {/* Guide Steps Box */}
            <div className="bg-emerald-50/70 rounded-2xl p-4 border border-emerald-200/90 text-left space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>2-Second Step on Google</span>
                </span>
                <span className="text-[10px] font-bold bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full">
                  Step 2 of 2
                </span>
              </div>

              <div className="space-y-2 text-xs text-stone-700">
                <div className="flex items-start gap-2.5 bg-white p-2.5 rounded-xl border border-emerald-100 shadow-2xs">
                  <div className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                    ✓
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">Review Copied to Clipboard</p>
                    <p className="text-[11px] text-stone-500">Your 5-star review is saved in memory.</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 bg-white p-2.5 rounded-xl border border-emerald-100 shadow-2xs">
                  <div className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">Paste &amp; Tap "Post"</p>
                    <p className="text-[11px] text-stone-500">
                      Long-press in Google's review box, select <strong>Paste</strong>, then tap the blue <strong>Post</strong> button!
                    </p>
                  </div>
                </div>
              </div>

              {/* Recovery Actions */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleManualCopy}
                  className="flex-1 py-2 px-3 rounded-xl bg-white border border-emerald-300 text-emerald-900 font-semibold text-xs hover:bg-emerald-100/50 transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Copy className="w-3 h-3 text-emerald-700" />
                  <span>{copied ? 'Copied Again ✓' : 'Copy Again'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const url = resolveGoogleReviewUrl();
                    if (typeof window !== 'undefined') window.open(url, '_blank');
                  }}
                  className="flex-1 py-2 px-3 rounded-xl bg-white border border-slate-300 text-slate-800 font-semibold text-xs hover:bg-slate-50 transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ExternalLink className="w-3 h-3 text-slate-600" />
                  <span>Re-open Google</span>
                </button>
              </div>
            </div>

            {/* Done! I've Posted Button */}
            <Button
              className="w-full text-base font-semibold shadow-lg text-white rounded-full h-13 transition-all duration-300 cursor-pointer"
              style={{ backgroundColor: primaryColor }}
              size="lg"
              onClick={handleFinished}
            >
              <div className="flex items-center justify-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                <span>Done! I've Posted My Review</span>
                <span>→</span>
              </div>
            </Button>
          </div>
        ) : (
          /* ── BEFORE USER TAPS GOOGLE: Show Google Preview Card & Post Button ── */
          <>
            {/* Down Arrow indicator */}
            <div className="my-1 text-gray-400">
              <ArrowDown className="w-4 h-4 animate-bounce" />
            </div>

            {/* Card 2: Google Preview Card */}
            <Card className="w-full border border-gray-100 shadow-xs p-4 rounded-2xl mb-5 bg-white">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-10 h-10 rounded-full relative overflow-hidden bg-black flex-shrink-0 border border-gray-200">
                  <Image 
                    src={business?.theme?.logo || '/placeholder.png'} 
                    alt={businessName} 
                    fill 
                    unoptimized
                    className="object-cover" 
                  />
                </div>
                <div className="truncate">
                  <h4 className="font-bold text-gray-900 text-xs leading-tight truncate">{businessName}</h4>
                  <div className="flex items-center text-[11px] mt-0.5">
                    <span className="font-bold mr-1 text-gray-800">4.8</span>
                    <div className="flex gap-0.5 mr-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-2.5 h-2.5 fill-[#F4B400] text-[#F4B400]" />
                      ))}
                    </div>
                    <span className="text-gray-400 text-[10px]">(1,248 reviews)</span>
                  </div>
                  <p className="text-[10px] text-gray-500 truncate mt-0.5">{category} · {city}</p>
                </div>
              </div>
              
              {/* User Review Preview Sub-box */}
              <div className="bg-gray-50/90 rounded-xl p-3 border border-gray-100">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-6 h-6 rounded-full bg-[#5D707F] text-white flex items-center justify-center text-[10px] font-bold">
                    R
                  </div>
                  <div>
                    <h5 className="font-semibold text-[11px] text-gray-900 leading-tight">Rohan Mehta</h5>
                    <p className="text-[9px] text-gray-500 flex items-center gap-0.5">
                      Posting publicly on Google <Info className="w-2.5 h-2.5 inline opacity-70" />
                    </p>
                  </div>
                </div>
                <div className="flex gap-0.5 mb-1.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`w-2.5 h-2.5 ${i < rating ? 'fill-[#F4B400] text-[#F4B400]' : 'text-gray-200'}`} />
                  ))}
                </div>
                <p className="text-[11px] text-gray-700 line-clamp-3 leading-relaxed">
                  {reviewText}
                </p>
              </div>
            </Card>

            {/* Large Pill Action Button: [G] Post on Google → */}
            <Button 
              className="w-full text-base font-semibold shadow-lg text-white rounded-full h-13 transition-all duration-300 disabled:opacity-50 cursor-pointer"
              style={{ backgroundColor: primaryColor }}
              size="lg"
              onClick={handlePost}
              disabled={isPosting}
            >
              {isPosting ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Copying &amp; Opening Google...</span>
                </span>
              ) : (
                <div className="flex items-center justify-center gap-2.5 w-full">
                  <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center p-1 shrink-0">
                    <svg viewBox="0 0 24 24" width="16" height="16">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.31-1.03 2.41-2.16 3.16v2.62h3.49c2.04-1.89 3.22-4.67 3.22-7.79z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.49-2.62c-.98.66-2.23 1.05-3.79 1.05-2.91 0-5.38-1.97-6.26-4.62H2.12v2.71C3.94 20.48 7.68 23 12 23z" fill="#34A853" />
                      <path d="M5.74 14.15c-.22-.66-.35-1.36-.35-2.15s.13-1.49.35-2.15V7.14H2.12C1.4 8.59 1 10.25 1 12s.4 3.41 1.12 4.86l3.62-2.71z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.07.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.68 1 3.94 3.52 2.12 7.14l3.62 2.71c.88-2.65 3.35-4.47 6.26-4.47z" fill="#EA4335" />
                    </svg>
                  </div>
                  <div className="h-4 w-px bg-white/30"></div>
                  <span>Post on Google</span>
                  <span>→</span>
                </div>
              )}
            </Button>
          </>
        )}

        {/* Security / No Login Guarantee Badge */}
        <div className="bg-[#EBF2EE] rounded-xl py-2.5 px-3.5 mt-3.5 w-full flex items-center gap-2 border border-[#D1E0D9]/80">
          <CheckCircle2 className="w-4 h-4 text-[#0B3D2E] shrink-0" />
          <p className="text-[11px] text-[#0B3D2E] font-medium leading-tight">
            Review is copied automatically so you only need to paste and click Post on Google.
          </p>
        </div>
      </div>
    </div>
  );
}
