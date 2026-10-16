'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Star, 
  MapPin, 
  Phone, 
  CheckCircle2, 
  Lightbulb, 
  PenLine, 
  RotateCw, 
  Copy, 
  ArrowRight, 
  ExternalLink,
  AlertCircle,
  Tag,
  Sparkles,
  ShoppingBag,
  Utensils,
  Scissors,
  Smile,
  Heart,
  Shirt,
  Store,
  BookOpen,
  Clock,
} from 'lucide-react';
import { businessService, analyticsService, reviewEngine } from '@/services';
import { getCatalogTerminology, getFunnelBackground, getReviewTopics, normalizeBusinessCategory } from '@/config/businessCategories';
import { Business } from '@/types';
import { getPublicRatingRoute } from '@/services/ratingRouting';

// Official Google 'G' 4-color SVG
function GoogleGLogo({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.31-1.03 2.41-2.16 3.16v2.62h3.49c2.04-1.89 3.22-4.67 3.22-7.79z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.49-2.62c-.98.66-2.23 1.05-3.79 1.05-2.91 0-5.38-1.97-6.26-4.62H2.12v2.71C3.94 20.48 7.68 23 12 23z" fill="#34A853" />
      <path d="M5.74 14.15c-.22-.66-.35-1.36-.35-2.15s.13-1.49.35-2.15V7.14H2.12C1.4 8.59 1 10.25 1 12s.4 3.41 1.12 4.86l3.62-2.71z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.07.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.68 1 3.94 3.52 2.12 7.14l3.62 2.71c.88-2.65 3.35-4.47 6.26-4.47z" fill="#EA4335" />
    </svg>
  );
}

// Icon mapper for topic chips based on keyword
function getTopicIcon(topic: string) {
  const t = topic.toLowerCase();
  if (t.includes('food') || t.includes('thali') || t.includes('flavour') || t.includes('dish') || t.includes('menu')) {
    return <Utensils className="w-4 h-4 text-emerald-600 shrink-0" />;
  }
  if (t.includes('ethnic') || t.includes('cloth') || t.includes('wear') || t.includes('fashion') || t.includes('dress') || t.includes('kurta') || t.includes('shirt')) {
    return <Shirt className="w-4 h-4 text-emerald-600 shrink-0" />;
  }
  if (t.includes('wedding') || t.includes('ring') || t.includes('jewel') || t.includes('gold')) {
    return <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />;
  }
  if (t.includes('hair') || t.includes('salon') || t.includes('facial') || t.includes('spa')) {
    return <Scissors className="w-4 h-4 text-emerald-600 shrink-0" />;
  }
  if (t.includes('doctor') || t.includes('clinic') || t.includes('dental') || t.includes('smile')) {
    return <Smile className="w-4 h-4 text-emerald-600 shrink-0" />;
  }
  if (t.includes('vibe') || t.includes('ambience') || t.includes('hospitality') || t.includes('care')) {
    return <Heart className="w-4 h-4 text-emerald-600 shrink-0" />;
  }
  if (t.includes('service') || t.includes('staff') || t.includes('fast') || t.includes('time')) {
    return <Clock className="w-4 h-4 text-emerald-600 shrink-0" />;
  }
  if (t.includes('quality') || t.includes('collection') || t.includes('variety') || t.includes('product')) {
    return <ShoppingBag className="w-4 h-4 text-emerald-600 shrink-0" />;
  }
  if (t.includes('overall') || t.includes('experience') || t.includes('visit') || t.includes('store')) {
    return <Store className="w-4 h-4 text-emerald-600 shrink-0" />;
  }
  return <Tag className="w-4 h-4 text-emerald-600 shrink-0" />;
}

export interface SinglePageReviewFunnelProps {
  initialBusiness?: Business | null;
  businessSlug?: string;
}

export function resolveBusinessTopics(biz: Business): string[] {
  // Review prompts are controlled by the business category so every client
  // gets a consistent, relevant funnel. Profile details remain editable in
  // the client portal and are rendered below.
  const resolvedTopics: string[] = [];
  const categoryTopics = getReviewTopics(biz.category);
  for (const topic of categoryTopics) {
    if (resolvedTopics.length >= 6) break;
    if (!resolvedTopics.some((existing) => existing.toLowerCase() === topic.toLowerCase())) {
      resolvedTopics.push(topic);
    }
  }

  return Array.from(new Map(resolvedTopics.map((topic) => [topic.toLowerCase(), topic])).values()).slice(0, 6);
}

