'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Star, ShieldCheck, HeartHandshake, CheckCircle2, ArrowLeft } from 'lucide-react';
import { businessService, reviewService, analyticsService } from '@/services';
import { Business } from '@/types';

const ISSUE_TAGS = [
  'Slow Service',
  'Food Quality / Taste',
  'Staff Behavior',
  'Long Waiting Time',
  'Cleanliness & Hygiene',
  'Incorrect Order',
  'High Noise / Ambience',
  'Billing Issue'
];

export default function PrivateFeedbackPage() {
  const router = useRouter();
  const params = useParams();
  const businessSlug = (params?.businessSlug as string) || 'your-business';

  const [business, setBusiness] = useState<Business | null>(null);
  const [rating, setRating] = useState<number>(3);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    Promise.resolve().then(() => {
      const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
      const urlRating = urlParams?.get('rating');
      const urlExp = urlParams?.get('text');
      const storedRating = urlRating || sessionStorage.getItem('temp_rating');
      if (storedRating) {
        const parsed = parseInt(storedRating, 10);
        if (!isNaN(parsed) && parsed > 0 && parsed <= 5) {
          setRating(parsed);
          sessionStorage.setItem('temp_rating', parsed.toString());
        }
      }
      const storedExp = urlExp || sessionStorage.getItem('temp_experience');
      if (storedExp) setMessage(storedExp);
    });
    businessService.getBusinessBySlug(businessSlug).then(setBusiness);
    analyticsService.trackEvent('negative_feedback_intercepted', { slug: businessSlug });
  }, [businessSlug]);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() && selectedTags.length === 0) return;

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await reviewService.submitPrivateFeedback({
        businessId: business?.businessId || 'biz_custom',
        businessSlug,
        rating,
        tags: selectedTags,
        message,
        customerName: name.trim() || 'Anonymous Guest',
        customerPhone: phone.trim() || 'Not provided',
      });

      analyticsService.trackEvent('negative_feedback_resolved', { slug: businessSlug, rating });
      setIsSubmitted(true);
    } catch {
      setSubmitError('We could not send your note right now. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const bizName = business?.name || 'our team';

  return (
    <div className="relative z-10 mx-auto flex w-full max-w-md flex-col px-2 pb-12 animate-in fade-in duration-500">
      {/* Header Notice */}
      <div className="flex items-center justify-between mb-4 px-1">
        <button 
          onClick={() => router.back()} 
          className="funnel-focus-ring flex items-center rounded-lg text-xs font-semibold text-slate-600 transition-colors hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Review
        </button>
        <div className="flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-800 shadow-2xs">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Direct Feedback</span>
        </div>
      </div>

      {!isSubmitted ? (
         <Card className="w-full rounded-[2rem] border border-white/60 bg-[#FDFBF7] p-6 text-gray-900 shadow-[0_24px_70px_rgba(0,0,0,0.22)] sm:p-7">
           <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-800">
            <HeartHandshake className="w-6 h-6" />
          </div>

          <h2 className="text-2xl font-serif font-bold text-center mb-1 text-gray-900">
            We are deeply sorry.
          </h2>
          <p className="text-xs text-center text-gray-600 mb-5 leading-relaxed max-w-[300px] mx-auto">
            Your visit should have been flawless. Please tell the management team directly what fell short so we can make this right.
          </p>

          <div className="flex justify-center items-center gap-1.5 bg-gray-100 py-2 px-4 rounded-full w-fit mx-auto mb-6">
            <span className="text-xs font-semibold text-gray-600 mr-1">Your rating:</span>
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                className={`w-4 h-4 ${
                  s <= rating ? 'fill-amber-500 text-amber-500' : 'text-gray-300'
                }`}
              />
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">
                What could we have done better? (Select all that apply)
              </label>
              <div className="flex flex-wrap gap-1.5">
                {ISSUE_TAGS.map((tag) => {
                  const active = selectedTags.includes(tag);
                   return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      aria-pressed={active}
                      className={`funnel-focus-ring rounded-full border px-3 py-1.5 text-xs transition-all ${
                        active 
                          ? 'bg-[#0B3D2E] text-white border-[#0B3D2E] shadow-sm scale-[1.02]' 
                          : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Tell the manager what happened:
              </label>
              <Textarea
                placeholder="Please describe your experience in detail. Your feedback goes directly to the owner/manager..."
                 className="funnel-focus-ring min-h-[110px] resize-none rounded-xl border-gray-200 bg-white text-sm focus-visible:ring-[#0B3D2E]"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                  Your Name (Optional)
                </label>
                <Input
                  placeholder="e.g. Rahul Verma"
                   className="funnel-focus-ring h-9 rounded-xl border-gray-200 bg-white text-xs"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                  WhatsApp / Phone (For resolution)
                </label>
                <Input
                  placeholder="+91 92573..."
                   className="funnel-focus-ring h-9 rounded-xl border-gray-200 bg-white text-xs"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                 className="funnel-focus-ring h-12 w-full rounded-xl text-base text-white shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl"
                 style={{ backgroundColor: business?.theme?.primaryColor || '#0B3D2E' }}
                disabled={isSubmitting || (!message.trim() && selectedTags.length === 0)}
              >
                {isSubmitting ? 'Sending directly to Owner...' : 'Send Private Feedback →'}
              </Button>
            </div>

            {submitError && (
              <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-center text-xs text-rose-700" role="alert">
                {submitError}
              </p>
            )}

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-500 pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
             <span>Private feedback stays in this business&apos;s resolution flow.</span>
            </div>
          </form>
        </Card>
      ) : (
         <Card className="w-full rounded-[2rem] border border-white/60 bg-[#FDFBF7] p-7 text-center text-gray-900 shadow-[0_24px_70px_rgba(0,0,0,0.22)] animate-in zoom-in-95 duration-300">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-700">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <h2 className="text-2xl font-serif font-bold mb-2">Feedback Received Privately</h2>
          <p className="text-xs text-gray-600 leading-relaxed mb-6">
            Thank you for bringing this directly to our attention. Your note has been delivered straight to the management of <strong className="text-gray-900">{bizName}</strong>.
          </p>

          <div className="bg-white border border-gray-200 rounded-2xl p-4 text-left mb-6 shadow-sm">
            <p className="text-xs font-semibold text-gray-800 mb-1">What happens next?</p>
             <ul className="list-disc space-y-1.5 pl-4 text-xs text-gray-600">
               <li>Your note is available to the business team through its private inbox.</li>
               {phone ? (
                 <li>The team can use the contact details you shared at <span className="font-semibold text-gray-800">{phone}</span> to follow up.</li>
               ) : (
                 <li>The team can review the issue and decide on the appropriate follow-up.</li>
               )}
               <li>Your private note is not published as a Google review.</li>
            </ul>
          </div>

          <Button
            onClick={() => router.push(`/f/${businessSlug}`)}
             className="funnel-focus-ring h-11 w-full rounded-xl text-white transition-all hover:-translate-y-0.5 hover:shadow-lg"
             style={{ backgroundColor: business?.theme?.primaryColor || '#0B3D2E' }}
          >
            Return to Home
          </Button>
        </Card>
      )}
    </div>
  );
}
