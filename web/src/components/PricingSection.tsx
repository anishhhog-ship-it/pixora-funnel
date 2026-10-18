'use client';

import Link from 'next/link';
import { useState } from 'react';
import PaymentGatewayModal from '@/components/payment/PaymentGatewayModal';
import Image from 'next/image';
import { 
  Check, 
  ArrowRight, 
  Sparkles, 
  Shield, 
  Smartphone, 
  MessageCircle, 
  Crown, 
  Truck, 
  Zap,
  Info
} from 'lucide-react';

const plan1Features = [
  'Lifetime Full Software Access',
  'AI Auto Reply System Activated for Life',
  'Custom Branded QR Review Funnel',
  '1-Tap Smart Review Assistance for Guests',
  'Google Business Profile Direct Routing',
  'Private Feedback Resolution Shield (1-3 Stars)',
  'Digital Menu & Service Price List Hosting',
  'Client Dashboard & Scan Analytics',
  'WhatsApp & Email Technical Support',
];

const plan2Features = [
  'Lifetime Full Software Access',
  'AI Auto Reply System Activated for Life',
  'Custom Branded NFC Smart Tap Review Card Included',
  'Free Express Doorstep Delivery in India',
  'No account cap or renewal charges',
  'Unlimited Contactless NFC Taps & QR Scans',
  '1-Tap Smart Review Assistance for Guests',
  'Google Business Profile Direct Routing',
  'Private Feedback Resolution Shield (1-3 Stars)',
  'Digital Menu & Service Price List Hosting',
  'Priority 1-on-1 WhatsApp Support & VIP Setup',
];

const physicalAddons = [
  {
    name: 'Extra NFC Smart Tap Card',
    price: '₹499',
    description: 'Additional pocket card for waiters and front-desk staff to present to guests.',
    badge: 'Hardware',
  },
  {
    name: 'Premium Acrylic Table Stand',
    price: '₹799',
    description: 'Durable clear acrylic stand with high-contrast printed QR code for dining tables.',
    badge: 'Durable',
  },
  {
    name: 'NFC + Stand Combo Pack',
    price: '₹1,199',
    description: 'Acrylic tabletop stand with integrated dual-sided NFC chip and QR code.',
    badge: 'Popular',
  },
  {
    name: 'Multi-Table Pack (10 Stands)',
    price: '₹3,499',
    description: 'Complete kit for larger restaurants and multi-floor outlets with unique table URLs.',
    badge: 'Pro Kit',
  },
];

