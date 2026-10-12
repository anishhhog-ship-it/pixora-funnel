'use client';

import { useState, useEffect } from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { smoothScrollTo } from '@/lib/scrollUtils';

const SECTIONS = [
  { id: 'hero', label: 'Top' },
  { id: 'stats', label: 'Live Numbers' },
  { id: 'industries', label: 'Industries' },
  { id: 'features', label: 'Features' },
  { id: 'showcase', label: 'Platform Showcase' },
  { id: 'how-it-works', label: 'How It Works' },
  { id: 'why-pixora', label: 'Why Pixora' },
  { id: 'pricing', label: 'Pricing Plans' },
  { id: 'faq', label: 'FAQs' },
];

export default function ScrollController() {
  const [isVisible, setIsVisible] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? Math.min(100, Math.round((scrollY / docHeight) * 100)) : 0;
      setScrollProgress(progress);

      // Show floating controller once scrolled past 280px
      if (scrollY > 280) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }

      // Determine active section index
      const scrollPos = scrollY + 160;
      let activeIdx = 0;
      for (let i = SECTIONS.length - 1; i >= 0; i--) {
        const el = document.getElementById(SECTIONS[i].id);
        if (el && el.offsetTop <= scrollPos) {
          activeIdx = i;
          break;
        }
      }
      setCurrentSectionIndex(activeIdx);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!isVisible) return null;

  const currentSection = SECTIONS[currentSectionIndex] || SECTIONS[0];
  const nextSection = currentSectionIndex < SECTIONS.length - 1 
    ? SECTIONS[currentSectionIndex + 1] 
    : null;

  const scrollToNext = () => {
    if (nextSection) {
      smoothScrollTo(`#${nextSection.id}`);
    } else {
      smoothScrollTo('#hero');
    }
  };

  const scrollToTop = () => {
    smoothScrollTo('#hero');
  };

  return (
    <div 
      className="fixed bottom-20 md:bottom-8 right-3 sm:right-6 z-40 flex items-center gap-1.5 p-1 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/90 shadow-xl shadow-slate-900/10 transition-all duration-300 animate-in fade-in slide-in-from-bottom-3 select-none"
      role="navigation"
      aria-label="Page scroll controls"
    >
      {/* Scroll Up to Top Button */}
      <button
        type="button"
        onClick={scrollToTop}
        className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-700 hover:text-blue-600 hover:bg-blue-50 active:scale-95 transition-all cursor-pointer group"
        title="Scroll smoothly to top (Home)"
        aria-label="Scroll to top"
      >
        <ArrowUp className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
      </button>

      {/* Progress & Current Section Pill */}
      <div 
        onClick={scrollToNext}
        className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-xl bg-slate-50 hover:bg-slate-100/90 border border-slate-100 transition-colors cursor-pointer group"
        title={nextSection ? `Click to glide down to: ${nextSection.label}` : 'Click to glide back to top'}
      >
        {/* Circular SVG Mini Progress Ring */}
        <div className="relative w-4 h-4 flex items-center justify-center">
          <svg className="w-4 h-4 -rotate-90" viewBox="0 0 36 36">
            <path
              className="text-slate-200"
              strokeWidth="4"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              className="text-blue-600 transition-all duration-150"
              strokeDasharray={`${scrollProgress}, 100`}
              strokeWidth="4"
              strokeLinecap="round"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
        </div>

        <span className="text-[11px] font-semibold text-slate-700 group-hover:text-blue-600 transition-colors truncate max-w-[100px]">
          {currentSection.label}
        </span>
      </div>

      {/* Scroll Down / Next Section Button */}
      <button
        type="button"
        onClick={scrollToNext}
        className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-700 hover:text-blue-600 hover:bg-blue-50 active:scale-95 transition-all cursor-pointer group"
        title={nextSection ? `Scroll down to ${nextSection.label}` : 'Scroll back up to top'}
        aria-label="Scroll to next section"
      >
        <ArrowDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
      </button>
    </div>
  );
}
