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

  useEffect(() => {
    const storedRating = sessionStorage.getItem('temp_rating');
    if (storedRating) {
      setRating(parseInt(storedRating, 10));
    }
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
    setIsSubmitting(false);
    setIsSubmitted(true);
  };

  const bizName = business?.name || 'our team';

  return (
    <div className="flex flex-col animate-in fade-in duration-500 pb-12 w-full max-w-md mx-auto relative z-10 px-2">
      {/* Header Notice */}
      <div className="flex items-center justify-between mb-6 px-3">
        <button 
          onClick={() => router.back()} 
          className="text-white/80 hover:text-white flex items-center text-xs font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </button>
        <div className="flex items-center gap-1.5 bg-black/25 backdrop-blur-md px-3 py-1 rounded-full text-[11px] text-emerald-300 font-medium border border-white/10">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Private Resolution Shield</span>
        </div>
      </div>

      {!isSubmitted ? (
        <Card className="w-full rounded-[2rem] p-6 shadow-2xl border-0 bg-[#FDFBF7] text-gray-900">
          <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-amber-800">
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
                      className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
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
                className="min-h-[110px] bg-white border-gray-200 rounded-xl text-sm focus-visible:ring-[#0B3D2E] resize-none"
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
                  className="bg-white border-gray-200 rounded-xl text-xs h-9"
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
                  className="bg-white border-gray-200 rounded-xl text-xs h-9"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                className="w-full text-base bg-[#0B3D2E] hover:bg-[#082e22] text-white shadow-lg rounded-xl h-12"
                disabled={isSubmitting || (!message.trim() && selectedTags.length === 0)}
              >
                {isSubmitting ? 'Sending directly to Owner...' : 'Send Private Feedback →'}
              </Button>
            </div>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-500 pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>100% Private. This will <strong>never</strong> be published on Google.</span>
            </div>
          </form>
        </Card>
      ) : (
        <Card className="w-full rounded-[2rem] p-7 shadow-2xl border-0 bg-[#FDFBF7] text-gray-900 text-center animate-in zoom-in-95 duration-300">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-700">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <h2 className="text-2xl font-serif font-bold mb-2">Feedback Received Privately</h2>
          <p className="text-xs text-gray-600 leading-relaxed mb-6">
            Thank you for bringing this directly to our attention. Your note has been delivered straight to the management of <strong className="text-gray-900">{bizName}</strong>.
          </p>

          <div className="bg-white border border-gray-200 rounded-2xl p-4 text-left mb-6 shadow-sm">
            <p className="text-xs font-semibold text-gray-800 mb-1">What happens next?</p>
            <ul className="text-xs text-gray-600 space-y-1.5 list-disc pl-4">
              <li>Our store manager reviews your notes immediately.</li>
              {phone ? (
                <li>We will reach out to you at <span className="font-semibold text-gray-800">{phone}</span> with an apology and a resolution.</li>
              ) : (
                <li>Our kitchen and floor staff will take corrective action.</li>
              )}
              <li>No negative review was posted to your public Google profile.</li>
            </ul>
          </div>

          <Button
            onClick={() => router.push(`/f/${businessSlug}`)}
            className="w-full bg-[#0B3D2E] hover:bg-[#082e22] text-white rounded-xl h-11"
          >
            Return to Home
          </Button>
        </Card>
      )}
    </div>
  );
}
