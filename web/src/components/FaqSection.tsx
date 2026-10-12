'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface FaqItem {
  question: string;
  answer: string;
}

const faqs: FaqItem[] = [
  {
    question: 'What is Pixora Funnel?',
    answer: 'Pixora Funnel is a specialized customer experience and Google review platform for local businesses. It combines branded tabletop QR codes, smart review writing suggestions, digital menus, and business analytics into one simple system.',
  },
  {
    question: 'Do I need an existing website to use Pixora Funnel?',
    answer: 'No. Pixora Funnel provides you with a hosted, branded public page (e.g. funnel.pixoraautomations.com/f/your-business) that loads instantly on customer phones without requiring any existing domain or web hosting.',
  },
  {
    question: 'How do the pricing plans work?',
    answer: 'Pixora Funnel offers two transparent 1-year plans with zero monthly SaaS fees: (1) Standard Plan at ₹2,599/year (software only for 1 year, without physical NFC card) and (2) Pro Plan at ₹2,999/year (includes the complete software suite + a custom printed NFC Smart Tap Review Card delivered free to your door). Both plans activate the full AI Auto Reply System for your Google Business Profile.',
  },
  {
    question: 'Is the Auto Reply system available on trial accounts?',
    answer: 'The automated Google Review reply system is turned off for trial accounts. During your 1-day free trial, you can preview reply tones and simulate responses in the sandbox. Live automated 24/7 replies to incoming Google reviews will be activated immediately once you activate an active plan (₹2,599 or ₹2,999).',
  },
  {
    question: 'How does the QR funnel work?',
    answer: 'When a customer scans your QR code or taps an NFC tag, they are greeted by your branded mobile page. They can browse your menu or rate their visit. Positive ratings (4-5 stars) are seamlessly assisted with 1-click review text and routed directly to your Google Business Profile.',
  },
  {
    question: 'Can I connect my Google Business Profile?',
    answer: 'Yes! Simply paste your Google Maps link or Google Place ID during onboarding or inside your dashboard settings. All positive feedback routes directly to your official Google review submission screen.',
  },
  {
    question: 'Can I use NFC taps instead of QR codes?',
    answer: 'Yes. Every Pixora Funnel URL can be accessed via NFC tags. Our ₹2,999 plan comes with a custom-printed, ready-to-use NFC review card delivered to your doorstep so customers can simply tap their phone for 1-second reviews.',
  },
  {
    question: 'Can I use it for multiple business locations?',
    answer: 'Yes. You can manage multiple business outlets or franchises under your single owner account, each with its own unique QR codes, menu catalogs, and location-specific reviews.',
  },
  {
    question: 'What happens after the 1-day free trial?',
    answer: 'During your 1-day trial, you have full access to generate your live funnel, print sample QRs, and explore the dashboard. After the demo time expires, you can unlock your funnel and turn on the Auto Reply system by selecting either the ₹2,599 1-year plan (without NFC card) or the ₹2,999 1-year plan (with NFC review card). Message admin directly on WhatsApp (+91 92573 78047) for immediate activation.',
  },
  {
    question: 'Do customers need to create an account or download an app?',
    answer: 'Never. Customers simply open their standard phone camera, scan the QR code, and interact via their native browser in under 10 seconds. No app downloads or account logins are required for guests.',
  },
  {
    question: 'Can I customize my funnel branding?',
    answer: 'Yes. You can customize your brand logo, cover photos, brand colors (primary, secondary, accent), welcome tagline, and category-specific features like food menus or salon service lists at any time.',
  },
];

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section id="faq" className="py-20 md:py-24 bg-slate-50/70 border-t border-slate-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold uppercase tracking-wider mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
            FREQUENTLY ASKED QUESTIONS
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Common Questions & Answers
          </h2>
          <p className="mt-2 text-slate-600 text-sm sm:text-base">
            Everything you need to know about the product, trial, and setup.
          </p>
        </div>

        {/* Accordions */}
        <div className="space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden transition-all shadow-2xs"
              >
                <button
                  onClick={() => toggle(index)}
                  className="w-full px-6 py-4.5 text-left flex items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors"
                >
                  <span className="text-sm sm:text-base font-bold text-slate-800">
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-slate-400 shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-blue-600' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-6 pb-5 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100/70 animate-fadeIn">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Contact Admin Prompt */}
        <div className="mt-10 p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div>
            <h4 className="text-sm font-bold text-slate-900">Have questions about the Lifetime Plan or need scanner help?</h4>
            <p className="text-xs text-slate-500 mt-0.5">Chat directly with our founder on WhatsApp or call anytime.</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a
              href="https://wa.me/919257378047?text=Hi%20Pixora!%20I%20have%20a%20question%20about%20Pixora%20Funnel."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs"
            >
              <span>💬 WhatsApp: +91 92573 78047</span>
            </a>
            <a
              href="tel:9257378047"
              className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition"
            >
              <span>📞 Call</span>
            </a>
          </div>
        </div>

      </div>
    </section>
  );
}
