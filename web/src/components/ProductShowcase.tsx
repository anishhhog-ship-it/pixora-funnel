'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Smartphone, 
  Monitor, 
  QrCode, 
  Sparkles, 
  Star, 
  ExternalLink, 
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  ThumbsUp,
  MessageSquare,
  BarChart3,
  Bot
} from 'lucide-react';

export default function ProductShowcase() {
  const [activeTab, setActiveTab] = useState<'customer' | 'business'>('customer');

  return (
    <section id="showcase" className="py-20 md:py-24 bg-white border-t border-slate-100 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold uppercase tracking-wider mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
            END-TO-END PLATFORM
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Seamless Customer Journey. Powerful Owner Control.
          </h2>
          <p className="mt-3 text-slate-600 text-sm sm:text-base leading-relaxed">
            See how Pixora Funnel bridges the moment of customer delight into lasting Google reputation, automated responses and recurring revenue.
          </p>

          {/* Toggle pill buttons */}
          <div className="inline-flex p-1 mt-6 rounded-xl bg-slate-100 border border-slate-200">
            <button
              onClick={() => setActiveTab('customer')}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'customer'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Smartphone className="w-4 h-4 text-blue-600" />
              <span>Customer Experience</span>
            </button>
            <button
              onClick={() => setActiveTab('business')}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'business'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Monitor className="w-4 h-4 text-blue-600" />
              <span>Business Experience</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Customer Experience Showcase */}
        {activeTab === 'customer' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center animate-fadeIn">
            {/* Steps & Value Props (5 cols) */}
            <div className="lg:col-span-5 space-y-5">
              <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-100">
                <span className="text-xs font-bold text-blue-800 uppercase tracking-wider">The 10-Second Funnel</span>
                <h3 className="text-xl font-bold text-slate-900 mt-1">Zero Apps. Zero Friction.</h3>
                <p className="text-xs text-slate-600 mt-1">
                  Customers scan with their phone camera. No app download or registration needed.
                </p>
              </div>

              {/* 5 Funnel Stages */}
              <div className="space-y-3">
                <div className="flex items-start gap-3.5 p-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">1</div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Instant QR Scan</h4>
                    <p className="text-xs text-slate-500">Placed at tabletop, billing counter, or NFC card tap.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 p-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
                  <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">2</div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Branded Digital Welcome</h4>
                    <p className="text-xs text-slate-500">Clean interface displaying your business logo, cover photo & active menu.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 p-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
                  <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs shrink-0">3</div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Sentiment Rating (1 to 5 Stars)</h4>
                    <p className="text-xs text-slate-500">4-5 stars route directly to Google; 1-3 stars trigger a private feedback resolution form.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 p-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
                  <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs shrink-0">4</div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Smart AI Review Assistant</h4>
                    <p className="text-xs text-slate-500">Helps the customer compose authentic, detailed reviews in 1 tap.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 p-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
                  <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-xs shrink-0">5</div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Direct Google Submission</h4>
                    <p className="text-xs text-slate-500">Pre-copies text and opens Google Review screen in one single tap.</p>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <Link
                  href="/f/your-business"
                  target="_blank"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors"
                >
                  <span>Test Live Customer Funnel</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
                <Link
                  href="/onboarding"
                  className="text-xs font-semibold text-blue-600 hover:underline"
                >
                  Start your funnel in 5 mins →
                </Link>
              </div>
            </div>

            {/* Visual Phone Mockup of Funnel (7 cols) */}
            <div className="lg:col-span-7 flex justify-center">
              <div className="w-full max-w-sm rounded-[36px] bg-slate-900 p-3 shadow-2xl ring-1 ring-slate-800">
                <div className="relative rounded-[28px] bg-white overflow-hidden border border-slate-100">
                  {/* Phone notch */}
                  <div className="h-5 bg-slate-950 flex items-center justify-center">
                    <div className="w-20 h-3 bg-black rounded-b-md" />
                  </div>

                  {/* Funnel header */}
                  <div className="relative h-28 bg-slate-800">
                    <img
                      src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&auto=format&fit=crop"
                      alt="Restaurant"
                      className="w-full h-full object-cover opacity-70"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                    <div className="absolute -bottom-4 left-4 flex items-end gap-2.5">
                      <div className="w-12 h-12 rounded-xl bg-white p-1 shadow-md border border-slate-100 flex items-center justify-center">
                        <span className="font-serif font-black text-amber-900 text-lg">YB</span>
                      </div>
                      <div className="text-white pb-4">
                        <div className="text-xs font-bold leading-tight">Your Business</div>
                        <div className="text-[10px] text-amber-200">Fine Dining & Sweets</div>
                      </div>
                    </div>
                  </div>

                  {/* Funnel Body */}
                  <div className="p-4 pt-6 space-y-4">
                    <div className="text-center space-y-1">
                      <div className="text-xs font-semibold text-slate-800">How was your visit today?</div>
                      <div className="flex justify-center gap-1.5 py-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button key={star} className="p-1 hover:scale-110 transition-transform">
                            <Star className="w-6 h-6 fill-amber-400 text-amber-400" />
                          </button>
                        ))}
                      </div>
                      <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full inline-block">
                        Excellent · Highly Recommended
                      </span>
                    </div>

                    {/* AI Suggestions Box */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700">
                        <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                        <span>1-Tap Review Assistant</span>
                      </div>
                      <div className="space-y-1.5">
                        <div className="p-2 rounded-lg bg-white border border-slate-200/80 text-[11px] text-slate-700 cursor-pointer hover:border-blue-400">
                          &ldquo;Authentic quality and exemplary hospitality at Your Business. The entire experience was unforgettable!&rdquo;
                        </div>
                        <div className="p-2 rounded-lg bg-white border border-slate-200/80 text-[11px] text-slate-700 cursor-pointer hover:border-blue-400">
                          &ldquo;Quick service, lovely ambiance and delicious desserts. Will bring family again!&rdquo;
                        </div>
                      </div>
                    </div>

                    {/* Google Action button */}
                    <button className="w-full py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm">
                      <img src="https://www.google.com/favicon.ico" alt="Google" className="w-3.5 h-3.5" />
                      <span>Post Directly on Google</span>
                    </button>

                    <div className="text-center text-[10px] text-slate-400 flex items-center justify-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      <span>Protected by Pixora Funnel™ Smart Filter</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Business Experience Showcase */}
        {activeTab === 'business' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center animate-fadeIn">
            {/* Visual Desktop Mockup (7 cols) */}
            <div className="lg:col-span-7 flex justify-center">
              <div className="w-full rounded-2xl bg-slate-900 p-2.5 sm:p-4 shadow-2xl border border-slate-800">
                <div className="rounded-xl bg-slate-50 overflow-hidden border border-slate-200">
                  {/* Top Mock Window Bar */}
                  <div className="h-8 bg-white border-b border-slate-200 px-3 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono bg-slate-100 px-2.5 py-0.5 rounded">
                      funnel.pixoraautomations.com/dashboard
                    </div>
                    <div className="w-10" />
                  </div>

                  {/* Dashboard Inner content */}
                  <div className="p-4 space-y-3.5">
                    {/* Metrics row */}
                    <div className="grid grid-cols-3 gap-2.5">
                      <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
                        <div className="text-[10px] text-slate-500 font-medium">Google Reviews</div>
                        <div className="text-base font-bold text-slate-900">128 <span className="text-[10px] text-emerald-600 font-semibold">+24%</span></div>
                      </div>
                      <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
                        <div className="text-[10px] text-slate-500 font-medium">QR Scans</div>
                        <div className="text-base font-bold text-slate-900">892 <span className="text-[10px] text-emerald-600 font-semibold">+36%</span></div>
                      </div>
                      <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
                        <div className="text-[10px] text-slate-500 font-medium">Auto-Replies</div>
                        <div className="text-base font-bold text-slate-900">98% <span className="text-[10px] text-blue-600 font-semibold">Live</span></div>
                      </div>
                    </div>

                    {/* Auto Reply Preview */}
                    <div className="bg-white rounded-lg p-3 border border-slate-200 shadow-2xs space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 font-bold text-slate-800">
                          <Bot className="w-3.5 h-3.5 text-blue-600" />
                          <span>Smart Auto-Reply in Action</span>
                        </div>
                        <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-medium">Auto-Synced</span>
                      </div>
                      <div className="p-2 rounded bg-slate-50 text-[11px] text-slate-600 border border-slate-100">
                        <span className="font-semibold text-slate-800">Verified Diner ★★★★★</span>
                        <p className="mt-0.5">&ldquo;Amazing service and delicious food. Highly recommended!&rdquo;</p>
                      </div>
                      <div className="p-2 rounded bg-blue-50/60 text-[11px] text-blue-900 border border-blue-100">
                        <span className="font-semibold text-blue-950">AI Auto-Reply: </span>
                        &ldquo;Thank you so much for the 5-star review! We are thrilled you enjoyed your experience. Looking forward to hosting you again soon! 🙏&rdquo;
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Business Features list (5 cols) */}
            <div className="lg:col-span-5 space-y-5">
              <div className="p-4 rounded-xl bg-slate-100 border border-slate-200">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Owner Portal</span>
                <h3 className="text-xl font-bold text-slate-900 mt-1">Complete Command Center</h3>
                <p className="text-xs text-slate-600 mt-1">
                  Everything you need to monitor footfall, configure your QR stands, update menus, and safeguard your brand.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-white border border-slate-200 shadow-2xs">
                  <BarChart3 className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Footfall & Scan Analytics</h4>
                    <p className="text-xs text-slate-500">Know exact scan peaks by day and hour across each table or counter location.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-white border border-slate-200 shadow-2xs">
                  <Bot className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Intelligent Auto-Reply Engine</h4>
                    <p className="text-xs text-slate-500">Respond to customer Google reviews instantly with customized, polite AI responses.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-white border border-slate-200 shadow-2xs">
                  <QrCode className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Stand & Print QR Studio</h4>
                    <p className="text-xs text-slate-500">Download high-res print-ready PDF/SVG files configured for your branding.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-white border border-slate-200 shadow-2xs">
                  <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Private Feedback Inbox</h4>
                    <p className="text-xs text-slate-500">Direct 1-3 star feedback to your private portal so you can call dissatisfied guests before they post publicly.</p>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
                >
                  <span>Explore Client Dashboard</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        )}

      </div>
    </section>
  );
}
