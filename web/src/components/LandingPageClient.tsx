'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import StatsCounterSection from '@/components/StatsCounterSection';
import IndustriesSection from '@/components/IndustriesSection';
import FeaturesSection from '@/components/FeaturesSection';
import ProductShowcase from '@/components/ProductShowcase';
import HowItWorks from '@/components/HowItWorks';
import WhyPixora from '@/components/WhyPixora';
import PricingSection from '@/components/PricingSection';
import FaqSection from '@/components/FaqSection';
import TrialCtaStrip from '@/components/TrialCtaStrip';
import Footer from '@/components/Footer';
import DemoModal from '@/components/DemoModal';
import MobileAppBottomNav from '@/components/MobileAppBottomNav';
import PwaInstallPrompt from '@/components/PwaInstallPrompt';
import ScrollController from '@/components/ScrollController';

export default function LandingPageClient() {
  const [isDemoOpen, setIsDemoOpen] = useState(false);

  return (
    <div
      suppressHydrationWarning
      className="min-h-screen bg-white text-slate-900 selection:bg-blue-100 selection:text-blue-900 font-sans antialiased pb-20 md:pb-0"
    >
      {/* 1. Sticky Desktop & Mobile Header */}
      <Navbar />

      <main id="main-content">
        {/* 2. Hero Section with Product Mockup Composition */}
        <Hero onOpenDemo={() => setIsDemoOpen(true)} />

        {/* 2.5 Live Real-Time Numbers Section */}
        <StatsCounterSection />

        {/* 3. Built for Local Businesses & 8 Category Cards */}
        <IndustriesSection />

        {/* 4. Powerful Features (6 Feature Cards) */}
        <FeaturesSection />

        {/* 5. Product Showcase (Customer Journey vs Business Portal) */}
        <ProductShowcase />

        {/* 6. Go Live in 4 Simple Steps Timeline */}
        <HowItWorks />

        {/* 7. Why Pixora Funnel (Honest Value Pillars) */}
        <WhyPixora />

        {/* 8. Simple Pricing (₹2,599 Lifetime + Hardware) */}
        <PricingSection />

        {/* 9. High-Quality SEO-Optimized FAQs */}
        <FaqSection />

        {/* 10. Bottom 1-Day Free Trial CTA Strip */}
        <TrialCtaStrip />
      </main>

      {/* 11. Footer */}
      <Footer />

      {/* Mobile App Bottom Navigation Bar (Visible on mobile viewports) */}
      <MobileAppBottomNav onOpenDemo={() => setIsDemoOpen(true)} />

      {/* PWA Chrome Install Prompt & iOS Guide */}
      <PwaInstallPrompt source="landing" businessName="Pixora Funnel" />

      {/* Interactive Demo Walkthrough Modal */}
      <DemoModal
        isOpen={isDemoOpen}
        onClose={() => setIsDemoOpen(false)}
      />

      {/* Floating Animated Smooth Scroll Navigator */}
      <ScrollController />
    </div>
  );
}
