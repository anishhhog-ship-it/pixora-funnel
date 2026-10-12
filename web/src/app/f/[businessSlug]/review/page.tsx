'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { reviewEngine, analyticsService } from '@/services';
import { Star, CheckCircle2, Info } from 'lucide-react';

export default function ReviewExperiencePage() {
  const router = useRouter();
  const routeParams = useParams();
  const businessSlug = (routeParams?.businessSlug as string) || 'your-business';

  const [experience, setExperience] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [rating, setRating] = useState<number>(5);

  useEffect(() => {
    analyticsService.trackEvent('experience_started', { slug: businessSlug });
    const storedRating = sessionStorage.getItem('temp_rating');
    if (storedRating) {
      setRating(parseInt(storedRating));
    }
  }, [businessSlug]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    analyticsService.trackEvent('suggestions_generated', { inputLength: experience.length });
    
    // Simulate slight delay for AI feel
    setTimeout(async () => {
      const generated = await reviewEngine.generateReviewSuggestions(experience);
      setSuggestions(generated);
      setIsGenerating(false);
    }, 800);
  };

  const handleUse = (index: number) => {
    setSelectedSuggestionIndex(index);
    analyticsService.trackEvent('suggestion_selected', { index });
    
    // Store selected text
    sessionStorage.setItem('final_review_text', suggestions[index]);
  };

  const handlePostOnGoogle = () => {
    let finaltext = '';
    if (selectedSuggestionIndex !== null) {
      finaltext = suggestions[selectedSuggestionIndex];
    } else if (experience.trim().length > 0) {
      finaltext = experience;
    }
    
    if (!finaltext) return;

    sessionStorage.setItem('final_review_text', finaltext);
    router.push(`/f/${businessSlug}/review/post`);
  };

  return (
    <div className="flex flex-col animate-in fade-in duration-500 pb-12 text-gray-900 w-full max-w-md mx-auto relative z-10">
      
      {/* Stepper Mock */}
      <div className="flex items-center justify-between mb-8 px-4 text-xs font-medium text-white/80">
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 rounded-full border border-white flex items-center justify-center mb-1 bg-white/10">1</div>
          <span>Your Experience</span>
        </div>
        <div className="h-px bg-white/30 flex-grow mx-2 mt-[-20px]"></div>
        <div className="flex flex-col items-center text-white">
          <div className="w-8 h-8 rounded-full bg-[#0B3D2E] border-2 border-white flex items-center justify-center mb-1 shadow-md">2</div>
          <span className="font-bold">AI Suggestion</span>
        </div>
        <div className="h-px bg-white/30 flex-grow mx-2 mt-[-20px]"></div>
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 rounded-full border border-white flex items-center justify-center mb-1 bg-white/10">3</div>
          <span>Post on Google</span>
        </div>
      </div>

      <div className="bg-[#FDFBF7] rounded-[2rem] p-6 shadow-xl w-full">
        <h2 className="text-2xl font-serif font-bold text-center mb-2">Tell us about your experience</h2>
        <p className="text-sm text-center text-gray-600 mb-6">
          Just a few words about your visit. We'll help you turn it into a great review.
        </p>

        <div className="relative mb-6">
          <Textarea 
            placeholder="What did you like or dislike?" 
            className="min-h-[120px] resize-none bg-white border-gray-200 rounded-xl p-4 text-sm focus-visible:ring-[#0B3D2E]"
            value={experience}
            onChange={(e) => setExperience(e.target.value)}
            maxLength={500}
          />
          <div className="absolute bottom-3 right-3 text-xs text-gray-400">
            {experience.length}/500
          </div>
        </div>

        {suggestions.length === 0 ? (
          <Button 
            className="w-full text-base mb-4" 
            onClick={handleGenerate}
            disabled={isGenerating || experience.trim().length === 0}
          >
            {isGenerating ? 'Generating...' : 'Enhance with AI ✨'}
          </Button>
        ) : (
          <div className="mt-8 animate-in slide-in-from-bottom-4">
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="text-[#0B3D2E]">✨</span>
              <h3 className="font-bold text-lg">AI Suggested Reviews</h3>
              <Info className="w-4 h-4 text-gray-400" />
            </div>
            <p className="text-xs text-center text-gray-500 mb-6">Here are a few polished versions of your experience. Choose the one you like or edit it.</p>
            
            <div className="space-y-4">
              {suggestions.map((suggestion, idx) => (
                <Card 
                  key={idx} 
                  className={`p-4 transition-all border-2 rounded-2xl ${
                    selectedSuggestionIndex === idx 
                      ? 'border-[#0B3D2E] bg-[#F2F7F5]' 
                      : 'border-transparent hover:border-gray-200 cursor-pointer shadow-sm'
                  }`}
                  onClick={() => handleUse(idx)}
                >
                  <div className="flex mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-4 h-4 ${i < rating ? 'fill-[#F4B400] text-[#F4B400]' : 'text-gray-200'}`} />
                    ))}
                  </div>
                  <p className="text-sm text-gray-800 leading-relaxed mb-4">{suggestion}</p>
                  
                  <div className="flex justify-end">
                    {selectedSuggestionIndex === idx ? (
                      <div className="bg-[#0B3D2E] text-white rounded-full p-1 -mr-2 -mb-2 shadow-md">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                    ) : (
                      <Button variant="outline" size="sm" className="rounded-full text-xs h-8 px-4 font-medium border-gray-300 text-gray-700">
                        Use this
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>

            <Button 
              className="w-full text-lg mt-8 shadow-lg flex items-center justify-center gap-2"
              size="lg"
              disabled={selectedSuggestionIndex === null}
              onClick={handlePostOnGoogle}
            >
              <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center p-1 mr-2">
                 <svg viewBox="0 0 24 24" width="16" height="16">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.31-1.03 2.41-2.16 3.16v2.62h3.49c2.04-1.89 3.22-4.67 3.22-7.79z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.49-2.62c-.98.66-2.23 1.05-3.79 1.05-2.91 0-5.38-1.97-6.26-4.62H2.12v2.71C3.94 20.48 7.68 23 12 23z" fill="#34A853" />
                  <path d="M5.74 14.15c-.22-.66-.35-1.36-.35-2.15s.13-1.49.35-2.15V7.14H2.12C1.4 8.59 1 10.25 1 12s.4 3.41 1.12 4.86l3.62-2.71z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.07.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.68 1 3.94 3.52 2.12 7.14l3.62 2.71c.88-2.65 3.35-4.47 6.26-4.47z" fill="#EA4335" />
                </svg>
              </div>
              Post on Google <span className="ml-1">→</span>
            </Button>
            <p className="text-[10px] text-center text-gray-400 mt-4 flex items-center justify-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Your review will be posted directly on Google
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
