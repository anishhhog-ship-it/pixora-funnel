'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Utensils, 
  Scissors, 
  PlusSquare, 
  ShoppingBag, 
  Dumbbell, 
  Bed, 
  GraduationCap, 
  MoreHorizontal,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  type LucideIcon
} from 'lucide-react';

interface Industry {
  id: string;
  name: string;
  categorySlug: string;
  icon: LucideIcon;
  bgColor: string;
  iconColor: string;
  borderHover: string;
  badge: string;
  description: string;
  keyFeature: string;
  sampleSlug: string;
}

const industries: Industry[] = [
  {
    id: 'restaurants',
    name: 'Restaurants & Cafés',
    categorySlug: 'Restaurant & Fine Dining',
    icon: Utensils,
    bgColor: 'bg-amber-50/70',
    iconColor: 'text-amber-600',
    borderHover: 'hover:border-amber-300',
    badge: 'Digital Menu + Food Prompts',
     description: 'Tabletop QR stands for review prompts before the bill, plus interactive contactless menus.',
     keyFeature: 'Photo menus, dish recommendations & a clear Google review handoff',
    sampleSlug: 'your-business',
  },
  {
    id: 'salons',
    name: 'Salons & Spas',
    categorySlug: 'Salon & Luxury Spa',
    icon: Scissors,
    bgColor: 'bg-rose-50/70',
    iconColor: 'text-rose-500',
    borderHover: 'hover:border-rose-300',
    badge: 'Stylist & Service Reviews',
    description: 'Mirror stands and checkout counters that prompt guests to review their favorite stylist.',
    keyFeature: 'Stylist name tagging, beauty services catalog & Instagram integration',
    sampleSlug: 'glamour-studio',
  },
  {
    id: 'clinics',
    name: 'Clinics & Healthcare',
    categorySlug: 'Clinic & Wellness Centre',
    icon: PlusSquare,
    bgColor: 'bg-sky-50/70',
    iconColor: 'text-sky-600',
    borderHover: 'hover:border-sky-300',
    badge: 'Patient Trust & Care',
    description: 'Reception desk QR and discharge card links to capture genuine patient feedback.',
    keyFeature: 'Doctor recommendations, private feedback shield for confidential issues',
    sampleSlug: 'apex-dental',
  },
  {
    id: 'retail',
    name: 'Retail Stores & Boutiques',
    categorySlug: 'Retail Boutique & Lifestyle',
    icon: ShoppingBag,
    bgColor: 'bg-purple-50/70',
    iconColor: 'text-purple-600',
    borderHover: 'hover:border-purple-300',
    badge: 'Checkout Counter Taps',
    description: 'NFC tap cards at the billing counter to turn shoppers into verified Google reviewers.',
     keyFeature: 'Product spotlight, seasonal collections & a clear Google review handoff',
    sampleSlug: 'zara-boutique',
  },
  {
    id: 'gyms',
    name: 'Gyms & Fitness',
    categorySlug: 'Fitness & Sports Club',
    icon: Dumbbell,
    bgColor: 'bg-emerald-50/70',
    iconColor: 'text-emerald-600',
    borderHover: 'hover:border-emerald-300',
    badge: 'Locker & Water Station QRs',
    description: 'Placed at equipment zones and water stations to engage proud workout members.',
    keyFeature: 'Trainer shoutouts, class timetables & community proof on Google',
    sampleSlug: 'iron-gym',
  },
  {
    id: 'hotels',
    name: 'Hotels & Homestays',
    categorySlug: 'Boutique Hotel & Stay',
    icon: Bed,
    bgColor: 'bg-orange-50/70',
    iconColor: 'text-orange-500',
    borderHover: 'hover:border-orange-300',
    badge: 'Room Key & Concierge QRs',
    description: 'Room keys, elevator displays, and breakfast tables capturing glowing guest reviews.',
    keyFeature: 'Amenity guides, local recommendations & hospitality auto-replies',
    sampleSlug: 'heritage-haveli',
  },
  {
    id: 'education',
    name: 'Education & Coaching',
    categorySlug: 'Education & Coaching Institute',
    icon: GraduationCap,
    bgColor: 'bg-blue-50/70',
    iconColor: 'text-blue-600',
    borderHover: 'hover:border-blue-300',
    badge: 'Parent & Student Trust',
    description: 'Certificate distributions and parent meetings for credible academic ratings.',
    keyFeature: 'Course catalogs, faculty highlights & verified student testimonials',
    sampleSlug: 'bright-minds',
  },
  {
    id: 'other',
    name: 'Any Local Business',
    categorySlug: 'Local Business',
    icon: MoreHorizontal,
    bgColor: 'bg-slate-100/70',
    iconColor: 'text-slate-600',
    borderHover: 'hover:border-slate-300',
    badge: 'Universal Compatibility',
    description: 'Auto shops, repair services, consulting, photography studios and beyond.',
    keyFeature: 'Custom workflows, Google review routing & complete analytics',
    sampleSlug: 'premier-auto',
  },
];

