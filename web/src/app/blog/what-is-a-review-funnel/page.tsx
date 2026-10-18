import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'What is a Review Funnel? Complete Guide for Restaurants in India (2025)',
  description:
    'A review funnel automatically guides happy customers to leave 5-star Google reviews while catching negative feedback privately. Learn how it works and how restaurants can use it to rank higher on Google Maps.',
  alternates: {
    canonical: 'https://funnel.pixoraautomations.com/blog/what-is-a-review-funnel',
  },
  openGraph: {
    title: 'What is a Review Funnel? Complete Guide for Restaurants (2025)',
    description:
      'Learn how a review funnel works and how restaurants in India can use QR code review funnels to get more 5-star Google reviews and rank higher on Google Maps.',
    url: 'https://funnel.pixoraautomations.com/blog/what-is-a-review-funnel',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is a review funnel?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "A review funnel is an automated system that guides customers through a branded experience after their visit. It first asks them to rate their experience privately. Happy customers (4-5 stars) are then directed to your Google Business Profile to leave a public review. Unhappy customers (1-3 stars) are captured privately so you can resolve issues before they appear on Google.",
      },
    },
    {
      "@type": "Question",
      name: "How does a review funnel help a restaurant rank on Google Maps?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Google's local search algorithm uses review quantity, recency, and average star rating as key ranking signals. A review funnel creates a steady stream of new reviews, which signals to Google that your restaurant is active and trusted, pushing you higher in Google Maps results.",
      },
    },
    {
      "@type": "Question",
      name: "What is the best review funnel software for restaurants in India?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Pixora Funnel is India's leading review funnel platform for restaurants, cafés, and local businesses. It includes branded QR standees, NFC tap cards, AI review suggestions, digital menu builder, and analytics — all with no monthly subscription at ₹2,599 lifetime.",
      },
    },
  ],
};

const articleJsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "What is a Review Funnel? Complete Guide for Restaurants in India (2025)",
  description:
    "A review funnel automatically guides happy customers to leave 5-star Google reviews while catching negative feedback privately.",
  image: "https://funnel.pixoraautomations.com/og-image.png",
  datePublished: "2025-01-01",
  dateModified: new Date().toISOString().split("T")[0],
  author: {
    "@type": "Organization",
    name: "Pixora Automations",
    url: "https://funnel.pixoraautomations.com",
  },
  publisher: {
    "@type": "Organization",
    name: "Pixora Automations",
    logo: {
      "@type": "ImageObject",
      url: "https://funnel.pixoraautomations.com/pixora-logo.png",
    },
  },
  mainEntityOfPage: {
    "@type": "WebPage",
    "@id": "https://funnel.pixoraautomations.com/blog/what-is-a-review-funnel",
  },
};

export default function WhatIsReviewFunnelPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />

      <div className="min-h-screen bg-white">
        {/* Header */}
        <header className="border-b border-slate-100 bg-white sticky top-0 z-50">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
            <Link href="/">
              <Image src="/pixora-logo.png" alt="Pixora Funnel" width={140} height={38} className="h-9 w-auto" />
            </Link>
            <Link
              href="/onboarding"
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
            >
              Start Free Trial →
            </Link>
          </div>
        </header>

        {/* Article */}
        <article className="max-w-3xl mx-auto px-4 py-12 sm:py-16">
          {/* Breadcrumb */}
          <nav className="text-xs text-slate-500 mb-6" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-blue-600">Home</Link>
            <span className="mx-2">/</span>
            <Link href="/blog" className="hover:text-blue-600">Blog</Link>
            <span className="mx-2">/</span>
            <span>What is a Review Funnel?</span>
          </nav>

          {/* Category Tag */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold uppercase tracking-wider mb-4">
            Restaurant SEO Guide
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.1] mb-4">
            What is a Review Funnel? <br className="hidden sm:block" />
            <span className="text-blue-600">Complete Guide for Restaurants</span>
          </h1>

          <p className="text-lg text-slate-600 leading-relaxed mb-6">
            A review funnel is one of the most powerful — and underused — tools for helping
            restaurants and local businesses rank higher on Google Maps and attract more customers.
            This guide explains exactly what a review funnel is, how it works, and how to set one
            up for your restaurant in India in under 5 minutes.
          </p>

          {/* Meta info */}
          <div className="flex items-center gap-4 text-sm text-slate-500 border-b border-slate-100 pb-6 mb-8">
            <span>By <strong className="text-slate-700">Pixora Automations</strong></span>
            <span>·</span>
            <span>January 2025</span>
            <span>·</span>
            <span>8 min read</span>
          </div>

          {/* Hero Image */}
          <div className="rounded-2xl overflow-hidden border border-slate-200 mb-10 shadow-md">
            <Image
              src="/hero-mockup.jpg"
              alt="Pixora Funnel review funnel QR code system for restaurants"
              width={800}
              height={533}
              className="w-full h-auto"
            />
          </div>

          {/* TOC */}
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 mb-10">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Table of Contents</p>
            <ol className="space-y-1.5 text-sm text-blue-700 font-medium">
              <li><a href="#what-is" className="hover:underline">1. What is a Review Funnel?</a></li>
              <li><a href="#how-it-works" className="hover:underline">2. How Does a Review Funnel Work?</a></li>
              <li><a href="#restaurant-seo" className="hover:underline">3. Why Restaurants Need a Review Funnel for Google SEO</a></li>
              <li><a href="#qr-nfc" className="hover:underline">4. QR Code & NFC Review Funnels Explained</a></li>
              <li><a href="#setup" className="hover:underline">5. How to Set Up a Review Funnel for Your Restaurant</a></li>
              <li><a href="#best-software" className="hover:underline">6. Best Review Funnel Software in India</a></li>
              <li><a href="#faq" className="hover:underline">7. Frequently Asked Questions</a></li>
            </ol>
          </div>

          {/* Content */}
          <div className="prose prose-slate prose-lg max-w-none space-y-8">

            <section id="what-is">
              <h2 className="text-2xl font-bold text-slate-900 mb-3">What is a Review Funnel?</h2>
              <p className="text-slate-600 leading-relaxed">
                A <strong>review funnel</strong> is a system that automatically guides your customers
                through a step-by-step experience after their visit, with the goal of getting more
                5-star Google reviews while privately capturing any negative feedback before it goes
                public.
              </p>
              <p className="text-slate-600 leading-relaxed">
                Think of it as a customer experience filter: happy customers (those who rate 4 or 5
                stars) are immediately sent to your Google Business Profile to leave a review. Unhappy
                customers (1–3 stars) are redirected to a private feedback form, giving you the chance
                to fix the issue before it becomes a damaging public review.
              </p>
              <div className="bg-blue-50 rounded-xl p-5 border border-blue-100">
                <p className="text-sm font-semibold text-blue-900">
                  💡 <strong>Key takeaway:</strong> A review funnel maximises the number of 5-star
                  Google reviews your business receives while minimising the number of 1-star public
                  complaints.
                </p>
              </div>
            </section>

            <section id="how-it-works">
              <h2 className="text-2xl font-bold text-slate-900 mb-3">How Does a Review Funnel Work?</h2>
              <p className="text-slate-600 leading-relaxed">
                Here is the step-by-step flow of a modern review funnel for restaurants:
              </p>
              <ol className="space-y-4 mt-4">
                {[
                  { n: "1", title: "Customer scans QR code or taps NFC card", desc: "After their meal, the customer scans the QR standee on the table with their phone camera — no app required. The branded page loads in under 2 seconds." },
                  { n: "2", title: "Customer rates their experience privately", desc: "They see your logo and a simple star rating. This is a private, internal rating — NOT yet on Google." },
                  { n: "3", title: "Happy customers are sent to Google (4–5 stars)", desc: "If they tap 4 or 5 stars, they are shown AI-suggested review text and a direct link to your Google Business Profile review page." },
                  { n: "4", title: "Unhappy customers submit private feedback (1–3 stars)", desc: "If they tap 1–3 stars, they see a private feedback form. Their complaint goes directly to your dashboard — not to Google." },
                  { n: "5", title: "You respond and retain the customer", desc: "You see the feedback in your Pixora dashboard and can resolve the issue, turn a negative experience into a loyal customer, and protect your rating." },
                ].map((step) => (
                  <li key={step.n} className="flex gap-4 p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
                    <span className="w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-bold flex-shrink-0 flex items-center justify-center">{step.n}</span>
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">{step.title}</p>
                      <p className="text-slate-600 text-sm mt-0.5">{step.desc}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>

            <section id="restaurant-seo">
              <h2 className="text-2xl font-bold text-slate-900 mb-3">Why Restaurants Need a Review Funnel for Google SEO</h2>
              <p className="text-slate-600 leading-relaxed">
                Google uses three core factors to rank local businesses in the <strong>Google Maps Local Pack</strong> (the top 3 results you see on Google Maps):
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-5">
                {[
                  { label: "Relevance", desc: "How well your profile matches the search query" },
                  { label: "Distance", desc: "How close your restaurant is to the searcher" },
                  { label: "Prominence", desc: "Review count, rating, and online mentions" },
                ].map((item) => (
                  <div key={item.label} className="bg-white rounded-xl border border-slate-200 p-4 text-center shadow-xs">
                    <p className="font-bold text-slate-900">{item.label}</p>
                    <p className="text-xs text-slate-500 mt-1">{item.desc}</p>
                  </div>
                ))}
              </div>
              <p className="text-slate-600 leading-relaxed">
                <strong>Prominence</strong> is the factor you have the most direct control over —
                and it is almost entirely driven by your Google reviews. Restaurants with more recent,
                high-quality reviews consistently outrank competitors on Google Maps, even if those
                competitors have been in business longer.
              </p>
              <p className="text-slate-600 leading-relaxed">
                A review funnel automates the process of collecting reviews, creating a steady
                &quot;review velocity&quot; that signals to Google that your restaurant is active
                and trusted. Businesses using a review funnel typically see <strong>3–5× more
                reviews per month</strong> compared to those who ask manually.
              </p>
            </section>

            <section id="qr-nfc">
              <h2 className="text-2xl font-bold text-slate-900 mb-3">QR Code & NFC Review Funnels Explained</h2>
              <p className="text-slate-600 leading-relaxed">
                There are two main physical touchpoints that trigger a review funnel for restaurant
                customers:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 my-5">
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
                  <p className="font-bold text-slate-900 text-base mb-2">📱 QR Code Standee</p>
                  <ul className="text-sm text-slate-600 space-y-1.5">
                    <li>• Customer scans with phone camera (no app)</li>
                    <li>• Printable on paper, acrylic, or table inserts</li>
                    <li>• Works on every smartphone made after 2017</li>
                    <li>• Can be reprinted if your Google link changes</li>
                    <li>• Best for: restaurants, cafés, retail counters</li>
                  </ul>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
                  <p className="font-bold text-slate-900 text-base mb-2">⚡ NFC Tap Card</p>
                  <ul className="text-sm text-slate-600 space-y-1.5">
                    <li>• Customer taps phone on the card — instant open</li>
                    <li>• Embedded in acrylic standees or cards</li>
                    <li>• Works on all NFC-enabled smartphones (iOS & Android)</li>
                    <li>• Feels premium and futuristic</li>
                    <li>• Best for: upscale restaurants, salons, hotel lobbies</li>
                  </ul>
                </div>
              </div>
              <p className="text-slate-600 leading-relaxed">
                Both methods open the same branded review funnel page. Most businesses use both —
                a QR code for maximum compatibility and an NFC card for the premium customer experience.
              </p>
            </section>

            <section id="setup">
              <h2 className="text-2xl font-bold text-slate-900 mb-3">How to Set Up a Review Funnel for Your Restaurant (5 Minutes)</h2>
              <ol className="space-y-4">
                {[
                  { n: "1", title: "Sign up for Pixora Funnel", desc: "Create your account at funnel.pixoraautomations.com — no credit card required for the 1-day free trial." },
                  { n: "2", title: "Enter your Google Business Profile link", desc: "Paste your Google Maps URL or Place ID. Pixora automatically extracts your review link." },
                  { n: "3", title: "Upload your logo and customize branding", desc: "Set your restaurant name, logo, cover photo, and brand colors. Your funnel is now live." },
                  { n: "4", title: "Print or order your QR standees", desc: "Download the QR code PDF from your dashboard and print it, or order ready-made acrylic standees shipped to your door." },
                  { n: "5", title: "Place standees on every table", desc: "That's it. Every customer who scans is now part of your review funnel." },
                ].map((step) => (
                  <li key={step.n} className="flex gap-4">
                    <span className="w-7 h-7 rounded-full bg-emerald-600 text-white text-xs font-bold flex-shrink-0 flex items-center justify-center mt-0.5">{step.n}</span>
                    <div>
                      <p className="font-semibold text-slate-800">{step.title}</p>
                      <p className="text-slate-600 text-sm mt-0.5">{step.desc}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>

            <section id="best-software">
              <h2 className="text-2xl font-bold text-slate-900 mb-3">Best Review Funnel Software in India (2025)</h2>
              <p className="text-slate-600 leading-relaxed">
                While international options like Birdeye, Podium, and NiceJob exist, they charge
                ₹5,000–₹15,000 per month and are not optimised for the Indian market. <strong>Pixora
                Funnel</strong> is built specifically for Indian restaurants, cafés, salons, and clinics,
                with:
              </p>
              <ul className="space-y-2 mt-4">
                {[
                  "One-time lifetime pricing at ₹2,599 (no monthly fees)",
                  "Hindi + English customer-facing pages",
                  "WhatsApp notification alerts for new reviews & feedback",
                  "Physical QR acrylic standees shipped across India",
                  "NFC tap cards that work with any NTAG213/215/216 chip",
                  "Digital menu builder for restaurants (no website needed)",
                  "Google Maps ranking analytics dashboard",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                    <span className="text-emerald-600 mt-0.5">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* FAQ Section */}
            <section id="faq">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Frequently Asked Questions</h2>
              <div className="space-y-4">
                {[
                  {
                    q: "What is a review funnel?",
                    a: "A review funnel is an automated system that guides customers to leave 5-star Google reviews after their visit, while catching unhappy feedback privately before it goes public.",
                  },
                  {
                    q: "How does a review funnel help my restaurant rank on Google?",
                    a: "Google's local ranking algorithm rewards businesses with more reviews, higher average ratings, and recent review activity. A review funnel automates this process, creating a steady stream of new 5-star reviews that push your restaurant up in Google Maps results.",
                  },
                  {
                    q: "Is review gating (filtering bad reviews) allowed by Google?",
                    a: "Google's policy prohibits selectively soliciting only positive reviews. Pixora Funnel is designed to collect authentic feedback — all customers go through the rating step before being directed to Google, which complies with Google's review policies.",
                  },
                  {
                    q: "How much does review funnel software cost in India?",
                    a: "International tools like Birdeye or Podium cost ₹5,000–₹15,000/month. Pixora Funnel offers a one-time lifetime plan at ₹2,599 with no monthly fees, making it the most affordable review funnel platform in India.",
                  },
                ].map((item, i) => (
                  <div key={i} className="bg-slate-50 rounded-xl border border-slate-200 p-5">
                    <p className="font-bold text-slate-900 text-sm mb-2">{item.q}</p>
                    <p className="text-slate-600 text-sm leading-relaxed">{item.a}</p>
                  </div>
                ))}
              </div>
            </section>

          </div>

          {/* CTA Banner */}
          <div className="mt-12 bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-8 text-center">
            <p className="text-white text-2xl font-extrabold mb-2">Ready to Get More Google Reviews?</p>
            <p className="text-slate-400 text-sm mb-6">
              Set up your restaurant&apos;s review funnel in 5 minutes. 1-day free trial — no credit card.
            </p>
            <Link
              href="/onboarding"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-6 py-3 rounded-xl transition shadow-lg"
            >
              Start Free Trial — It&apos;s Free →
            </Link>
            <p className="text-xs text-slate-500 mt-3">Lifetime access at ₹2,599 · No monthly fees</p>
          </div>

          {/* Internal links */}
          <div className="mt-10 pt-8 border-t border-slate-100">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Related Pages</p>
            <div className="flex flex-wrap gap-2">
              <Link href="/#features" className="text-sm text-blue-700 hover:underline font-medium">Features →</Link>
              <Link href="/#pricing" className="text-sm text-blue-700 hover:underline font-medium">Pricing →</Link>
              <Link href="/#faq" className="text-sm text-blue-700 hover:underline font-medium">FAQ →</Link>
              <Link href="/onboarding" className="text-sm text-blue-700 hover:underline font-medium">Start Free Trial →</Link>
            </div>
          </div>
        </article>

        {/* Simple footer */}
        <footer className="border-t border-slate-100 bg-slate-50 py-8 text-center text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Pixora Automations. All rights reserved.</p>
          <div className="mt-2 flex items-center justify-center gap-4">
            <Link href="/" className="hover:text-blue-600">Home</Link>
            <Link href="/privacy" className="hover:text-blue-600">Privacy</Link>
            <Link href="/terms" className="hover:text-blue-600">Terms</Link>
          </div>
        </footer>
      </div>
    </>
  );
}
