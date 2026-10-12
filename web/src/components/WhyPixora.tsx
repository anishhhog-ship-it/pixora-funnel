'use client';

import { 
  QrCode, 
  Clock, 
  LayoutDashboard, 
  Smartphone, 
  ShieldCheck, 
  BarChart2, 
  BookOpen, 
  Building2,
  CheckCircle2
} from 'lucide-react';

const pillars = [
  {
    icon: QrCode,
    title: 'QR & NFC First Architecture',
    description: 'Designed specifically for the physical-to-digital transition. Lightning-fast mobile load times with zero friction.',
  },
  {
    icon: Clock,
    title: '5-Minute Setup',
    description: 'No developer needed. Input your business name, pick your theme, and your live funnel is generated immediately.',
  },
  {
    icon: LayoutDashboard,
    title: 'Unified Business Portal',
    description: 'All reviews, private feedbacks, scan stats, and live menus accessible through a clean, single-screen dashboard.',
  },
  {
    icon: Smartphone,
    title: 'Mobile-Optimized Experience',
    description: 'Runs flawlessly on every iPhone and Android device. No app store downloads or logins forced onto your guests.',
  },
  {
    icon: ShieldCheck,
    title: 'Private Feedback Protection',
    description: 'Satisfied guests are guided to Google, while private complaints reach your inbox directly so you can resolve them quickly.',
  },
  {
    icon: BarChart2,
    title: 'Transparent Growth Metrics',
    description: 'Understand exactly where your reviews are coming from — whether table stands, billing counter, or staff links.',
  },
  {
    icon: BookOpen,
    title: 'Digital Menu & Catalog',
    description: 'Update pricing, mark items 86 / out of stock, and showcase specialty dishes or salon services in real time.',
  },
  {
    icon: Building2,
    title: 'Multi-Location Ready',
    description: 'Expand from 1 outlet to 10+ locations without losing centralized reporting or brand consistency.',
  },
];

export default function WhyPixora() {
  return (
    <section id="why-pixora" className="py-16 md:py-20 bg-slate-50/70 border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="max-w-3xl mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold uppercase tracking-wider mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
            THE PIXORA ADVANTAGE
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
            Everything Your Local Business Needs to Turn Customer Experience Into Growth.
          </h2>
          <p className="mt-3 text-slate-600 text-sm sm:text-base leading-relaxed">
            We don’t make exaggerated ranking promises or use fake bots. We simply make it effortless for your real, satisfied customers to share their genuine experiences where it matters most.
          </p>
        </div>

        {/* 8 Pillar Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {pillars.map((pillar, i) => {
            const Icon = pillar.icon;
            return (
              <div
                key={i}
                className="bg-white border border-slate-200/90 rounded-2xl p-5 hover:border-slate-300 hover:shadow-xs transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3.5">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 mb-1.5">
                  {pillar.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {pillar.description}
                </p>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