export default function PricingSection() {
  const [showGatewayModal, setShowGatewayModal] = useState(false);
  const [gatewayPlan, setGatewayPlan] = useState({
    planId: 'lifetime_software',
    planName: 'Lifetime Software',
    amount: 2599,
  });
  return (
    <section id="pricing" className="py-20 md:py-24 bg-white border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold uppercase tracking-wider mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
             LIFETIME PLANS · REVIEW PLAN TERMS BELOW
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Simple Pricing. Zero Monthly Software Fees.
          </h2>
          <p className="mt-3 text-slate-600 text-sm sm:text-base leading-relaxed">
             Test the complete system with our 1-day free trial, then choose lifetime software access with or without NFC doorstep delivery.
          </p>

          {/* Auto Reply Policy Callout */}
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium">
            <Info className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
                <strong>Auto Reply System:</strong> Auto Reply is turned off for trial accounts and becomes available with either lifetime plan.
            </span>
          </div>
        </div>

         <div className="mx-auto mb-12 max-w-3xl rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-center text-xs leading-relaxed text-slate-600 shadow-sm sm:text-left">
           <span className="font-bold text-slate-800">Offer terms:</span> the plan cards below are the source of truth for software access, hardware inclusion, and trial behavior. Contact the team if you need help choosing an option.
         </div>

        {/* 2 Main Pricing Cards Side-by-Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto mb-16 items-stretch">
          
           {/* PLAN 1: ₹2,599 Lifetime Software */}
          <div className="rounded-3xl bg-white border-2 border-slate-200 shadow-md hover:border-slate-300 transition-all p-7 sm:p-9 flex flex-col justify-between">
            <div>
              {/* Badge & Title */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                  Plan Option 1
                </span>
                <span className="text-xs font-bold text-slate-500">
                   Lifetime access
                </span>
              </div>

               <h3 className="text-2xl font-bold text-slate-900">Lifetime Software</h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                 Full lifetime software suite for 1 business location (without physical NFC card)
              </p>

              {/* Price Row */}
              <div className="mt-5 pb-5 border-b border-slate-100">
                 <div className="flex items-baseline gap-2">
                   <span className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">₹2,599</span>
                   <span className="text-xs text-slate-500 font-semibold">/ Lifetime (Without NFC Card)</span>
                 </div>
                 <p className="text-xs text-emerald-600 font-semibold mt-1.5 flex items-center gap-1">
                   <Zap className="w-3.5 h-3.5" />
                   <span>Turns ON AI Auto Reply System for Life</span>
                </p>
              </div>

              {/* Features List */}
              <div className="py-6 space-y-3">
                <div className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-500 font-medium">
                  <span className="w-4 h-4 text-center font-bold text-slate-400 shrink-0">✕</span>
                  <span>Without NFC Review Card (Software only)</span>
                </div>
                {plan1Features.map((feat, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700">
                    <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* CTAs */}
            <div className="pt-4 border-t border-slate-100 flex flex-col gap-3">
              <button
                type="button"
                onClick={() => {
                  setGatewayPlan({
                     planId: 'lifetime_software',
                     planName: 'Lifetime Software',
                    amount: 2599,
                  });
                  setShowGatewayModal(true);
                }}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-black text-white text-sm font-bold shadow-md hover:shadow-lg transition-all cursor-pointer"
              >
                 <span>Activate Lifetime Software Online (₹2,599)</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <Link
                href="/onboarding"
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs sm:text-sm font-semibold transition-all text-center"
              >
                <span>Start 1-Day Trial First</span>
              </Link>
            </div>
          </div>

           {/* PLAN 2: ₹2,999 Lifetime Software + NFC doorstep delivery — HIGHLIGHTED & RECOMMENDED */}
          <div className="relative rounded-3xl bg-white border-2 border-blue-600 shadow-xl p-7 sm:p-9 flex flex-col justify-between overflow-hidden">
            {/* Top highlight ribbon */}
            <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-extrabold px-5 py-1.5 rounded-bl-2xl shadow-sm flex items-center gap-1.5 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
               <span>LIFETIME ACCESS · NO ACCOUNT CAP</span>
            </div>

            <div>
              {/* Badge & Title */}
              <div className="flex items-center gap-2 mb-3 pt-2">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  <Crown className="w-3.5 h-3.5 text-amber-500" />
                   <span>Lifetime Software + NFC doorstep delivery</span>
                </span>
                <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                  Doorstep Delivery
                </span>
              </div>

               <h3 className="text-2xl font-bold text-slate-900">Lifetime Software + NFC doorstep delivery</h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                 Complete lifetime software suite with a Custom Branded NFC Review Card delivered to your door. No account cap.
              </p>

              {/* Price Row */}
              <div className="mt-5 pb-5 border-b border-slate-100">
                 <div className="flex items-baseline gap-2">
                   <span className="text-4xl sm:text-5xl font-extrabold text-blue-600 tracking-tight">₹2,999</span>
                   <span className="text-xs text-blue-700 font-bold">/ Lifetime access</span>
                 </div>
                 <p className="text-xs text-blue-700 font-semibold mt-1.5 flex items-center gap-1">
                   <Truck className="w-3.5 h-3.5 text-blue-600" />
                   <span>Includes Physical NFC Card + Lifetime Software & Auto Reply</span>
                </p>
              </div>

              {/* Prominent NFC Review Card Image Showcase */}
              <div className="mt-5 mb-5 rounded-2xl overflow-hidden border-2 border-blue-100 shadow-md relative group">
                <div className="relative w-full h-44 sm:h-52 bg-slate-900">
                  <Image
                    src="/products/nfc-review-card.jpg"
                    alt="Custom Contactless NFC Google Review Tap Card"
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent flex flex-col justify-end p-4">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-600/90 text-white text-[11px] font-bold w-max mb-1">
                      <Smartphone className="w-3.5 h-3.5" />
                      <span>Included With This Plan</span>
                    </div>
                    <p className="text-xs font-semibold text-white leading-tight">
                       Custom Branded NFC Google Review Card — Guests tap their phone to open the review journey.
                    </p>
                  </div>
                </div>
              </div>

              {/* Features List */}
              <div className="py-2 space-y-3">
                {plan2Features.map((feat, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-800">
                    <div className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                    <span className={idx === 0 || idx === 1 ? 'font-bold text-blue-900' : ''}>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* CTAs */}
            <div className="pt-6 border-t border-slate-100 flex flex-col gap-3">
              <button
                type="button"
                onClick={() => {
                  setGatewayPlan({
                     planId: 'lifetime_software_nfc',
                     planName: 'Lifetime Software + NFC doorstep delivery',
                    amount: 2999,
                  });
                  setShowGatewayModal(true);
                }}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm sm:text-base font-bold shadow-md hover:shadow-xl transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                 <span>Activate Lifetime Software + NFC Online (₹2,999)</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 pt-1 gap-2">
                <div className="flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-emerald-600" />
                  <span>Free doorstep delivery all over India</span>
                </div>
                <a
                  href="https://wa.me/919257378047"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-semibold text-emerald-700 hover:underline"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Direct Order: +91 92573 78047</span>
                </a>
              </div>
            </div>
          </div>

        </div>

        {/* Optional Physical Hardware Add-Ons */}
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <h3 className="text-lg sm:text-xl font-bold text-slate-900">
              Additional Hardware & Stand Packs
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Need extra cards for staff or tabletop acrylic stands for multiple tables? Order directly at any time.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {physicalAddons.map((item, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-slate-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                      {item.badge}
                    </span>
                    <span className="text-sm font-extrabold text-slate-900">{item.price}</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 mb-1">{item.name}</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">{item.description}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-200/60 text-[11px] font-medium text-slate-400">
                  Available inside dashboard
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Payment Gateway Modal */}
        <PaymentGatewayModal
          isOpen={showGatewayModal}
          onClose={() => setShowGatewayModal(false)}
          planId={gatewayPlan.planId}
          planName={gatewayPlan.planName}
          amount={gatewayPlan.amount}
          businessId="visitor"
          businessName="Your Business"
          onSuccess={() => {
            window.location.href = '/onboarding';
          }}
        />
      </div>
    </section>
  );
}
