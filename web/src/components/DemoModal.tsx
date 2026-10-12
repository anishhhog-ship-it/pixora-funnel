'use client';

import { useState } from 'react';
import Link from 'next/link';
import { X, Play, Sparkles, Star, QrCode, Monitor, CheckCircle, ArrowRight } from 'lucide-react';

interface DemoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DemoModal({ isOpen, onClose }: DemoModalProps) {
  const [activeStep, setActiveStep] = useState(0);

  if (!isOpen) return null;

  const demoSteps = [
    {
      title: '1. Customer scans table or counter QR',
      description: 'Customer opens camera and points at the branded acrylic stand or taps the NFC card. No app download or sign-in needed.',
      preview: (
        <div className="flex flex-col items-center justify-center p-6 bg-slate-900 rounded-2xl text-white text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
            <QrCode className="w-10 h-10 text-blue-400" />
          </div>
          <div className="text-sm font-bold">Instant Camera Recognition</div>
          <div className="text-xs text-slate-400 max-w-xs">
            Directly redirects to funnel.pixoraautomations.com/f/your-business in under 1 second.
          </div>
        </div>
      )
    },
    {
      title: '2. Smart Review Suggestions in 1 Tap',
      description: 'Customer picks 5 stars. AI generates customized, genuine praise for your staff, ambiance or best dishes.',
      preview: (
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              1-Click Smart Suggestion
            </span>
            <span className="text-amber-500 font-bold">★★★★★</span>
          </div>
          <div className="p-2.5 rounded-xl bg-white border border-blue-200 text-xs text-slate-800 shadow-2xs font-medium">
            &ldquo;Exceptional service and mouthwatering dishes! The staff was courteous and the atmosphere was vibrant. Will visit again soon!&rdquo;
          </div>
          <div className="text-[10px] text-slate-500 text-center">
            Copied to clipboard and redirects straight to Google Maps review box!
          </div>
        </div>
      )
    },
    {
      title: '3. Instant Google Maps Submission',
      description: 'The customer clicks "Post on Google" and pastes the pre-written review with 1 tap.',
      preview: (
        <div className="flex flex-col items-center justify-center p-6 bg-blue-50 border border-blue-100 rounded-2xl text-center space-y-2">
          <div className="w-10 h-10 rounded-full bg-white shadow-xs flex items-center justify-center">
            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
          </div>
          <div className="text-sm font-bold text-slate-900">Google Business Profile Review Published</div>
          <p className="text-xs text-slate-600 max-w-xs">
            Your Google Maps star rating and review count increase immediately!
          </p>
        </div>
      )
    },
    {
      title: '4. Automatic AI Response & Analytics',
      description: 'Your business dashboard logs the review and can automatically post a courteous thank-you response.',
      preview: (
        <div className="p-4 bg-slate-900 rounded-2xl text-white space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-mono">Live Sync</span>
            <span className="text-emerald-400 font-semibold text-[10px]">Auto-Replied in 30s</span>
          </div>
          <div className="text-xs text-slate-300 bg-white/10 p-2.5 rounded-lg border border-white/10">
            &ldquo;Thank you so much! We are delighted you enjoyed your visit and look forward to welcoming you back soon!&rdquo;
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-2">
            <Play className="w-3 h-3 fill-current" />
            <span>Interactive Demo Walkthrough</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
            How Pixora Funnel Works in Real Life
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            See the 4-step sequence from customer scan to verified 5-star Google review.
          </p>
        </div>

        {/* Step Tabs */}
        <div className="grid grid-cols-4 gap-2 mb-5">
          {demoSteps.map((step, idx) => (
            <button
              key={idx}
              onClick={() => setActiveStep(idx)}
              className={`py-2 px-2 text-center rounded-xl text-xs font-semibold border transition-all ${
                activeStep === idx
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              Step {idx + 1}
            </button>
          ))}
        </div>

        {/* Step Content */}
        <div className="space-y-4 mb-6">
          <div className="space-y-1">
            <h4 className="text-base font-bold text-slate-900">{demoSteps[activeStep].title}</h4>
            <p className="text-xs text-slate-600 leading-relaxed">{demoSteps[activeStep].description}</p>
          </div>

          <div className="min-h-[170px] flex items-center justify-center">
            <div className="w-full">
              {demoSteps[activeStep].preview}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            Ready to experience it with your business?
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => setActiveStep((prev) => (prev + 1) % demoSteps.length)}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold"
            >
              Next Step
            </button>
            <Link
              href="/onboarding"
              onClick={onClose}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors"
            >
              <span>Start 1-Day Trial</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
