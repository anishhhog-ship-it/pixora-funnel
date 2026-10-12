/**
 * Landing Page — Server Component
 *
 * IMPORTANT: This file must remain a Server Component (no 'use client').
 * The SEO metadata export in layout.tsx only applies when the page is server-rendered.
 * Client interactivity is handled inside child components.
 */

import type { Metadata } from "next";
import dynamic from "next/dynamic";
import SeoSchema from "@/components/SeoSchema";

const LandingPageClient = dynamic(() => import("@/components/LandingPageClient"), {
  ssr: false,
  loading: () => <div className="min-h-screen bg-white" />,
});

const BASE_URL = "https://funnel.pixoraautomations.com";

export const metadata: Metadata = {
  title: "Pixora Funnel – #1 Review Funnel for Restaurants & Local Businesses in India",
  description:
    "Get more 5-star Google reviews for your restaurant, café, salon, or clinic with Pixora Funnel's smart QR & NFC review funnels. No monthly fees. Lifetime access at ₹2,599.",
  alternates: {
    canonical: BASE_URL,
  },
  openGraph: {
    title: "Pixora Funnel – Google Review Funnel for Local Businesses",
    description:
      "India's #1 review funnel platform. Smart QR codes + NFC taps help restaurants get more 5-star Google reviews automatically. ₹2,599 lifetime access.",
    url: BASE_URL,
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Pixora Funnel dashboard showing review funnel for restaurants",
      },
    ],
  },
};

export default function HomePage() {
  return (
    <>
      {/* Inject all JSON-LD structured data schemas */}
      <SeoSchema />

      {/* All interactive client-side landing page components */}
      <LandingPageClient />
    </>
  );
}