export default function IndustriesSection() {
  const [selectedIndustry, setSelectedIndustry] = useState<Industry>(industries[0]);

  return (
    <section id="industries" className="border-t border-slate-100 bg-white py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header with pill badge */}
        <div className="text-left mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold uppercase tracking-wider mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
            FOR EVERY BUSINESS
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
            Built for Local Businesses
          </h2>
          <p className="mt-2 text-slate-600 text-sm sm:text-base max-w-3xl leading-relaxed">
            Whether you run a restaurant, salon, clinic, retail store, hotel, gym or another customer-facing business, Pixora Funnel adapts to your workflow.
          </p>
        </div>

        {/* 8 Industry Cards Grid - Exactly matching the reference layout & pastel colors */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-3.5 mb-8">
          {industries.map((ind) => {
            const Icon = ind.icon;
            const isSelected = selectedIndustry.id === ind.id;
            return (
              <button
                key={ind.id}
                onClick={() => setSelectedIndustry(ind)}
                aria-pressed={isSelected}
                className={`public-focus-ring flex cursor-pointer flex-col items-center justify-center rounded-xl border p-3.5 text-center transition-all duration-200 sm:p-4 ${
                  isSelected
                    ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-md bg-white -translate-y-0.5'
                    : 'border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-xs hover:-translate-y-0.5'
                }`}
              >
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center mb-2.5 transition-transform ${ind.bgColor} ${ind.iconColor}`}
                >
                  <Icon className="w-5 h-5" strokeWidth={2.2} />
                </div>
                <span className="text-xs sm:text-[13px] font-semibold text-slate-800 line-clamp-2 leading-tight">
                  {ind.name}
                </span>
              </button>
            );
          })}
        </div>

        {/* Interactive Industry Deep Dive Panel */}
        <div className="rounded-2xl border border-slate-200/90 bg-slate-50/80 p-5 shadow-sm transition-all sm:p-7">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${selectedIndustry.bgColor} ${selectedIndustry.iconColor}`}>
                  <selectedIndustry.icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Pixora Funnel for {selectedIndustry.name}
                  </h3>
                  <span className="inline-block text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md mt-0.5">
                    {selectedIndustry.badge}
                  </span>
                </div>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed pt-1">
                {selectedIndustry.description}
              </p>
              <div className="flex items-center gap-2 text-xs text-slate-700 pt-1 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{selectedIndustry.keyFeature}</span>
              </div>
            </div>

            <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 shrink-0">
              <Link
                href={`/f/${selectedIndustry.sampleSlug}`}
                target="_blank"
                  className="public-focus-ring inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-sm transition-colors hover:border-blue-300 hover:text-blue-600"
              >
                <span>Preview {selectedIndustry.name.split('&')[0]} Funnel</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
              <Link
                href={`/onboarding?category=${encodeURIComponent(selectedIndustry.categorySlug)}`}
                className="public-focus-ring inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
              >
                <span>Get Started for Free</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
