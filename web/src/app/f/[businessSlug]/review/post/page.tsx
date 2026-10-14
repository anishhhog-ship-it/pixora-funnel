'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
  Star,
  Edit2,
  Info,
  ArrowDown,
  ArrowRight,
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

  const [reviewText, setReviewText] = useState('');
  const [rating, setRating] = useState(5);
  const [business, setBusiness] = useState<Business | null>(null);
  const [isLoadingBusiness, setIsLoadingBusiness] = useState(true);

  // Architecture state
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [hasTriggeredGoogle, setHasTriggeredGoogle] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [logoError, setLogoError] = useState(false);

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

  useEffect(() => {
    let isActive = true;
    Promise.resolve().then(() => {
      const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
      const urlText = urlParams?.get('text');
      const urlRating = urlParams?.get('rating');
      const text = urlText || sessionStorage.getItem('final_review_text') || '';
      const storedRating = urlRating || sessionStorage.getItem('temp_rating');

      if (!isActive) return;
      if (text) {
        setReviewText(text);
        sessionStorage.setItem('final_review_text', text);
        // Automatically pre-copy review to clipboard on arrival!
        copyToClipboard(text).then((ok) => {
          if (ok && isActive) {
            setCopied(true);
            setToastMessage('✓ Review copied to clipboard! Ready to paste on Google.');
            setTimeout(() => setToastMessage(null), 3500);
            setTimeout(() => setCopied(false), 5000);
          }
        });
      }
      if (storedRating) {
        const parsed = parseInt(storedRating, 10);
        if (!isNaN(parsed) && parsed > 0 && parsed <= 5) {
          setRating(parsed);
          sessionStorage.setItem('temp_rating', parsed.toString());
        }
      }
    });

    businessService.getBusinessBySlug(businessSlug)
      .then((result) => {
        if (isActive) setBusiness(result);
      })
      .finally(() => {
        if (isActive) setIsLoadingBusiness(false);
      });

    return () => {
      isActive = false;
    };
  }, [businessSlug]);

  /**
   * Resolves the direct Google write-review URL for this business
   */
  const resolveGoogleReviewUrl = (): string => {
    let targetUrl = (business?.googleReviewUrl || '').trim();

    // Guard against empty root or placeholder links that redirect to goo.gl/app/maps/?_nr=1
    if (
      targetUrl === 'https://maps.app.goo.gl/' || 
      targetUrl === 'https://maps.app.goo.gl' || 
      targetUrl === 'https://maps.google.com/' || 
      targetUrl === 'https://maps.google.com' ||
      targetUrl.includes('goo.gl/app/maps')
    ) {
      targetUrl = '';
    }

    // 1. Explicit review URL stored on business or demo (e.g. search.google.com/local/writereview?placeid=...)
    if (targetUrl.startsWith('http')) {
      return targetUrl;
    }

    // 2. Official Google Place ID write-review dialog
    if (business?.googlePlaceId && business.googlePlaceId.startsWith('ChI')) {
      return `https://search.google.com/local/writereview?placeid=${business.googlePlaceId}`;
    }

    // 3. If googlePlaceId contains a full URL (that isn't a generic fallback)
    const placeIdUrl = (business?.googlePlaceId || '').trim();
    if (
      placeIdUrl.startsWith('http') && 
      placeIdUrl !== 'https://maps.app.goo.gl/' && 
      placeIdUrl !== 'https://maps.app.goo.gl' && 
      placeIdUrl !== 'https://maps.google.com' &&
      placeIdUrl !== 'https://maps.google.com/' &&
      !placeIdUrl.includes('goo.gl/app/maps')
    ) {
      return placeIdUrl;
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
    if (!reviewText.trim()) return;
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
    analyticsService.trackEvent('google_handoff_completed', { slug: businessSlug, rating });
    router.push(`/f/${businessSlug}/thank-you`);
  };

  const primaryColor = business?.theme?.primaryColor || '#0B3D2E';
  const businessName = isLoadingBusiness ? 'Loading business…' : business?.name || 'This business';
  const rawLogo = business?.theme?.logo || business?.logo;
  const hasValidLogo = !logoError && Boolean(rawLogo) && rawLogo !== '/placeholder.png' && typeof rawLogo === 'string' && rawLogo.trim().length > 0;

  return (
    <div className="relative z-10 mx-auto flex w-full max-w-sm flex-col pb-10 animate-in fade-in duration-500">
      
      {/* ── Floating Notification Toast ── */}
      {toastMessage && (
        <div className="fixed left-1/2 top-4 z-50 -translate-x-1/2 animate-in fade-in slide-in-from-top-3 duration-300" role="status" aria-live="polite">
          <div className="flex items-center gap-2 rounded-full border border-white/20 bg-slate-900/95 px-4 py-2.5 text-xs font-semibold text-white shadow-2xl backdrop-blur-md">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* ── Top Navigation Bar ── */}
      <div className="flex items-center justify-between mb-4 px-1 text-white">
        <button 
          onClick={() => router.back()}
           className="funnel-focus-ring flex cursor-pointer items-center gap-1 rounded-full border border-white/10 bg-black/25 px-2.5 py-1.5 text-xs font-semibold text-white/90 transition hover:text-white"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>Back</span>
        </button>

        {copied && (
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-950/60 px-3 py-1 text-[11px] font-semibold text-emerald-300">
            <Check className="w-3 h-3 text-emerald-400" />
            <span>Review Copied</span>
          </span>
        )}
      </div>

      {/* ── Stepper Header (1. Your Experience · 2. AI Suggestion · 3. Post on Google) ── */}
       <div className="mb-6 flex items-center justify-between px-3 text-xs font-medium text-white/90" aria-label="Review progress">
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
           <div className="mb-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#D4AF37] bg-[#0B3D2E] text-[11px] font-bold text-white shadow-md" aria-current="step">
            3
          </div>
          <span className="text-[10px] font-bold text-white">Post on Google</span>
        </div>
      </div>

      {/* ── Main Container Card ── */}
       <div className="flex w-full flex-col items-center rounded-[32px] border border-white/50 bg-[#FAF7F2]/98 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.24)] backdrop-blur-md sm:p-6">
        
        {/* Google G Logo with Confetti Rays */}
        <div className="relative w-16 h-16 mb-2 flex items-center justify-center">
          <div className="absolute -top-1 left-2 w-1 h-3 bg-amber-400 -rotate-30 rounded-full"></div>
          <div className="absolute -top-1 right-2 w-1 h-3 bg-emerald-500 rotate-30 rounded-full"></div>
          <div className="absolute top-4 -left-2 w-3 h-1 bg-rose-500 rotate-15 rounded-full"></div>
          <div className="absolute top-4 -right-2 w-3 h-1 bg-blue-500 -rotate-15 rounded-full"></div>
          
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-md">
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
         <p className="mb-5 max-w-[280px] text-center text-xs leading-relaxed text-gray-600">
          {hasTriggeredGoogle
            ? 'Your review is copied to your clipboard. Paste it in Google and click Post!'
            : 'Your review is ready. When you tap Post, it will copy automatically so you just paste & submit on Google.'}
        </p>

        {/* Card 1: Your Selected Review with Pre-filled Stars and Text */}
        <Card className="mb-4 w-full rounded-2xl border border-stone-200/80 bg-white p-4 shadow-sm">
          <div className="flex justify-between items-center mb-2.5">
            <div>
              <h3 className="font-bold text-gray-950 font-serif text-sm">Your Selected Review</h3>
              <p className="text-[10px] text-stone-500">Selected from Step 2 · Pre-copied &amp; ready</p>
            </div>
            
            <div className="flex items-center gap-1.5">
              <button 
                type="button"
                onClick={handleManualCopy}
                className="funnel-focus-ring flex cursor-pointer items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-800 transition hover:bg-emerald-100"
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
                className="funnel-focus-ring flex cursor-pointer items-center gap-1 rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1 text-[11px] font-semibold text-stone-700 transition hover:bg-stone-100"
                onClick={() => setIsEditing(!isEditing)}
              >
                <Edit2 className="w-3 h-3 text-stone-600" />
                <span>{isEditing ? 'Done' : 'Edit'}</span>
              </button>
            </div>
          </div>

          {/* Pre-Filled Stars from Step 1 */}
          <div className="mb-3 flex items-center justify-between rounded-xl bg-amber-50/70 p-2.5 border border-amber-200/60">
            <div className="flex items-center gap-1.5">
              <div className="flex gap-0.5" role="group" aria-label="Selected rating">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => {
                      setRating(star);
                      sessionStorage.setItem('temp_rating', star.toString());
                    }}
                    className="cursor-pointer transition-transform hover:scale-110 active:scale-95"
                    title={`Rate ${star} stars`}
                  >
                    <Star
                      className={`w-4.5 h-4.5 transition-colors ${
                        star <= rating
                          ? 'fill-[#F4B400] text-[#F4B400] drop-shadow-[0_2px_8px_rgba(244,180,0,0.35)]'
                          : 'text-stone-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
              <span className="text-xs font-bold text-amber-950 ml-1">
                {rating}.0 Stars Selected
              </span>
            </div>
            <span className="text-[10px] font-semibold text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded-full">
              Pre-filled from Step 1
            </span>
          </div>

          {/* Pre-Filled Review Text or Inline Edit */}
          {isEditing ? (
            <div className="space-y-2">
              <Textarea
                value={reviewText}
                onChange={(e) => {
                  setReviewText(e.target.value);
                  sessionStorage.setItem('final_review_text', e.target.value);
                }}
                className="funnel-focus-ring min-h-[90px] resize-none rounded-xl border-stone-300 bg-stone-50/50 p-3 text-xs leading-relaxed text-stone-900"
                placeholder="Customize your review text here…"
              />
              <div className="flex justify-end">
                <Button
                  size="sm"
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    copyToClipboard(reviewText);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 3000);
                  }}
                  className="h-7 rounded-lg text-xs font-bold text-white cursor-pointer"
                  style={{ backgroundColor: primaryColor }}
                >
                  Save &amp; Re-copy
                </Button>
              </div>
            </div>
          ) : (
            <div 
              onClick={() => setIsEditing(true)}
              className="group cursor-pointer rounded-xl bg-stone-50/70 p-3 border border-stone-200/50 hover:border-stone-300 transition-colors"
              title="Click to edit review text"
            >
              <p className="text-xs text-stone-800 leading-relaxed font-normal">
                &ldquo;{reviewText}&rdquo;
              </p>
              <span className="mt-1.5 block text-[10px] text-stone-400 group-hover:text-stone-600">
                Tap to edit · Pre-filled from Step 2
              </span>
            </div>
          )}
        </Card>

        {/* ── IF USER HAS ALREADY TAPPED GOOGLE: Show Posting Assistant Card ── */}
         {!reviewText.trim() ? (
           <div className="mb-2 w-full rounded-2xl border border-dashed border-amber-300 bg-amber-50/80 p-4 text-center">
             <p className="text-sm font-semibold text-amber-950">No review text selected yet</p>
             <p className="mt-1 text-xs leading-relaxed text-amber-900/75">Go back to the previous step to write or choose your own review text.</p>
             <Button type="button" variant="outline" onClick={() => router.back()} className="funnel-focus-ring mt-3 h-9 rounded-full border-amber-300 px-4 text-xs text-amber-950">Back to edit</Button>
           </div>
         ) : hasTriggeredGoogle ? (
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
                       <p className="text-[11px] text-stone-500">Your selected review text is ready to paste.</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 bg-white p-2.5 rounded-xl border border-emerald-100 shadow-2xs">
                  <div className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </div>
                  <div className="flex-1">
                     <p className="font-semibold text-slate-900">Paste &amp; Tap &quot;Post&quot;</p>
                    <p className="text-[11px] text-stone-500">
                       Long-press in Google&apos;s review box, select <strong>Paste</strong>, then tap the blue <strong>Post</strong> button!
                    </p>
                  </div>
                </div>
              </div>

              {/* Recovery Actions */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleManualCopy}
                   className="funnel-focus-ring flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-emerald-300 bg-white px-3 py-2 text-xs font-semibold text-emerald-900 transition hover:bg-emerald-100/50"
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
                   className="funnel-focus-ring flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 transition hover:bg-slate-50"
                >
                  <ExternalLink className="w-3 h-3 text-slate-600" />
                  <span>Re-open Google</span>
                </button>
              </div>
            </div>

             {/* Return to thank-you without claiming Google submission */}
            <Button
               className="funnel-focus-ring h-13 w-full cursor-pointer rounded-full text-base font-semibold text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
              style={{ backgroundColor: primaryColor }}
              size="lg"
              onClick={handleFinished}
            >
              <div className="flex items-center justify-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                <span>Continue to Thank You</span>
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
            <Card className="mb-5 w-full rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="relative flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border border-gray-200 bg-slate-100 shadow-2xs">
                  {hasValidLogo ? (
                    <Image
                      src={rawLogo!}
                      alt={businessName}
                      fill 
                      unoptimized
                      onError={() => setLogoError(true)}
                      className="object-cover" 
                    />
                  ) : (
                    <div 
                      className="flex h-full w-full items-center justify-center text-sm font-extrabold text-white uppercase select-none shadow-inner"
                      style={{ background: `linear-gradient(135deg, ${primaryColor}, #1b533e)` }}
                    >
                      {businessName?.trim()?.charAt(0) || 'B'}
                    </div>
                  )}
                </div>
                <div className="min-w-0 truncate">
                  <h4 className="font-bold text-gray-900 text-xs leading-tight truncate">{businessName}</h4>
                  {business?.rating || business?.reviewsCount ? (
                    <div className="mt-0.5 flex items-center text-[11px]">
                      {business.rating ? <span className="mr-1 font-bold text-gray-800">{business.rating.toFixed(1)}</span> : null}
                      {business.rating ? <div className="mr-1 flex gap-0.5" aria-label={`${business.rating.toFixed(1)} out of 5 stars`}>
                        {[...Array(5)].map((_, i) => <Star key={i} className={`h-2.5 w-2.5 ${i < Math.round(business.rating || 0) ? 'fill-[#F4B400] text-[#F4B400]' : 'text-gray-200'}`} />)}
                      </div> : null}
                      {business.reviewsCount ? <span className="text-[10px] text-gray-400">({business.reviewsCount.toLocaleString()} reviews)</span> : null}
                    </div>
                  ) : null}
                  {(business?.category || business?.city) && <p className="mt-0.5 truncate text-[10px] text-gray-500">{[business.category, business.city].filter(Boolean).join(' · ')}</p>}
                </div>
              </div>
              
              {/* User Review Preview Sub-box */}
              <div className="bg-gray-50/90 rounded-xl p-3 border border-gray-100">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#5D707F] text-[10px] font-bold text-white shadow-2xs">
                    Y
                  </div>
                  <div>
                    <h5 className="font-semibold text-[11px] leading-tight text-gray-900">Your review</h5>
                    <p className="text-[9px] text-gray-500 flex items-center gap-0.5">
                      Posting publicly on Google <Info className="w-2.5 h-2.5 inline opacity-70" />
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-3.5 h-3.5 ${i < rating ? 'fill-[#F4B400] text-[#F4B400]' : 'text-gray-200'}`} />
                    ))}
                  </div>
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                    {rating}.0 Stars Pre-filled
                  </span>
                </div>
                <p className="text-[11px] text-gray-700 line-clamp-3 leading-relaxed">
                  {reviewText}
                </p>
              </div>
            </Card>

            {/* Action Button: [G] Paste & Post on Google (5★) → */}
            <Button 
              className="funnel-focus-ring group relative h-14 w-full cursor-pointer rounded-full px-4 text-sm sm:text-base font-bold text-white shadow-xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl disabled:cursor-not-allowed disabled:opacity-50 overflow-hidden"
              style={{ 
                backgroundColor: primaryColor,
                boxShadow: `0 14px 30px -6px ${primaryColor}99`
              }}
              size="lg"
              onClick={handlePost}
              disabled={isPosting}
            >
              {isPosting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Opening Google ({rating} Stars)...</span>
                </span>
              ) : (
                <div className="flex items-center justify-center gap-2 sm:gap-2.5 w-full min-w-0">
                  <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center p-1 shrink-0 shadow-xs">
                    <svg viewBox="0 0 24 24" width="14" height="14">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.31-1.03 2.41-2.16 3.16v2.62h3.49c2.04-1.89 3.22-4.67 3.22-7.79z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.49-2.62c-.98.66-2.23 1.05-3.79 1.05-2.91 0-5.38-1.97-6.26-4.62H2.12v2.71C3.94 20.48 7.68 23 12 23z" fill="#34A853" />
                      <path d="M5.74 14.15c-.22-.66-.35-1.36-.35-2.15s.13-1.49.35-2.15V7.14H2.12C1.4 8.59 1 10.25 1 12s.4 3.41 1.12 4.86l3.62-2.71z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.07.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.68 1 3.94 3.52 2.12 7.14l3.62 2.71c.88-2.65 3.35-4.47 6.26-4.47z" fill="#EA4335" />
                    </svg>
                  </div>
                  <div className="h-4 w-px bg-white/25 shrink-0" />
                  <span className="truncate tracking-tight font-bold">
                    Paste &amp; Post on Google
                  </span>
                  <span className="font-semibold text-white/90 shrink-0 text-xs sm:text-sm">
                    ({rating}★)
                  </span>
                  <ArrowRight className="w-4 h-4 ml-0.5 shrink-0 transition-transform group-hover:translate-x-1" />
                </div>
              )}
            </Button>
          </>
        )}

        {/* Security / No Login Guarantee Badge */}
        <div className="bg-[#EBF2EE] rounded-xl py-2.5 px-3.5 mt-3.5 w-full flex items-center gap-2 border border-[#D1E0D9]/80">
          <CheckCircle2 className="w-4 h-4 text-[#0B3D2E] shrink-0" />
           <p className="text-[11px] font-medium leading-tight text-[#0B3D2E]">
             The text is copied for you; you decide whether to paste and post it on Google.
          </p>
        </div>
      </div>
    </div>
  );
}
