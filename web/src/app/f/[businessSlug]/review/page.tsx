'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { reviewEngine, analyticsService, businessService } from '@/services';
import { Business } from '@/types';
import { 
  Star, 
  CheckCircle2,
  Info, 
  ShieldCheck, 
   ArrowRight,
} from 'lucide-react';

export default function ReviewExperiencePage() {
  const router = useRouter();
  const routeParams = useParams();
  const businessSlug = (routeParams?.businessSlug as string) || 'your-business';

  const [business, setBusiness] = useState<Business | null>(null);
  // Custom writing & rating state
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [experience, setExperience] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  useEffect(() => {
    analyticsService.trackEvent('experience_started', { slug: businessSlug });

    // Load business details for personalized copy and branding
    businessService.getBusinessBySlug(businessSlug).then(async (biz) => {
      if (biz) {
        setBusiness(biz);
      }
    });

    // Check pre-existing rating from landing page
    Promise.resolve().then(() => {
      const storedRating = sessionStorage.getItem('temp_rating');
      if (storedRating) {
        const parsed = parseInt(storedRating, 10);
        if (!isNaN(parsed) && parsed > 0) {
          setRating(parsed);
        }
      }
    });
  }, [businessSlug]);

  const primaryColor = business?.theme?.primaryColor || '#0B3D2E';

  // ── Handler 1: Post 1-Click Selected Quick Review on Google ──
  // ── Handler 2: Custom Review -> AI Enhance ──
  const handleGenerate = async () => {
    if (!experience.trim()) return;
    setIsGenerating(true);
    setGenerationError(null);
    analyticsService.trackEvent('suggestions_generated', { inputLength: experience.length });
    sessionStorage.setItem('temp_experience', experience.trim());
    const bizId = business?.id || businessSlug;

    void (async () => {
      try {
        const generated = await reviewEngine.generateReviewSuggestions(
          experience,
          business?.name || 'this business',
          business?.category,
          bizId
        );
        setSuggestions(generated);
        if (generated.length === 0) {
          setGenerationError('No suggestions were generated. You can continue with your own words.');
        }
      } catch {
        setGenerationError('Suggestions are unavailable right now. You can continue with your own words.');
      } finally {
        setIsGenerating(false);
      }
    })();
  };

  const handleUseSuggestion = (index: number) => {
    setSelectedSuggestionIndex(index);
    analyticsService.trackEvent('suggestion_selected', { index });
    sessionStorage.setItem('final_review_text', suggestions[index]);
  };

  // ── Handler 3: Customer-controlled Google hand-off for every rating ──
  const handlePostCustomOnGoogle = () => {
    let finaltext = '';
    if (selectedSuggestionIndex !== null && suggestions[selectedSuggestionIndex]) {
      finaltext = suggestions[selectedSuggestionIndex];
    } else if (experience.trim().length > 0) {
      finaltext = experience.trim();
    }

    if (!finaltext) return;

    sessionStorage.setItem('final_review_text', finaltext);
    sessionStorage.setItem('temp_rating', rating.toString());
    analyticsService.trackEvent('custom_review_google_posted', {
      slug: businessSlug,
      rating,
    });
    router.push(`/f/${businessSlug}/review/post`);
  };

  // ── Optional private note, never a replacement for the Google hand-off ──
  const handleSendPrivateFeedback = () => {
    analyticsService.trackEvent('private_feedback_requested', {
      slug: businessSlug,
      rating,
    });
    sessionStorage.setItem('temp_rating', rating.toString());
    sessionStorage.setItem('temp_experience', experience.trim());
    router.push(`/f/${businessSlug}/feedback`);
  };

  return (
    <div className="relative z-10 mx-auto flex w-full max-w-md flex-col pb-12 text-gray-900 animate-in fade-in duration-500">
      
      {/* ── Stepper Navigation ── */}
      <div className="mb-7 flex items-center justify-between px-4 text-xs font-medium text-white/80" aria-label="Review progress">
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 rounded-full border border-white flex items-center justify-center mb-1 bg-white/10">1</div>
          <span>Your Experience</span>
        </div>
        <div className="h-px bg-white/30 flex-grow mx-2 mt-[-20px]" />
        <div className="flex flex-col items-center text-white">
          <div 
            className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white mb-1 shadow-md font-bold" 
            aria-current="step" 
            style={{ backgroundColor: primaryColor }}
          >
            2
          </div>
           <span className="font-bold">Your Review</span>
        </div>
        <div className="h-px bg-white/30 flex-grow mx-2 mt-[-20px]" />
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 rounded-full border border-white flex items-center justify-center mb-1 bg-white/10">3</div>
           <span>Choose where to share</span>
        </div>
      </div>

      {/* ── Main Container Card ── */}
      <div className="w-full rounded-[2rem] border border-white/60 bg-[#FDFBF7] p-5 sm:p-7 shadow-[0_24px_70px_rgba(0,0,0,0.22)]">
        
        <div>
            <div className="text-center mb-4">
              <h2 className="mb-1 font-serif text-2xl font-bold text-stone-900">
                Rate &amp; Share Your Experience
              </h2>
              <p className="text-xs text-stone-600 max-w-xs mx-auto">
                Tap the stars below to rate your visit
              </p>
            </div>

            {/* 5 Interactive Clickable Stars */}
            <div className="mb-3 flex justify-center gap-2" role="group" aria-label="Select a rating">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className="p-1 cursor-pointer transition-transform hover:scale-110 active:scale-125"
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                  aria-label={`Rate ${star} stars`}
                  aria-pressed={rating === star}
                >
                  <Star
                    className={`h-9 w-9 transition-all duration-200 ${
                      star <= (hoverRating || rating)
                        ? 'fill-[#F4B400] text-[#F4B400] drop-shadow-xs'
                        : 'text-stone-300 stroke-stone-300 fill-transparent'
                    }`}
                  />
                </button>
              ))}
            </div>

            {/* Rating status: every rating stays under the customer's control */}
            <div className="mb-4 text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-900">
                <ShieldCheck className="h-3.5 w-3.5 text-blue-700" />
                <span>{rating} Star{rating > 1 ? 's' : ''} · You choose where to share</span>
              </span>
            </div>

            {/* Textarea Input */}
            <div className="relative mb-4">
              <Textarea
                placeholder="Describe what actually happened during your visit. A few words is enough…"
                className="funnel-focus-ring min-h-[110px] resize-none rounded-xl border-stone-200 bg-white p-3.5 text-xs sm:text-sm text-stone-900 focus-visible:ring-[#0B3D2E]"
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                maxLength={500}
              />
              <div className="absolute bottom-2.5 right-3 text-[10px] text-stone-400">
                {experience.length}/500
              </div>
            </div>

            {/* Customer-authored suggestions and Google hand-off */}
            {rating > 3 ? (
              <div>
                {suggestions.length === 0 ? (
                  <div className="space-y-2.5">
                    <Button
                      className="funnel-focus-ring w-full text-sm font-bold shadow-md transition-all hover:-translate-y-0.5 rounded-xl py-5 cursor-pointer text-white"
                      onClick={handleGenerate}
                      disabled={isGenerating || experience.trim().length === 0}
                      style={{ backgroundColor: primaryColor }}
                      aria-busy={isGenerating}
                    >
                       {isGenerating ? 'Formatting your words…' : 'Suggest clearer wording ✨'}
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      className="w-full text-xs font-semibold py-2.5 rounded-xl border-stone-300 text-stone-700 hover:bg-stone-100 cursor-pointer flex items-center justify-center gap-1.5"
                      disabled={experience.trim().length === 0}
                      onClick={handlePostCustomOnGoogle}
                    >
                      <span>Post on Google Directly with My Words</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ) : (
                  /* AI Suggestions Chosen */
                  <div className="mt-4 animate-in slide-in-from-bottom-3">
                    <div className="flex items-center justify-center gap-1.5 mb-2">
                      <span className="text-[#0B3D2E]">✨</span>
                       <h3 className="font-bold text-sm text-stone-900">Wording from your own words</h3>
                      <Info className="w-3.5 h-3.5 text-stone-400" />
                    </div>
                    <p className="text-[11px] text-center text-stone-500 mb-4">
                       Choose the version you like best, then review it before Google opens:
                    </p>

                    <div className="space-y-3 mb-5">
                      {suggestions.map((suggestion, idx) => (
                        <Card
                          key={idx}
                          role="button"
                          tabIndex={0}
                          aria-pressed={selectedSuggestionIndex === idx}
                          onClick={() => handleUseSuggestion(idx)}
                          className={`funnel-focus-ring cursor-pointer rounded-2xl border-2 p-3.5 transition-all text-left ${
                            selectedSuggestionIndex === idx
                              ? 'border-[#0B3D2E] bg-[#F2F7F5]'
                              : 'border-transparent shadow-xs hover:border-stone-200 bg-white'
                          }`}
                          style={selectedSuggestionIndex === idx ? { borderColor: primaryColor } : undefined}
                        >
                          <div className="flex mb-1.5">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className="w-3.5 h-3.5 fill-[#F4B400] text-[#F4B400]" />
                            ))}
                          </div>
                          <p className="text-xs text-stone-800 leading-relaxed mb-3">{suggestion}</p>
                          <div className="flex justify-end">
                            {selectedSuggestionIndex === idx ? (
                              <div 
                                className="text-white rounded-full p-1 shadow-sm"
                                style={{ backgroundColor: primaryColor }}
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </div>
                            ) : (
                              <span className="text-[11px] font-semibold text-stone-600 bg-stone-100 px-2.5 py-1 rounded-full">
                                Use this
                              </span>
                            )}
                          </div>
                        </Card>
                      ))}
                    </div>

                    <Button
                      className="funnel-focus-ring w-full text-sm font-bold shadow-md transition-all hover:-translate-y-0.5 rounded-xl py-5 cursor-pointer text-white flex items-center justify-center gap-2"
                      disabled={selectedSuggestionIndex === null}
                      style={{ backgroundColor: primaryColor }}
                      onClick={handlePostCustomOnGoogle}
                    >
                      <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center p-0.5 mr-1">
                        <svg viewBox="0 0 24 24" width="14" height="14">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.31-1.03 2.41-2.16 3.16v2.62h3.49c2.04-1.89 3.22-4.67 3.22-7.79z" fill="#4285F4" />
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.49-2.62c-.98.66-2.23 1.05-3.79 1.05-2.91 0-5.38-1.97-6.26-4.62H2.12v2.71C3.94 20.48 7.68 23 12 23z" fill="#34A853" />
                          <path d="M5.74 14.15c-.22-.66-.35-1.36-.35-2.15s.13-1.49.35-2.15V7.14H2.12C1.4 8.59 1 10.25 1 12s.4 3.41 1.12 4.86l3.62-2.71z" fill="#FBBC05" />
                          <path d="M12 5.38c1.62 0 3.07.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.68 1 3.94 3.52 2.12 7.14l3.62 2.71c.88-2.65 3.35-4.47 6.26-4.47z" fill="#EA4335" />
                        </svg>
                      </div>
                      <span>Post on Google →</span>
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <Button
                  type="button"
                  disabled={!experience.trim()}
                  className="funnel-focus-ring w-full rounded-xl bg-slate-900 py-5 text-sm font-bold text-white shadow-md transition-all hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={handlePostCustomOnGoogle}
                >
                  <ArrowRight className="mr-2 h-4 w-4" />
                  Continue to Google with My Words
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="funnel-focus-ring w-full rounded-xl border-amber-300 py-3 text-xs font-semibold text-amber-900 hover:bg-amber-50"
                  onClick={handleSendPrivateFeedback}
                >
                  <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
                  Also send a private note to the owner
                </Button>
                <p className="text-center text-[10px] text-stone-500">Google opens for you to review and submit. Pixora does not post on your behalf.</p>
              </div>
            )}

            {isGenerating && (
              <div className="mt-3 rounded-2xl border border-blue-100 bg-blue-50/70 px-4 py-3 text-center text-xs text-blue-800" role="status" aria-live="polite">
                 Formatting only the facts you supplied…
              </div>
            )}

            {generationError && (
              <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-center text-xs text-amber-900" role="status">
                {generationError}
              </div>
            )}

            {/* Optional owner note remains separate from the Google hand-off */}
            <div className="mt-5 pt-3 border-t border-stone-200/60 text-center">
              <p className="text-[10px] text-stone-500">Your rating and words stay under your control.</p>
            </div>
          </div>
         </div>
       </div>
   );
}
