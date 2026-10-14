/**
 * Landing Page — Server Component
 *
 * IMPORTANT: This file must remain a Server Component (no 'use client').
 * The SEO metadata export in layout.tsx only applies when the page is server-rendered.
 * Client interactivity is handled inside child components.
 */

import type { Metadata } from "next";
import SeoSchema from "@/components/SeoSchema";
import LandingPageWrapper from "@/components/LandingPageWrapper";

const BASE_URL = "https://funnel.pixoraautomations.com";

export const metadata: Metadata = {
  title: "Pixora Funnel – Review Funnels for Restaurants & Local Businesses",
  description:
    "Give your restaurant, café, salon, or clinic a branded QR and NFC review journey with Pixora Funnel's customer feedback tools, menus, and follow-up workflows.",
  alternates: {
    canonical: BASE_URL,
  },
  openGraph: {
    title: "Pixora Funnel – Branded Review Funnels for Local Businesses",
    description:
      "Smart QR codes and NFC taps help local businesses create a clear customer feedback and Google review handoff. Explore the configured plans and trial.",
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
      <LandingPageWrapper />
    </>
  );
}
