'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Menu, X, ArrowRight } from 'lucide-react';
import { triggerPwaInstall } from '@/components/PwaInstallPrompt';
import { smoothScrollTo } from '@/lib/scrollUtils';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('hero');

  useEffect(() => {
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
          ? 'border-b border-slate-200/80 bg-white/90 py-3 shadow-[0_8px_28px_rgba(15,23,42,0.06)] backdrop-blur-xl'
          : 'border-b border-slate-100/80 bg-white/80 py-4 backdrop-blur-md'
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
            className="public-focus-ring flex items-center gap-2 rounded-xl group cursor-pointer"
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
              aria-current={activeSection === 'features' ? 'location' : undefined}
              className={`public-focus-ring relative cursor-pointer rounded-md py-1 transition-colors ${
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
              aria-current={activeSection === 'industries' ? 'location' : undefined}
              className={`public-focus-ring relative cursor-pointer rounded-md py-1 transition-colors ${
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
              aria-current={activeSection === 'how-it-works' ? 'location' : undefined}
              className={`public-focus-ring relative cursor-pointer rounded-md py-1 transition-colors ${
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
              aria-current={activeSection === 'pricing' ? 'location' : undefined}
              className={`public-focus-ring relative cursor-pointer rounded-md py-1 transition-colors ${
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
              aria-current={activeSection === 'faq' ? 'location' : undefined}
              className={`public-focus-ring relative cursor-pointer rounded-md py-1 transition-colors ${
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
              className="public-focus-ring rounded-lg border border-slate-200 px-4 py-2 text-[13px] font-medium text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50/80 hover:text-slate-900"
            >
              Login
            </Link>

            <Link
              href="/onboarding"
              className="public-focus-ring flex items-center gap-1.5 rounded-lg bg-slate-950 px-4 py-2 text-[13px] font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-md active:translate-y-0 active:scale-[0.99]"
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
              className="public-focus-ring flex cursor-pointer items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-[11px] font-semibold text-emerald-800"
            >
              <span>Install App</span>
            </button>
            <Link
              href="/onboarding"
              className="public-focus-ring rounded-lg bg-slate-950 px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm"
            >
              Free Trial
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="public-focus-ring rounded-lg p-1.5 text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900"
              aria-label="Toggle Navigation Menu"
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-navigation-drawer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div id="mobile-navigation-drawer" className="mt-3 space-y-3 border-t border-slate-100 pt-4 pb-6 animate-in fade-in duration-200 md:hidden">
            <div className="flex flex-col space-y-2 text-sm font-medium text-slate-700">
              <a
                href="#features"
                onClick={(e) => {
                  e.preventDefault();
                  setMobileMenuOpen(false);
                  smoothScrollTo('#features');
                }}
                className="public-focus-ring flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 hover:bg-slate-50"
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
                className="public-focus-ring flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 hover:bg-slate-50"
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
                className="public-focus-ring flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 hover:bg-slate-50"
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
                className="public-focus-ring flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 hover:bg-slate-50"
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
                className="public-focus-ring flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 hover:bg-slate-50"
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
                className="public-focus-ring flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 py-2.5 text-center text-sm font-semibold text-emerald-800 hover:bg-emerald-100"
              >
                <span>📲 Install Mobile App on Phone</span>
              </button>
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="public-focus-ring w-full rounded-xl border border-slate-200 py-2.5 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Login to Client Portal
              </Link>
              <Link
                href="/onboarding"
                onClick={() => setMobileMenuOpen(false)}
                className="public-focus-ring flex w-full items-center justify-center gap-1.5 rounded-xl bg-slate-950 py-2.5 text-center text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
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
