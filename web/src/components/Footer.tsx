'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowUp } from 'lucide-react';
import { smoothScrollTo } from '@/lib/scrollUtils';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-800">
          
          {/* Brand Info (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            <a 
              href="#hero" 
              onClick={(e) => {
                e.preventDefault();
                smoothScrollTo('#hero');
              }}
              className="inline-block group cursor-pointer"
              title="Scroll back to top"
            >
              <Image
                src="/pixora-logo-white.png"
                alt="Pixora Funnel by Pixora Automations"
                width={260}
                height={70}
                className="h-13 sm:h-15 w-auto object-contain transition-transform group-hover:scale-105"
              />
            </a>

            <p className="text-xs sm:text-sm text-slate-400 max-w-sm leading-relaxed">
              Empowering local businesses with frictionless QR review funnels, automated customer sentiment protection, and real-time footfall intelligence.
            </p>

            <div className="text-xs text-slate-400 pt-2 flex flex-col gap-1.5">
              <div>Hosted at <span className="text-slate-300 font-mono">funnel.pixoraautomations.com</span></div>
              <div className="flex items-center gap-3 pt-1">
                <a
                  href="https://wa.me/919257378047?text=Hi%20Pixora!%20I%20have%20an%20inquiry%20regarding%20the%20Plans%20(₹2,599%20or%20₹2,999%20Lifetime%20Free%20Plan%20with%20NFC%20Card)."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 font-semibold"
                >
                  <span>💬 WhatsApp: +91 92573 78047</span>
                </a>
                <a
                  href="tel:9257378047"
                  className="inline-flex items-center gap-1 text-slate-300 hover:text-white"
                >
                  <span>📞 Call</span>
                </a>
              </div>
            </div>
          </div>

          {/* Links Column 1: Product */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Product</h4>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-400">
              <li>
                <a 
                  href="#features" 
                  onClick={(e) => { e.preventDefault(); smoothScrollTo('#features'); }}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  QR Review Funnel
                </a>
              </li>
              <li>
                <a 
                  href="#features" 
                  onClick={(e) => { e.preventDefault(); smoothScrollTo('#features'); }}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Smart AI Suggestions
                </a>
              </li>
              <li>
                <a 
                  href="#features" 
                  onClick={(e) => { e.preventDefault(); smoothScrollTo('#features'); }}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Auto Reply System
                </a>
              </li>
              <li>
                <a 
                  href="#features" 
                  onClick={(e) => { e.preventDefault(); smoothScrollTo('#features'); }}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Digital Menu Builder
                </a>
              </li>
              <li>
                <a 
                  href="#stats" 
                  onClick={(e) => { e.preventDefault(); smoothScrollTo('#stats'); }}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Customer Insights
                </a>
              </li>
            </ul>
          </div>

          {/* Links Column 2: Solutions */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Industries</h4>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-400">
              <li>
                <a 
                  href="#industries" 
                  onClick={(e) => { e.preventDefault(); smoothScrollTo('#industries'); }}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Restaurants & Cafés
                </a>
              </li>
              <li>
                <a 
                  href="#industries" 
                  onClick={(e) => { e.preventDefault(); smoothScrollTo('#industries'); }}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Salons & Spas
                </a>
              </li>
              <li>
                <a 
                  href="#industries" 
                  onClick={(e) => { e.preventDefault(); smoothScrollTo('#industries'); }}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Clinics & Healthcare
                </a>
              </li>
              <li>
                <a 
                  href="#industries" 
                  onClick={(e) => { e.preventDefault(); smoothScrollTo('#industries'); }}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Retail Stores
                </a>
              </li>
              <li>
                <a 
                  href="#industries" 
                  onClick={(e) => { e.preventDefault(); smoothScrollTo('#industries'); }}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Hotels & Homestays
                </a>
              </li>
            </ul>
          </div>

          {/* Links Column 3: Company & Portal */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Account & Legal</h4>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-400">
              <li><Link href="/login" className="hover:text-white transition-colors">Client Portal Login</Link></li>
              <li><Link href="/onboarding" className="hover:text-white transition-colors">Start 1-Day Trial</Link></li>
              <li>
                <a 
                  href="#pricing" 
                  onClick={(e) => { e.preventDefault(); smoothScrollTo('#pricing'); }}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Pricing & Hardware
                </a>
              </li>
              <li>
                <a 
                  href="#faq" 
                  onClick={(e) => { e.preventDefault(); smoothScrollTo('#faq'); }}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Help & FAQ
                </a>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom row */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div suppressHydrationWarning>
            © {new Date().getFullYear()} Pixora Automations. All rights reserved.
          </div>
          <div className="flex items-center gap-6">
            <span>Built with precision for local business growth</span>
            <Link href="/login" className="text-slate-400 hover:text-white transition-colors font-medium">
              Client Login →
            </Link>
            
            {/* Animated Scroll To Top Button */}
            <button
              type="button"
              onClick={() => smoothScrollTo('#hero')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer border border-slate-700/80 group active:scale-95"
              title="Smooth scroll up to top"
            >
              <span>Back to Top</span>
              <ArrowUp className="w-3.5 h-3.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>
          </div>
        </div>

      </div>
    </footer>
  );
}
