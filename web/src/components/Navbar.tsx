'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Menu, X, ArrowRight, Sparkles } from 'lucide-react';
import { authService } from '@/services';
import { triggerPwaInstall } from '@/components/PwaInstallPrompt';
import { smoothScrollTo } from '@/lib/scrollUtils';

export default function Navbar() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('hero');

  useEffect(() => {
    setIsLoggedIn(authService.isAuthenticated());

    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }

      // Scrollspy calculation
      const sections = ['hero', 'stats', 'industries', 'features', 'how-it-works', 'pricing', 'faq'];
      const scrollPosition = window.scrollY + 120;

      for (let i = sections.length - 1; i >= 0; i--) {
        const sec = document.getElementById(sections[i]);
        if (sec && sec.offsetTop <= scrollPosition) {
          setActiveSection(sections[i]);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-200 ${
        scrolled
          ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-100 py-3'
          : 'bg-white border-b border-slate-100/80 py-4'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Left: Brand Logo */}
          <Link 
            href="/" 
            onClick={(e) => {
              if (window.location.pathname === '/') {
                e.preventDefault();
                smoothScrollTo('#top');
              }
            }}
            className="flex items-center gap-2 group cursor-pointer"
            title="Scroll to Top"
          >
            <Image
              src="/pixora-logo.png"
              alt="Pixora Funnel by Pixora Automations"
              width={260}
              height={70}
              className="h-12 sm:h-14 md:h-16 w-auto object-contain transition-transform group-hover:scale-105"
              priority
            />
          </Link>

          {/* Center: Desktop Navigation Links with Smooth Scroll Animations */}
          <nav className="hidden md:flex items-center gap-7 text-[13px] font-medium text-slate-600">
            <a 
              href="#features" 
              onClick={(e) => {
                e.preventDefault();
                smoothScrollTo('#features');
              }}
              className={`transition-colors cursor-pointer py-1 relative ${
                activeSection === 'features' 
                  ? 'text-blue-600 font-bold' 
                  : 'text-slate-600 hover:text-blue-600'
              }`}
            >
              Features
              {activeSection === 'features' && (
                <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-blue-600 rounded-full animate-in fade-in" />
              )}
            </a>

            <a 
              href="#industries" 
              onClick={(e) => {
                e.preventDefault();
                smoothScrollTo('#industries');
              }}
              className={`transition-colors cursor-pointer py-1 relative ${
                activeSection === 'industries' 
                  ? 'text-blue-600 font-bold' 
                  : 'text-slate-600 hover:text-blue-600'
              }`}
            >
              Industries
              {activeSection === 'industries' && (
                <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-blue-600 rounded-full animate-in fade-in" />
              )}
            </a>

            <a 
              href="#how-it-works" 
              onClick={(e) => {
                e.preventDefault();
                smoothScrollTo('#how-it-works');
              }}
              className={`transition-colors cursor-pointer py-1 relative ${
                activeSection === 'how-it-works' 
                  ? 'text-blue-600 font-bold' 
                  : 'text-slate-600 hover:text-blue-600'
              }`}
            >
              How It Works
              {activeSection === 'how-it-works' && (
                <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-blue-600 rounded-full animate-in fade-in" />
              )}
            </a>

            <a 
              href="#pricing" 
              onClick={(e) => {
                e.preventDefault();
                smoothScrollTo('#pricing');
              }}
              className={`transition-colors cursor-pointer py-1 relative ${
                activeSection === 'pricing' 
                  ? 'text-blue-600 font-bold' 
                  : 'text-slate-600 hover:text-blue-600'
              }`}
            >
              Pricing
              {activeSection === 'pricing' && (
                <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-blue-600 rounded-full animate-in fade-in" />
              )}
            </a>

            <a 
              href="#faq" 
              onClick={(e) => {
                e.preventDefault();
                smoothScrollTo('#faq');
              }}
              className={`transition-colors cursor-pointer py-1 relative ${
                activeSection === 'faq' 
                  ? 'text-blue-600 font-bold' 
                  : 'text-slate-600 hover:text-blue-600'
              }`}
            >
              Resources & FAQ
              {activeSection === 'faq' && (
                <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-blue-600 rounded-full animate-in fade-in" />
              )}
            </a>
          </nav>

          {/* Right: Auth & Trial CTAs */}
          <div className="hidden sm:flex items-center gap-3">
            <Link
              href="/login"
              className="text-[13px] font-medium text-slate-700 hover:text-slate-900 px-4 py-2 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50/80 transition-all shadow-2xs"
            >
              Login
            </Link>

            <Link
              href="/onboarding"
              className="text-[13px] font-semibold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-all shadow-sm hover:shadow hover:scale-[1.01] active:scale-[0.99] flex items-center gap-1.5"
            >
              <span>Start 1 Day Free Trial</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-1.5">
            <button
              type="button"
              onClick={() => triggerPwaInstall()}
              className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer"
            >
              <span>Install App</span>
            </button>
            <Link
              href="/onboarding"
              className="text-xs font-semibold text-white bg-blue-600 px-2.5 py-1.5 rounded-lg shadow-sm"
            >
              Free Trial
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded-lg text-slate-700 hover:text-slate-900 hover:bg-slate-100"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden pt-4 pb-6 border-t border-slate-100 mt-3 space-y-3 animate-in fade-in duration-200">
            <div className="flex flex-col space-y-2 text-sm font-medium text-slate-700">
              <a
                href="#features"
                onClick={(e) => {
                  e.preventDefault();
                  setMobileMenuOpen(false);
                  smoothScrollTo('#features');
                }}
                className="px-3 py-2 rounded-lg hover:bg-slate-50 cursor-pointer flex items-center justify-between"
              >
                <span>Features</span>
                <span className="text-xs text-slate-400">↓</span>
              </a>
              <a
                href="#industries"
                onClick={(e) => {
                  e.preventDefault();
                  setMobileMenuOpen(false);
                  smoothScrollTo('#industries');
                }}
                className="px-3 py-2 rounded-lg hover:bg-slate-50 cursor-pointer flex items-center justify-between"
              >
                <span>Industries</span>
                <span className="text-xs text-slate-400">↓</span>
              </a>
              <a
                href="#how-it-works"
                onClick={(e) => {
                  e.preventDefault();
                  setMobileMenuOpen(false);
                  smoothScrollTo('#how-it-works');
                }}
                className="px-3 py-2 rounded-lg hover:bg-slate-50 cursor-pointer flex items-center justify-between"
              >
                <span>How It Works</span>
                <span className="text-xs text-slate-400">↓</span>
              </a>
              <a
                href="#pricing"
                onClick={(e) => {
                  e.preventDefault();
                  setMobileMenuOpen(false);
                  smoothScrollTo('#pricing');
                }}
                className="px-3 py-2 rounded-lg hover:bg-slate-50 cursor-pointer flex items-center justify-between"
              >
                <span>Pricing</span>
                <span className="text-xs text-slate-400">↓</span>
              </a>
              <a
                href="#faq"
                onClick={(e) => {
                  e.preventDefault();
                  setMobileMenuOpen(false);
                  smoothScrollTo('#faq');
                }}
                className="px-3 py-2 rounded-lg hover:bg-slate-50 cursor-pointer flex items-center justify-between"
              >
                <span>Resources & FAQ</span>
                <span className="text-xs text-slate-400">↓</span>
              </a>
            </div>

            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  triggerPwaInstall();
                }}
                className="w-full text-center text-sm font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 py-2.5 rounded-xl hover:bg-emerald-100 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>📲 Install Mobile App on Phone</span>
              </button>
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center text-sm font-semibold text-slate-700 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50"
              >
                Login to Client Portal
              </Link>
              <Link
                href="/onboarding"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 py-2.5 rounded-xl shadow-sm flex items-center justify-center gap-1.5"
              >
                <span>Start 1 Day Free Trial</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
