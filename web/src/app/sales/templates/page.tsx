'use client';

import Link from 'next/link';
import { Palette, Sparkles, ArrowRight, Check } from 'lucide-react';

const TEMPLATES = [
  {
    slug: 'classic',
    name: 'Classic Minimalist',
    category: 'Universal / Corporate',
    color: '#5356EC',
    description: 'Clean high-converting review funnel suitable for retail stores, showrooms, and business services.',
    features: ['5-Star Quick Touch', 'Private Feedback Routing', 'Google Direct Redirect'],
  },
  {
    slug: 'restaurant',
    name: 'Hospitality & Dining',
    category: 'Restaurants / Cafes / Bakeries',
    color: '#D97706',
    description: 'Warm appetizing visual style designed to capture diner satisfaction and promote Google Maps rankings.',
    features: ['Food & Ambiance Topics', 'AI Review Generator', 'Menu Integration Hook'],
  },
  {
    slug: 'healthcare',
    name: 'Medical & Dental Trust',
    category: 'Clinics / Doctors / Hospitals',
    color: '#059669',
    description: 'High-trust, professional layout reassuring patients and collecting genuine patient testimonials.',
    features: ['Doctor Care Sentiment', 'Discreet Feedback Protection', 'Strict HIPAA/Privacy Compliant'],
  },
  {
    slug: 'salon',
    name: 'Luxury Salon & Spa',
    category: 'Beauty / Wellness / Spas',
    color: '#7C3AED',
    description: 'Vibrant boutique aesthetics highlighting stylist hospitality, clean ambience, and 5-star ratings.',
    features: ['Service Category Tags', 'Stylist Compliment Helper', 'One-Tap Google Maps Rating'],
  },
  {
    slug: 'sports',
    name: 'Sports Goods & Fitness Gear',
    category: 'Sports & Fitness Equipment',
    color: '#0284C7',
    description: 'High-impact athletic design highlighting cricket bats, tennis rackets, match balls & sporting gear.',
    features: ['Bat & Racket Feedback', 'Sports Durability Sentiment', 'One-Tap Google Maps Rating'],
  },
  {
    slug: 'kitchen',
    name: 'Kitchen House & Cookware',
    category: 'Kitchenware & Home Essentials',
    color: '#EA580C',
    description: 'Modern cookware showcase designed for kitchen house stores, utensils, dinnerware & home appliances.',
    features: ['Cookware & Steel Topics', 'Quality & Durability Rating', 'AI Review Generator'],
  },
];

export default function DemoTemplatesPage() {
  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Palette className="w-6 h-6 text-[#5356EC]" />
          <span>Review Funnel Demo Templates</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Curated industry-tailored funnel styles ready for instant salesperson demonstration.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {TEMPLATES.map((tmpl) => (
          <div
            key={tmpl.slug}
            className="bg-white border border-slate-200/90 rounded-3xl p-6 flex flex-col justify-between space-y-5 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  {tmpl.category}
                </span>
                <div className="w-4 h-4 rounded-full shadow-xs" style={{ backgroundColor: tmpl.color }} />
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900">{tmpl.name}</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{tmpl.description}</p>
              </div>

              <div className="space-y-2 pt-2">
                {tmpl.features.map((feat) => (
                  <div key={feat} className="flex items-center gap-2 text-xs text-slate-700 font-medium">
                    <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Slug: {tmpl.slug}</span>
              <Link
                href={`/sales/demo-builder?cat=${encodeURIComponent(tmpl.category)}`}
                className="px-4 py-2.5 rounded-xl bg-[#5356EC] hover:bg-[#4346DB] text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Use Template in Demo</span>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