export default function SinglePageReviewFunnel({
  initialBusiness,
  businessSlug: propBusinessSlug,
}: SinglePageReviewFunnelProps = {}) {
  const routeParams = useParams();
  const router = useRouter();
  const businessSlug = propBusinessSlug || (routeParams?.businessSlug as string) || 'your-business';

  // Core state - initialized immediately from server data when available!
  const [business, setBusiness] = useState<Business | null>(initialBusiness || null);
  const [isLoadingBusiness, setIsLoadingBusiness] = useState(!initialBusiness);
  const [loadError, setLoadError] = useState(false);

  // Rating state (starts at 0 as required)
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);

  // Topics state - pre-populate synchronously if initialBusiness is provided
  const [topics, setTopics] = useState<string[]>(() => initialBusiness ? resolveBusinessTopics(initialBusiness) : []);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(() => {
    if (!initialBusiness) return null;
    const t = resolveBusinessTopics(initialBusiness);
    return t.length > 0 ? t[0] : null;
  });

  // Review editing & generation state
  const [reviewText, setReviewText] = useState<string>('');
  const [hasManuallyEdited, setHasManuallyEdited] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Clipboard & action state
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const [showHelperModal, setShowHelperModal] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [popupBlockedUrl, setPopupBlockedUrl] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // Session tracking to ensure users never see repetitive reviews
  const seenReviewsRef = useRef<Set<string>>(new Set());

  // 1. Generate review suggestion using real existing review engine
  const generateReviewForTopic = async (
    topicHighlight: string,
    bizContext?: Business | null,
    forceFresh: boolean = false
  ) => {
    const currentBiz = bizContext || business;
    if (!currentBiz) return;

    setIsGenerating(true);
    setGenerationError(null);

    try {
      // Build exclusion list containing current text and recent session reviews
      const excludeList = Array.from(seenReviewsRef.current);
      if (reviewText && !excludeList.includes(reviewText)) {
        excludeList.push(reviewText);
      }

      const suggestions = await reviewEngine.generateReviewSuggestions(
        topicHighlight,
        currentBiz.name || 'this business',
        currentBiz.category,
        currentBiz.id || currentBiz.businessId || businessSlug,
        excludeList
      );

      if (suggestions && suggestions.length > 0) {
        // Guarantee the new review is different from current reviewText if alternatives exist
        const generated = suggestions.find(s => s !== reviewText) || suggestions[0];

        // Track in session seen cache
        seenReviewsRef.current.add(generated);
        if (seenReviewsRef.current.size > 80) {
          const first = seenReviewsRef.current.values().next().value;
          if (first) seenReviewsRef.current.delete(first);
        }

        // Only update review text if user hasn't manually edited (or forced on regenerate/topic click)
        if (!hasManuallyEdited || forceFresh) {
          setHasManuallyEdited(false);
          setReviewText(generated);
          sessionStorage.setItem('final_review_text', generated);
        }
      } else {
        setGenerationError('Could not generate suggestion. You can type your own review below.');
      }
    } catch (err) {
      console.warn('Error in review generation:', err);
      setGenerationError('Review assistance is currently unavailable. You can write your review directly.');
    } finally {
      setIsGenerating(false);
    }
  };

  // 2. Load business data & configured topics
  useEffect(() => {
    let isActive = true;

    analyticsService.trackEvent('funnel_loaded', { slug: businessSlug });

    // If initialBusiness is provided from Server Component, use it immediately with zero delay
    if (initialBusiness) {
      setBusiness(initialBusiness);
      const cleanTopics = resolveBusinessTopics(initialBusiness);
      setTopics(cleanTopics);
      if (cleanTopics.length > 0) {
        setSelectedTopic(cleanTopics[0]);
        generateReviewForTopic(cleanTopics[0], initialBusiness, true);
      } else {
        generateReviewForTopic('', initialBusiness, true);
      }
      setIsLoadingBusiness(false);
      return;
    }

    businessService.getBusinessBySlug(businessSlug)
      .then((biz) => {
        if (!isActive) return;
        if (!biz) {
          setLoadError(true);
          return;
        }
        setBusiness(biz);

        const cleanTopics = resolveBusinessTopics(biz);
        setTopics(cleanTopics);

        if (cleanTopics.length > 0) {
          const firstTopic = cleanTopics[0];
          setSelectedTopic(firstTopic);
          generateReviewForTopic(firstTopic, biz, true);
        } else {
          generateReviewForTopic('', biz, true);
        }
      })
      .catch((err) => {
        console.error('Error loading business in funnel:', err);
        if (isActive) setLoadError(true);
      })
      .finally(() => {
        setIsLoadingBusiness(false);
      });

    return () => {
      isActive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessSlug, initialBusiness]);

  // 3. Topic selection handler
  const handleSelectTopic = (topic: string) => {
    setSelectedTopic(topic);
    analyticsService.trackEvent('topic_selected', { topic, slug: businessSlug });
    // Reset manual edit flag so the selected topic updates the text
    setHasManuallyEdited(false);
    generateReviewForTopic(topic, null, true);
  };

  // 4. Manual review text change
  const handleReviewTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setReviewText(newText);
    setHasManuallyEdited(true);
    if (validationError) setValidationError(null);
    sessionStorage.setItem('final_review_text', newText);
  };

  // 5. Rating selection
  const handleRate = (star: number) => {
    setRating(star);
    analyticsService.trackEvent('rating_selected', {
      rating: star,
      slug: businessSlug,
      businessId: business?.id || business?.businessId,
    });
    sessionStorage.setItem('temp_rating', star.toString());

    // Keep low ratings in the private resolution flow. Do this at selection
    // time so a 1–3 star customer never sees or submits the Google CTA.
    if (getPublicRatingRoute(star) === 'feedback') {
      router.push(`/f/${businessSlug}/feedback?rating=${star}`);
    }
  };

  // 6. Robust clipboard utility with textarea fallback for all mobile browsers & webviews
  const copyToClipboard = async (textToCopy: string): Promise<boolean> => {
    let success = false;
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(textToCopy);
        success = true;
      }
    } catch (err) {
      console.warn('Clipboard writeText failed, attempting execCommand fallback:', err);
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
        console.warn('execCommand fallback copy also failed:', e);
      }
    }

    return success;
  };

  // 7. Resolve configured Google Review URL
  const resolveGoogleReviewUrl = (): string => {
    let targetUrl = (business?.googleReviewUrl || '').trim();

    // Guard against empty root or placeholder links
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

    // 3. Full Place URL if valid
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

    // 4. Default Google Maps search query with business name & location
    const name = business?.name || 'Local Business';
    const loc = business?.address || business?.city || '';
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name} ${loc}`.trim())}`;
  };

  const resolveGoogleMapsUrl = (): string => {
    const configured = (business?.googleMapsUrl || '').trim();
    if (configured.startsWith('http')) return configured;
    const name = business?.name || 'Local Business';
    const loc = business?.address || business?.city || '';
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name} ${loc}`.trim())}`;
  };

  // 8. Primary CTA action: Copy Review & Open Google
  const handleCopyAndOpenGoogle = async () => {
    if (getPublicRatingRoute(rating) !== 'google') {
      if (getPublicRatingRoute(rating) === 'feedback') router.push(`/f/${businessSlug}/feedback?rating=${rating}`);
      else setValidationError('Please choose a 4 or 5 star rating to continue to Google.');
      return;
    }

    const textToSubmit = reviewText.trim();
    if (!textToSubmit) {
      setValidationError('Please write or select your review before proceeding.');
      setIsEditing(true);
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
      return;
    }

    setValidationError(null);
    setPopupBlockedUrl(null);

    // Step A: Copy to clipboard
    const copyOk = await copyToClipboard(textToSubmit);
    if (copyOk) {
      setCopied(true);
      setCopyFailed(false);
      setTimeout(() => setCopied(false), 6000);
    } else {
      setCopyFailed(true);
    }

    // Step B: Resolve genuine Google review destination
    const targetGoogleUrl = resolveGoogleReviewUrl();

    // Step C: Track analytics
    analyticsService.trackEvent('google_clicked', {
      slug: businessSlug,
      businessId: business?.id || business?.businessId,
      rating,
      googleUrl: targetGoogleUrl,
      copied: copyOk,
    });

    // Step D: Open Google in new window immediately within user gesture
    let openedWindow: Window | null = null;
    try {
      openedWindow = window.open(targetGoogleUrl, '_blank', 'noopener,noreferrer');
    } catch (e) {
      console.warn('Could not open window directly:', e);
    }

    // If popup blocker intervened
    if (!openedWindow || openedWindow.closed || typeof openedWindow.closed === 'undefined') {
      setPopupBlockedUrl(targetGoogleUrl);
    }

    // Step E: Show modal / helper instructions that Google is opened and they must paste & tap Post
    setShowHelperModal(true);
  };

  // Helper feedback for rating
  const getRatingFeedback = (val: number) => {
    switch (val) {
      case 5:
        return { label: '5 Stars – Outstanding!', color: 'text-amber-600' };
      case 4:
        return { label: '4 Stars – Very Good', color: 'text-amber-600' };
      case 3:
        return { label: '3 Stars – Average Visit', color: 'text-amber-700' };
      case 2:
        return { label: '2 Stars – Below Expectations', color: 'text-orange-600' };
      case 1:
        return { label: '1 Star – Needs Improvement', color: 'text-rose-600' };
      default:
        return null;
    }
  };

  const activeRating = hoverRating || rating;
  const ratingFeedback = activeRating > 0 ? getRatingFeedback(activeRating) : null;

  // Only show this badge when an explicit Google verification state has been
  // persisted. A paid/active Pixora plan is not proof of Google verification.
  const isVerifiedBusiness = Boolean((business as (Business & { googleVerified?: boolean }) | null)?.googleVerified);

  // Loading state
  if (isLoadingBusiness) {
    return (
      <div className="mx-auto flex w-full max-w-sm flex-col gap-4 pt-6" role="status" aria-live="polite">
        <div className="flex items-center gap-3">
          <div className="h-14 w-14 rounded-2xl bg-slate-200 animate-pulse" />
          <div className="space-y-2 flex-1">
            <div className="h-5 w-3/4 rounded-md bg-slate-200 animate-pulse" />
            <div className="h-3 w-1/2 rounded-md bg-slate-100 animate-pulse" />
          </div>
        </div>
        <div className="rounded-[32px] border border-slate-100 bg-white p-6 shadow-md mt-4">
          <div className="mx-auto mb-6 h-10 w-10 rounded-full bg-slate-100 animate-pulse" />
          <div className="mx-auto mb-4 h-6 w-2/3 rounded-md bg-slate-200 animate-pulse" />
          <div className="mb-6 h-10 rounded-xl bg-slate-100 animate-pulse" />
          <div className="h-14 rounded-full bg-slate-200 animate-pulse" />
        </div>
        <span className="sr-only">Loading business review page…</span>
      </div>
    );
  }

  // Load error state
  if (loadError || !business) {
    return (
      <div className="mx-auto w-full max-w-sm rounded-[32px] border border-slate-200 bg-white p-7 text-center text-slate-900 shadow-xl mt-8" role="alert">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
          <AlertCircle className="h-6 w-6" aria-hidden="true" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Review Page Unavailable</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          We could not load this business&apos;s review funnel right now. Please verify the link or scan again in a moment.
        </p>
      </div>
    );
  }

  const categoryConfig = normalizeBusinessCategory(business.category);
  const catalogTerminology = getCatalogTerminology(business.category);
  const funnelBackground = getFunnelBackground(business);
  const showPublicMenu = business.menuEnabled !== false && business.theme.menuEnabled !== false;
  const combinedAddress = [business.address, business.city]
    .filter((value): value is string => Boolean(value))
    .map((value) => value.trim())
    .filter((value, index, values) => values.indexOf(value) === index)
    .join(', ');
  const publicHours = (business.theme as unknown as {
    businessHours?: Array<{ day: string; isOpen: boolean; openTime?: string; closeTime?: string; is24Hours?: boolean }>;
    showHoursInFunnel?: boolean;
  }).businessHours;
  const showPublicHours = Boolean(
    (business.theme as unknown as { showHoursInFunnel?: boolean }).showHoursInFunnel &&
    Array.isArray(publicHours) &&
    publicHours.some((entry) => entry.isOpen)
  );

  return (
    <div className="funnel-page relative mx-auto flex w-full max-w-md flex-col pb-8 animate-in fade-in duration-300">
      
      {/* ── SECTION A: Dynamic Business Header ── */}
      <header className="mb-5 flex items-start justify-between gap-3 pt-1">
        <div className="min-w-0 flex-1 space-y-1.5">
          {/* Business Name */}
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 leading-tight break-words">
            {business.name}
          </h1>

          <span className="inline-flex w-fit items-center rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-800 ring-1 ring-inset ring-emerald-200">
            {categoryConfig.name}
          </span>

          {/* Business Address and city stay in sync with the client portal profile. */}
          {combinedAddress && (
            <div className="flex items-start gap-1.5 text-xs text-slate-600 leading-relaxed">
              <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" aria-hidden="true" />
              <a href={resolveGoogleMapsUrl()} target="_blank" rel="noopener noreferrer" className="break-words hover:text-blue-700 hover:underline">
                {combinedAddress}
              </a>
            </div>
          )}

          {/* Business Phone / Mobile Number (only rendered if present) */}
          {business.phone && business.phone.trim().length > 0 && (
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700">
              <Phone className="w-3.5 h-3.5 text-blue-600 shrink-0" aria-hidden="true" />
              <a 
                href={`tel:${business.phone.replace(/[^0-9+]/g, '')}`} 
                className="hover:underline hover:text-blue-700 transition"
              >
                {business.phone}
              </a>
            </div>
          )}

          {showPublicMenu && (
            <Link
              href={`/f/${businessSlug}/menu`}
              className="mt-1 inline-flex w-fit items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 ring-1 ring-inset ring-emerald-200 transition hover:bg-emerald-100"
            >
              <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
              <span>View {catalogTerminology.publicPageHeading}</span>
              <ArrowRight className="h-3 w-3" aria-hidden="true" />
            </Link>
          )}

          {business.website && business.website.trim().length > 0 && (
            <a href={business.website.startsWith('http') ? business.website : `https://${business.website}`} target="_blank" rel="noopener noreferrer" className="block truncate text-xs text-blue-700 hover:underline">
              Visit website
            </a>
          )}

          {showPublicHours && (
            <div className="flex items-start gap-1.5 text-xs text-slate-600 leading-relaxed">
              <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" aria-hidden="true" />
              <span>
                {publicHours?.filter((entry) => entry.isOpen).slice(0, 2).map((entry) => (
                  <span key={entry.day} className="mr-2 inline-block">
                    {entry.day.slice(0, 3)} {entry.is24Hours ? 'Open 24 hours' : `${entry.openTime || ''}–${entry.closeTime || ''}`}
                  </span>
                ))}
              </span>
            </div>
          )}

          {/* Verified Badge (only if verified by system) */}
          {isVerifiedBusiness && (
            <div className="pt-0.5">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/90 text-emerald-800 text-[11px] font-semibold shadow-xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
                <span>Verified Business</span>
              </span>
            </div>
          )}
        </div>

        {/* Category-managed photo: visual customization is intentionally not client-editable. */}
        <div className="flex flex-col items-end shrink-0">
          <div className="relative h-24 w-32 sm:h-28 sm:w-36 overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-100 shadow-sm">
            <Image src={funnelBackground.desktop} alt={`${categoryConfig.name} atmosphere`} fill unoptimized className="hidden object-cover sm:block" />
            <Image src={funnelBackground.mobile} alt={`${categoryConfig.name} atmosphere`} fill unoptimized className="object-cover sm:hidden" />
            <div className="pointer-events-none absolute inset-0" style={{ background: funnelBackground.overlay.gradient || 'linear-gradient(180deg, transparent 30%, rgba(15,23,42,0.35))' }} />
          </div>
          <div className="funnel-thank-you mt-1.5 flex max-w-36 items-center gap-1 text-[11px] font-semibold text-slate-700">
            <span>Thank you for supporting us!</span>
            <span className="text-rose-500 not-italic">❤️</span>
          </div>
        </div>
      </header>

      {/* ── MAIN REVIEW CARD ── */}
      <div className="w-full rounded-[32px] border border-slate-100 bg-white p-5 sm:p-7 shadow-[0_16px_45px_-12px_rgba(15,23,42,0.08)]">
        
        {/* ── SECTION B: Google Rating Section ── */}
        <div className="flex flex-col items-center text-center mb-6">
          {/* Google G Logo with radiant sunburst accents */}
          <div className="relative mb-3 flex items-center justify-center">
            <div className="absolute -inset-2.5 rounded-full bg-blue-50/70 blur-xs -z-10" />
            <GoogleGLogo className="w-8 h-8 sm:w-9 sm:h-9" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            {categoryConfig.headline}
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 font-normal">
            {categoryConfig.subheadline}
          </p>

          {/* 5 Interactive Star Rating Controls */}
          <div 
            className="mt-4 flex items-center justify-center gap-2" 
            role="group" 
            aria-label="Select star rating"
          >
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className="cursor-pointer rounded-xl p-1 transition-transform duration-150 hover:scale-115 active:scale-95 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500"
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => handleRate(star)}
                aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                aria-pressed={rating === star}
              >
                <Star
                  className={`h-9 w-9 sm:h-10 sm:w-10 transition-colors duration-200 ${
                    star <= (hoverRating || rating)
                      ? 'fill-[#F4B400] text-[#F4B400] drop-shadow-[0_4px_12px_rgba(244,180,0,0.4)]'
                      : 'text-slate-300 stroke-slate-300 fill-transparent hover:text-amber-400'
                  }`}
                  strokeWidth={1.75}
                />
              </button>
            ))}
          </div>

          {/* Rating Status Badge */}
          <div className="mt-3">
            {ratingFeedback ? (
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-50 border border-amber-200/80 text-xs font-bold ${ratingFeedback.color}`}>
                {'★'.repeat(activeRating)} {ratingFeedback.label}
              </span>
            ) : (
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-slate-100 border border-slate-200/70 text-slate-600 text-xs font-medium">
                Tap a star to rate
              </span>
            )}
          </div>
        </div>

        {/* ── SECTION C: Topic Selection ── */}
        {topics.length > 0 && (
          <div className="mb-5 rounded-2xl border border-emerald-100/90 bg-[#F0FDF4] p-4 sm:p-4.5">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 shrink-0">
                <Lightbulb className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 leading-tight">
                  Not sure what to write?
                </h3>
                <p className="text-[11px] text-slate-600 font-normal">
                  Choose a topic and we&apos;ll create a review for you.
                </p>
              </div>
            </div>

            {/* Topic Chips Grid */}
            <div className="grid grid-cols-2 gap-2" role="group" aria-label="Review topics">
              {topics.map((topic) => {
                const isSelected = selectedTopic === topic;
                return (
                  <button
                    key={topic}
                    type="button"
                    onClick={() => handleSelectTopic(topic)}
                    className={`flex items-center justify-between gap-1.5 rounded-full px-3 py-2 text-xs font-medium transition-all cursor-pointer border text-left ${
                      isSelected
                        ? 'border-emerald-500 bg-[#DCFCE7] text-emerald-950 font-semibold shadow-xs'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                    aria-pressed={isSelected}
                  >
                    <span className="flex items-center gap-1.5 truncate">
                      {getTopicIcon(topic)}
                      <span className="truncate">{topic}</span>
                    </span>
                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" aria-hidden="true" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── SECTION D: Review Editor Card ── */}
        <div className="mb-5 rounded-2xl border border-blue-100/90 bg-[#F0F7FF] p-4 sm:p-4.5">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600 shrink-0">
                <PenLine className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 leading-tight">
                  Your Review is Ready!
                </h3>
                <p className="text-[11px] text-slate-600 font-normal">
                  You can edit your words before posting.
                </p>
              </div>
            </div>

            {/* Edit / Done Toggle & Regenerate */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  const nextState = !isEditing;
                  setIsEditing(nextState);
                  if (nextState && textareaRef.current) {
                    setTimeout(() => textareaRef.current?.focus(), 50);
                  }
                }}
                className="flex items-center gap-1 rounded-full border border-blue-200 bg-white px-2.5 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                aria-label={isEditing ? 'Finish editing review' : 'Edit review'}
              >
                <PenLine className="w-3 h-3" />
                <span>{isEditing ? 'Done' : 'Edit'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setHasManuallyEdited(false);
                  generateReviewForTopic(selectedTopic || '', null, true);
                }}
                disabled={isGenerating}
                className="flex h-7 w-7 items-center justify-center rounded-full border border-blue-200 bg-white text-blue-600 hover:bg-blue-50 transition cursor-pointer disabled:opacity-50"
                title="Generate another variation"
                aria-label="Generate another variation"
              >
                <RotateCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Inner Review Box */}
          <div className="rounded-xl border border-blue-100/80 bg-white p-3.5 shadow-xs">
            {isGenerating ? (
              <div className="py-4 text-center">
                <div className="mx-auto mb-2 h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                <p className="text-xs text-slate-500 font-medium">Preparing your personalized review…</p>
              </div>
            ) : isEditing ? (
              <div className="space-y-2">
                <textarea
                  ref={textareaRef}
                  value={reviewText}
                  onChange={handleReviewTextChange}
                  rows={4}
                  placeholder="Share your genuine experience with this business..."
                  className="w-full resize-none border-0 p-0 text-sm leading-relaxed text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-0"
                />
                <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-[11px] text-slate-400">
                  <span>{reviewText.length} characters</span>
                  <span className="font-medium text-blue-600">Editable before posting</span>
                </div>
              </div>
            ) : (
              <div 
                onClick={() => setIsEditing(true)}
                className="cursor-pointer text-sm leading-relaxed text-slate-800 min-h-[60px]"
                title="Tap to edit review text"
              >
                {reviewText ? (
                  <p>{reviewText}</p>
                ) : (
                  <p className="text-slate-400 italic">
                    Tap a topic above or tap here to write your review…
                  </p>
                )}
              </div>
            )}

            {/* Error state if generation failed */}
            {generationError && (
              <div className="mt-2 text-xs text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200 flex items-center justify-between">
                <span>{generationError}</span>
                <button
                  type="button"
                  onClick={() => generateReviewForTopic(selectedTopic || '')}
                  className="font-semibold underline ml-2 cursor-pointer"
                >
                  Retry
                </button>
              </div>
            )}
          </div>

          {/* Validation error if user attempts to submit empty review */}
          {validationError && (
            <p className="mt-2 text-xs font-semibold text-rose-600 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{validationError}</span>
            </p>
          )}
        </div>

        {/* ── SECTION E: Primary Action CTA ── */}
        <div className="space-y-2.5">
          <button
            type="button"
            onClick={handleCopyAndOpenGoogle}
            className="w-full h-14 rounded-full bg-[#1A73E8] hover:bg-[#1557B0] active:scale-[0.99] text-white font-semibold text-base shadow-lg shadow-blue-500/25 flex items-center justify-between px-5 transition-all cursor-pointer"
            aria-label="Copy review and open Google"
          >
            {/* Left Google Badge */}
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-xs shrink-0">
              <GoogleGLogo className="w-5 h-5" />
            </div>

            {/* Center Label */}
            <span className="font-bold tracking-tight text-white text-sm sm:text-base">
              {categoryConfig.suggestedCTA}
            </span>

            {/* Right Arrow */}
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 shrink-0">
              <ArrowRight className="w-4 h-4 text-white" />
            </div>
          </button>

          {/* Copied Feedback indicator right below button */}
          {copied && (
            <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-emerald-700 animate-in fade-in slide-in-from-top-1 duration-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Review copied to your clipboard!</span>
            </div>
          )}

          {getPublicRatingRoute(rating) === 'feedback' && (
            <p className="pt-2 text-center text-xs font-semibold text-slate-500">
              Opening a private feedback form so the business team can help.
            </p>
          )}
        </div>

        {/* ── SECTION F: Compact “How It Works?” Guide ── */}
        <div className="mt-7 pt-5 border-t border-slate-100">
          <h3 className="text-center font-bold text-slate-900 text-xs sm:text-sm mb-4">
            How it works?
          </h3>
          <div className="grid grid-cols-3 gap-2 items-start text-center">
            
            {/* Step 1 */}
            <div className="flex flex-col items-center">
              <div className="relative mb-2 flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 border border-blue-100/90 shadow-2xs">
                <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[9px] font-bold text-white shadow-xs">
                  1
                </span>
                <Copy className="h-5 w-5 text-blue-600" />
              </div>
              <p className="text-[11px] font-bold text-slate-900 leading-tight">
                Review copied
              </p>
              <p className="mt-0.5 text-[10px] text-slate-500 leading-tight">
                We&apos;ve copied your review text
              </p>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center">
              <div className="relative mb-2 flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50/80 border border-amber-200/60 shadow-2xs">
                <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[9px] font-bold text-white shadow-xs">
                  2
                </span>
                <GoogleGLogo className="h-5 w-5" />
              </div>
              <p className="text-[11px] font-bold text-slate-900 leading-tight">
                Open on Google
              </p>
              <p className="mt-0.5 text-[10px] text-slate-500 leading-tight">
                Google will open in a new tab
              </p>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center">
              <div className="relative mb-2 flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 border border-emerald-100 shadow-2xs">
                <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[9px] font-bold text-white shadow-xs">
                  3
                </span>
                <div className="flex items-center justify-center rounded-md bg-blue-600 px-2 py-0.5 text-[9px] font-bold text-white shadow-2xs">
                  Post
                </div>
              </div>
              <p className="text-[11px] font-bold text-slate-900 leading-tight">
                Paste &amp; tap Post
              </p>
              <p className="mt-0.5 text-[10px] text-slate-500 leading-tight">
                Paste your review and tap Post
              </p>
            </div>

          </div>
        </div>

      </div>

      {/* ── SECTION G: Minimal Footer ── */}
      <footer className="mt-6 text-center text-xs text-slate-500 flex items-center justify-center gap-1.5">
        <span>Powered by</span>
        <span className="font-bold text-slate-700 tracking-tight">Pixora Funnel</span>
      </footer>

      {/* ── HELPER POSTING MODAL (Ensures customer understands Google hand-off & manual copy fallback) ── */}
      {showHelperModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-sm rounded-[28px] bg-white p-6 shadow-2xl text-center space-y-4 animate-in zoom-in-95 duration-200">
            
            {/* Header Icon */}
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 shadow-xs">
              <GoogleGLogo className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-bold text-slate-900">
                Google is Ready!
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Your review text was copied. To complete your review on Google:
              </p>
            </div>

            {/* 3 Step Instruction Card */}
            <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-3.5 text-left text-xs space-y-2">
              <div className="flex items-start gap-2">
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">1</span>
                <span className="text-slate-700">Click on Google&apos;s review box</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">2</span>
                <span className="text-slate-700"><strong>Paste</strong> your copied text</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">3</span>
                <span className="text-slate-700">Select your stars and tap <strong>Post</strong></span>
              </div>
            </div>

            {/* If popup blocker prevented auto-opening Google */}
            {popupBlockedUrl && (
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1.5">
                <p className="font-semibold">Your browser paused the Google popup.</p>
                <a
                  href={popupBlockedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center justify-center gap-1.5"
                >
                  <span>Tap to Open Google Reviews</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}

            {/* If clipboard copy failed on restricted webview, show manual copy area */}
            {copyFailed && (
              <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-left text-xs space-y-2">
                <p className="font-bold text-rose-800">Please copy your text manually:</p>
                <textarea
                  readOnly
                  value={reviewText}
                  rows={3}
                  className="w-full p-2 rounded-lg bg-white border border-rose-200 text-xs text-slate-800 select-all"
                />
                <button
                  type="button"
                  onClick={async () => {
                    const ok = await copyToClipboard(reviewText);
                    if (ok) {
                      setCopyFailed(false);
                      setCopied(true);
                    }
                  }}
                  className="w-full py-1.5 rounded-lg bg-rose-600 text-white font-semibold text-xs"
                >
                  Select &amp; Copy Review Text
                </button>
              </div>
            )}

            {/* Dismiss / Direct Google Button */}
            <div className="space-y-2 pt-1">
              <a
                href={resolveGoogleReviewUrl()}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setShowHelperModal(false)}
                className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md"
              >
                <span>Continue to Google</span>
                <ExternalLink className="w-4 h-4" />
              </a>

              <a
                href={resolveGoogleMapsUrl()}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setShowHelperModal(false)}
                className="w-full h-10 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center justify-center gap-2"
              >
                <span>Open business on Google Maps</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                type="button"
                onClick={() => setShowHelperModal(false)}
                className="w-full py-2 text-xs font-semibold text-slate-500 hover:text-slate-800"
              >
                Close instructions
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
