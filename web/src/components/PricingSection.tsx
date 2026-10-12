'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
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
  Lock, 
  Zap,
  Info
} from 'lucide-react';
import { businessService } from '@/services';

const plan1Features = [
  '1 Year Full Software Access',
  'AI Auto Reply System Activated',
  'Custom Branded QR Review Funnel',
  '1-Tap Smart Review Assistance for Guests',
  'Google Business Profile Direct Routing',
  'Private Feedback Resolution Shield (1-3 Stars)',
  'Digital Menu & Service Price List Hosting',
  'Client Dashboard & Scan Analytics',
  'WhatsApp & Email Technical Support',
];

const plan2Features = [
  'Lifetime Free Software Access (First 100 Accounts Offer)',
  'AI Auto Reply System Activated for Life',
  'Custom Branded NFC Smart Tap Review Card Included',
  'Free Express Doorstep Delivery in India',
  'Zero Annual Renewal Charges Forever (First 100 Accounts)',
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
  const [slotData, setSlotData] = useState<{ total: number; claimed: number; remaining: number }>({
    total: 100,
    claimed: 17,
    remaining: 83,
  });

  useEffect(() => {
    businessService.getRemainingLifetimeSlots().then(setSlotData);
  }, []);

  return (
    <section id="pricing" className="py-20 md:py-24 bg-white border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold uppercase tracking-wider mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
            LIMITED LAUNCH OFFER · FIRST 100 ACCOUNTS
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Simple Pricing. Zero Monthly Software Fees.
          </h2>
          <p className="mt-3 text-slate-600 text-sm sm:text-base leading-relaxed">
            Test the complete system with our 1-day free trial. The <strong className="text-rose-600 font-bold">first 100 accounts get Lifetime Free access</strong> if they enroll in the ₹2,999 plan (includes custom NFC review card)!
          </p>

          {/* Auto Reply Policy Callout */}
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium">
            <Info className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Auto Reply System:</strong> Auto Reply is turned off for trial accounts and is immediately activated with an active plan (Lifetime Free on the ₹2,999 plan for the first 100 accounts).
            </span>
          </div>
        </div>

        {/* Dynamic 100 Accounts Slot Countdown Progress Box */}
        <div className="max-w-3xl mx-auto mb-12 p-4 bg-gradient-to-r from-amber-50 via-rose-50/40 to-amber-50 border border-amber-200/90 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-800 mb-1.5">
            <span className="flex items-center gap-1">
              <span>🔥 First 100 Accounts Special: Lifetime Free on ₹2,999 Plan:</span>
            </span>
            <span className="font-bold text-rose-700 bg-rose-100/80 px-2 py-0.5 rounded-md">
              {slotData.remaining} of {slotData.total} Lifetime Slots Remaining
            </span>
          </div>
          <div className="w-full bg-slate-200/80 rounded-full h-2.5 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-amber-500 to-rose-600 h-2.5 rounded-full transition-all duration-500" 
              style={{ width: `${Math.min(100, Math.max(10, (slotData.claimed / slotData.total) * 100))}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-700 mt-2 leading-relaxed text-center sm:text-left">
            ⚡ First 100 accounts get lifetime free access if they enroll in the ₹2,999 plan (includes physical NFC card + zero recurring annual fees). Once 100 accounts are claimed, the price returns to regular standard rates.
          </p>
        </div>

        {/* 2 Main Pricing Cards Side-by-Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto mb-16 items-stretch">
          
          {/* PLAN 1: ₹2,599 (Without NFC Card · 1 Year Only) */}
          <div className="rounded-3xl bg-white border-2 border-slate-200 shadow-md hover:border-slate-300 transition-all p-7 sm:p-9 flex flex-col justify-between">
            <div>
              {/* Badge & Title */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                  Plan Option 1
                </span>
                <span className="text-xs font-bold text-slate-500">
                  1 Year Validity Only
                </span>
              </div>

              <h3 className="text-2xl font-bold text-slate-900">Standard 1-Year Plan</h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Pure software suite for 1 business location (without physical NFC card)
              </p>

              {/* Price Row */}
              <div className="mt-5 pb-5 border-b border-slate-100">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg line-through text-slate-400 font-semibold decoration-rose-500 decoration-2">
                    ₹5,999
                  </span>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-rose-50 border border-rose-200 text-rose-600 text-[11px] font-bold">
                    57% OFF
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">₹2,599</span>
                  <span className="text-xs text-slate-500 font-semibold">/ 1 Year (Without NFC Card)</span>
                </div>
                <p className="text-xs text-emerald-600 font-semibold mt-1.5 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5" />
                  <span>Turns ON AI Auto Reply System for 1 Year</span>
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
              <a
                href={`https://wa.me/919257378047?text=${encodeURIComponent(
                  'Hi! I would like to purchase the ₹2,599 1-Year Plan (Without NFC Card) for my business.'
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-black text-white text-sm font-bold shadow-md hover:shadow-lg transition-all"
              >
                <span>Activate 1-Year Plan (₹2,599)</span>
                <ArrowRight className="w-4 h-4" />
              </a>

              <Link
                href="/onboarding"
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs sm:text-sm font-semibold transition-all text-center"
              >
                <span>Start 1-Day Trial First</span>
              </Link>
            </div>
          </div>

          {/* PLAN 2: ₹2,999 (With NFC Card · Lifetime Deal for First 100 Accounts) — HIGHLIGHTED & RECOMMENDED */}
          <div className="relative rounded-3xl bg-white border-2 border-blue-600 shadow-xl p-7 sm:p-9 flex flex-col justify-between overflow-hidden">
            {/* Top highlight ribbon */}
            <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-extrabold px-5 py-1.5 rounded-bl-2xl shadow-sm flex items-center gap-1.5 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>FIRST 100 ACCOUNTS · LIFETIME FREE ACCESS</span>
            </div>

            <div>
              {/* Badge & Title */}
              <div className="flex items-center gap-2 mb-3 pt-2">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  <Crown className="w-3.5 h-3.5 text-amber-500" />
                  <span>Pro Plan + NFC Card (Lifetime Deal)</span>
                </span>
                <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                  Doorstep Delivery
                </span>
              </div>

              <h3 className="text-2xl font-bold text-slate-900">Pro Plan + NFC Card (Lifetime Free)</h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Complete software suite + Custom Branded NFC Review Card delivered to your door. First 100 accounts get Lifetime Free access!
              </p>

              {/* Price Row */}
              <div className="mt-5 pb-5 border-b border-slate-100">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg line-through text-slate-400 font-semibold decoration-rose-500 decoration-2">
                    ₹6,999
                  </span>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-rose-50 border border-rose-200 text-rose-600 text-[11px] font-bold">
                    57% OFF · LIFETIME
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl sm:text-5xl font-extrabold text-blue-600 tracking-tight">₹2,999</span>
                  <span className="text-xs text-blue-700 font-bold">/ Lifetime Free Access (First 100 Accounts Only)</span>
                </div>
                <p className="text-xs text-blue-700 font-semibold mt-1.5 flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5 text-blue-600" />
                  <span>Includes Physical NFC Card + Lifetime Free Software & Auto Reply</span>
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
                      Custom Branded NFC Google Review Card — Guests tap phone for 1-second 5-star reviews!
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
              <a
                href={`https://wa.me/919257378047?text=${encodeURIComponent(
                  'Hi! I would like to claim the ₹2,999 Lifetime Free Access Plan (First 100 Accounts Offer + NFC Review Card Included) for my business.'
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm sm:text-base font-bold shadow-md hover:shadow-xl transition-all"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Claim Lifetime Plan + NFC Card (₹2,999)</span>
                <ArrowRight className="w-4 h-4" />
              </a>

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

      </div>
    </section>
  );
}
