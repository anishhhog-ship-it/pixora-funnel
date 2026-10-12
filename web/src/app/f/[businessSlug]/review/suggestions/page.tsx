'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Sparkles, ArrowRight, ArrowLeft, Check, Edit2, Star, ShieldCheck } from 'lucide-react';
import { reviewEngine, businessService } from '@/services';
import { Business } from '@/types';

export default function ReviewSuggestionsPage() {
  const router = useRouter();
  const params = useParams();
  const businessSlug = (params?.businessSlug as string) || 'your-business';

  const [business, setBusiness] = useState<Business | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [customText, setCustomText] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    businessService.getBusinessBySlug(businessSlug).then(async (biz) => {
      setBusiness(biz);
      const storedInput = sessionStorage.getItem('temp_experience') || 'Great service and wonderful experience!';
      const generated = await reviewEngine.generateReviewSuggestions(
        storedInput, 
        biz?.name || 'this business', 
        biz?.category
      );
      setSuggestions(generated);
      setCustomText(generated[0] || storedInput);
      setIsLoading(false);
    });
  }, [businessSlug]);

  const handleSelect = (idx: number) => {
    setSelectedIndex(idx);
    setCustomText(suggestions[idx]);
    setIsEditing(false);
  };

  const handleProceedToGoogle = () => {
    const textToPost = customText || suggestions[selectedIndex] || '';
    sessionStorage.setItem('final_review_text', textToPost);
    router.push(`/f/${businessSlug}/review/post`);
  };

  const primaryColor = business?.theme?.primaryColor || '#0B3D2E';
  const secondaryColor = business?.theme?.secondaryColor || '#D4AF37';

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 flex flex-col justify-between">
      <div className="max-w-md w-full mx-auto space-y-6">
        
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <Link
            href={`/f/${businessSlug}/review`}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} className="w-4 h-4 fill-amber-400 text-amber-400" />
            ))}
          </div>
          <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
            5.0 Star Rating
          </span>
        </div>

        {/* Title */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Smart Review Suggestions</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">Choose or Edit Your Review</h1>
          <p className="text-xs text-slate-500">
            Select one of the 1-click tailored suggestions based on your feedback.
          </p>
        </div>

        {/* 3 Variations */}
        {isLoading ? (
          <div className="p-8 text-center text-xs text-slate-500 bg-white rounded-2xl border border-slate-200">
            Generating natural review suggestions...
          </div>
        ) : (
          <div className="space-y-3">
            {suggestions.map((sug, idx) => {
              const isChosen = selectedIndex === idx;
              return (
                <div
                  key={idx}
                  onClick={() => handleSelect(idx)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isChosen
                      ? 'border-blue-600 bg-blue-50/40 ring-2 ring-blue-600/20 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-2 font-semibold">
                    <span className="text-slate-500">Option {idx + 1}</span>
                    {isChosen ? (
                      <span className="text-blue-600 font-bold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        Selected
                      </span>
                    ) : (
                      <span className="text-slate-400 hover:text-slate-600">Select</span>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
                    &ldquo;{sug}&rdquo;
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {/* Editable Review Box */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700">Your Final Review Text:</span>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="text-blue-600 hover:underline flex items-center gap-1 text-[11px] font-semibold"
            >
              <Edit2 className="w-3 h-3" />
              <span>{isEditing ? 'Done Editing' : 'Edit Text'}</span>
            </button>
          </div>

          {isEditing ? (
            <textarea
              rows={4}
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              className="w-full text-xs text-slate-800 border border-slate-200 rounded-xl p-2.5 outline-none focus:border-blue-500"
            />
          ) : (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-800 leading-relaxed">
              {customText}
            </div>
          )}
        </div>

        {/* Primary Action Button */}
        <button
          onClick={handleProceedToGoogle}
          style={{ backgroundColor: secondaryColor || '#2563EB' }}
          className="w-full py-3.5 px-6 rounded-2xl text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer"
        >
          <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4" />
          <span>Continue to Post on Google →</span>
        </button>

        <div className="text-center text-[10px] text-slate-400 flex items-center justify-center gap-1">
          <ShieldCheck className="w-3 h-3 text-emerald-600" />
          <span>Authentic customer experience verified</span>
        </div>

      </div>

      <div className="text-center text-[11px] text-slate-400 py-4">
        Powered by Pixora Automations ❤️
      </div>
    </div>
  );
}
