'use client';

import Link from 'next/link';
import { 
  QrCode, 
  Sparkles, 
  MessageSquareText, 
  FileText, 
  BarChart3, 
  Users, 
  ArrowRight 
} from 'lucide-react';
import { smoothScrollTo } from '@/lib/scrollUtils';

interface Feature {
  id: string;
  icon: any;
  title: string;
  description: string;
  iconBg: string;
  iconColor: string;
  badge?: string;
}

const features: Feature[] = [
  {
    id: 'qr-funnel',
    icon: QrCode,
    title: 'QR Based Review Funnel',
    description: 'Make customer review collection simple with a branded, mobile-friendly QR experience.',
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    badge: 'Core Engine'
  },
  {
    id: 'smart-suggestions',
    icon: Sparkles,
    title: 'Smart Review Suggestions',
    description: 'Help customers express their genuine experience naturally with 1-click tailored suggestions.',
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-500',
    badge: 'AI Powered'
  },
  {
    id: 'auto-reply',
    icon: MessageSquareText,
    title: 'Auto Reply System',
    description: 'Save hours by intelligently generating contextual responses to new Google customer reviews.',
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
    badge: 'Automation'
  },
  {
    id: 'digital-menu',
    icon: FileText,
    title: 'Digital Menu & Services',
    description: 'Give customers instant mobile access to menus, service price lists or seasonal products.',
    iconBg: 'bg-teal-50',
    iconColor: 'text-teal-600',
    badge: 'Contactless'
  },
  {
    id: 'analytics',
    icon: BarChart3,
    title: 'Analytics Dashboard',
    description: 'Track daily scans, review velocity, peak hours, menu views and conversion performance.',
    iconBg: 'bg-indigo-50',
    iconColor: 'text-indigo-600',
    badge: 'Real-time'
  },
  {
    id: 'customer-insights',
    icon: Users,
    title: 'Customer Insights',
    description: 'Understand customer sentiment trends and address private feedback before it hits Google.',
    iconBg: 'bg-purple-50',
    iconColor: 'text-purple-600',
    badge: 'Reputation Shield'
  },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="py-16 md:py-20 bg-slate-50/50 border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold uppercase tracking-wider mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
              EVERYTHING YOU NEED
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
              Powerful Features, Simple to Use
            </h2>
            <p className="mt-2 text-slate-600 text-sm sm:text-base max-w-2xl">
              Engineered for local business owners with zero technical setup. Everything you need to turn customer visits into 5-star Google reputation.
            </p>
          </div>

          <a
            href="#how-it-works"
            onClick={(e) => {
              e.preventDefault();
              smoothScrollTo('#how-it-works');
            }}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors group shrink-0 cursor-pointer"
          >
            <span>See How It Works</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </a>
        </div>

        {/* 6 Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.id}
                className="bg-white border border-slate-200/90 rounded-2xl p-6 transition-all duration-200 hover:shadow-md hover:border-slate-300 hover:-translate-y-1 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${feature.iconBg} ${feature.iconColor} transition-transform group-hover:scale-105`}>
                      <Icon className="w-6 h-6" strokeWidth={2.2} />
                    </div>
                    {feature.badge && (
                      <span className="text-[11px] font-semibold text-slate-500 bg-slate-100/80 px-2 py-0.5 rounded-md">
                        {feature.badge}
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => smoothScrollTo('#showcase')}
                  className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-500 group-hover:text-blue-600 transition-colors cursor-pointer w-full text-left"
                  title="Scroll to interactive product showcase"
                >
                  <span>Explore in live showcase</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                </button>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
