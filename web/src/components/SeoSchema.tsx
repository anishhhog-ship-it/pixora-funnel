/**
 * SeoSchema.tsx
 * Injects JSON-LD structured data (Schema.org) into the page <head>.
 * This tells Google *exactly* what the site is, what it offers,
 * its pricing, FAQs, and org details — enabling rich results & better rankings.
 *
 * Schemas included:
 *  1. SoftwareApplication  → Enables "App" rich results with ratings & price
 *  2. Organization         → Establishes brand entity for Google's Knowledge Graph
 *  3. FAQPage              → Captures "People Also Ask" / Position Zero snippets
 *  4. WebSite              → Enables Sitelinks SearchBox in Google results
 */

const BASE_URL = "https://funnel.pixoraautomations.com";

const softwareApplicationSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Pixora Funnel",
  alternateName: [
    "Pixora Review Funnel",
    "Google Review Funnel for Restaurants",
    "Restaurant Review Management Software India",
  ],
  url: BASE_URL,
  description:
    "Pixora Funnel is India's #1 review funnel platform for local businesses. Collect more 5-star Google reviews using smart QR codes and NFC taps, protect your reputation with private feedback filtering, show a digital menu, and get real-time customer analytics — all with no monthly subscription.",
  applicationCategory: "BusinessApplication",
  applicationSubCategory: "Reputation Management Software",
  operatingSystem: "Web, iOS, Android",
  browserRequirements: "Requires JavaScript. Works in all modern browsers.",
  countriesSupported: "IN",
  inLanguage: "en-IN",
  screenshot: `${BASE_URL}/hero-mockup.jpg`,
  featureList: [
    "Google Review Funnel with QR Code",
    "NFC Tap Review Cards",
    "AI-Powered Review Suggestions",
    "Private Negative Feedback Filtering",
    "Digital Menu Builder",
    "Real-Time Customer Analytics",
    "Multi-Location Management",
    "Custom Branding & White Label",
    "Auto Reply to Google Reviews",
    "WhatsApp Notification Alerts",
  ],
  offers: [
    {
      "@type": "Offer",
      name: "Standard 1-Year Plan (Without NFC Card)",
      price: "2599",
      priceCurrency: "INR",
      description:
        "1-year software access. Includes QR review funnel, digital menu, scan analytics, and AI auto reply system. Without physical NFC card.",
      availability: "https://schema.org/LimitedAvailability",
      seller: {
        "@type": "Organization",
        name: "Pixora Automations",
      },
    },
    {
      "@type": "Offer",
      name: "Pro 1-Year Plan (With Custom NFC Review Card)",
      price: "2999",
      priceCurrency: "INR",
      description:
        "1-year software access + Custom Branded NFC Smart Tap Review Card delivered to your doorstep. Includes QR funnel, auto reply system, digital menu, and analytics.",
      availability: "https://schema.org/LimitedAvailability",
      seller: {
        "@type": "Organization",
        name: "Pixora Automations",
      },
    },
  ],
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.9",
    ratingCount: "127",
    bestRating: "5",
    worstRating: "1",
  },
  review: [
    {
      "@type": "Review",
      reviewRating: {
        "@type": "Rating",
        ratingValue: "5",
      },
      author: {
        "@type": "Person",
        name: "Rahul Sharma",
      },
      reviewBody:
        "Our Google reviews went from 42 to 120+ in just two months using Pixora Funnel. The QR standees are beautiful and customers love the experience.",
    },
    {
      "@type": "Review",
      reviewRating: {
        "@type": "Rating",
        ratingValue: "5",
      },
      author: {
        "@type": "Person",
        name: "Priya Mehta",
      },
      reviewBody:
        "Best investment for my restaurant. Setup took 5 minutes, and we now rank in the top 3 on Google Maps for our area.",
    },
  ],
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Pixora Automations",
  alternateName: "Pixora Funnel",
  url: BASE_URL,
  logo: `${BASE_URL}/pixora-logo.png`,
  image: `${BASE_URL}/hero-mockup.jpg`,
  description:
    "Pixora Automations builds review funnel software for local businesses across India. Our flagship product, Pixora Funnel, helps restaurants, cafés, salons, clinics, and retail stores collect more Google reviews using NFC and QR technology.",
  foundingDate: "2024",
  foundingLocation: {
    "@type": "Place",
    addressCountry: "IN",
  },
  areaServed: {
    "@type": "Country",
    name: "India",
  },
  contactPoint: [
    {
      "@type": "ContactPoint",
      telephone: "+91-92573-78047",
      contactType: "customer support",
      availableLanguage: ["English", "Hindi"],
      contactOption: "TollFree",
    },
  ],
  sameAs: [
    "https://wa.me/919257378047",
  ],
  knowsAbout: [
    "Google Review Funnel",
    "Restaurant Reputation Management",
    "QR Code Review System",
    "NFC Review Cards",
    "Local SEO for Restaurants",
    "Customer Feedback Management",
  ],
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is a review funnel for restaurants?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "A review funnel for restaurants is a system that guides customers through a quick experience after their visit — asking them to rate their time, then routing happy customers directly to your Google Business Profile to leave a 5-star review, while capturing unhappy feedback privately so you can fix issues before they go public.",
      },
    },
    {
      "@type": "Question",
      name: "How does Pixora Funnel work?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Customers scan your table QR code or tap an NFC card. They're greeted by your branded mobile page where they rate their visit. 4-5 star guests get AI-suggested review text and are sent directly to your Google review link. 1-3 star guests submit private feedback to you. The whole journey takes under 30 seconds.",
      },
    },
    {
      "@type": "Question",
      name: "How does Pixora Funnel pricing work?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Pixora Funnel offers two transparent 1-year plans with zero monthly SaaS fees: Standard Plan at ₹2,599/year (software only for 1 year, without physical NFC card) and Pro Plan at ₹2,999/year (software for 1 year + Custom NFC Smart Tap Review Card delivered to your doorstep). Both plans activate the 24/7 AI Auto Reply system.",
      },
    },
    {
      "@type": "Question",
      name: "Can I use Pixora Funnel for my restaurant to get more Google reviews?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Pixora Funnel is specifically designed to help restaurants, cafés, dhabas, and food outlets increase their Google reviews. Simply place our branded QR standee on each table, and customers can leave a review in under 30 seconds without downloading any app.",
      },
    },
    {
      "@type": "Question",
      name: "What is the best review funnel software in India?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Pixora Funnel is India's leading review funnel platform built specifically for local businesses. It combines QR code review collection, NFC tap cards, AI auto reply system, digital menus, and real-time analytics with no monthly fees starting at ₹2,599/year.",
      },
    },
    {
      "@type": "Question",
      name: "How can I improve my restaurant's Google Maps ranking?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The fastest way to improve your restaurant's Google Maps ranking is to increase the number and recency of your Google reviews. Pixora Funnel automates this by guiding every customer through a branded mobile review flow, generating a steady stream of new 5-star reviews that signal to Google that your restaurant is active and trusted.",
      },
    },
    {
      "@type": "Question",
      name: "Does the customer need to download an app to leave a review?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No app download is required. Customers simply scan the QR code with their phone camera or tap an NFC card. The review page opens instantly in their browser. The entire process takes under 30 seconds.",
      },
    },
    {
      "@type": "Question",
      name: "Can I use NFC cards for my restaurant review funnel?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Pixora Funnel supports NFC-enabled tap cards and acrylic standees. Customers simply tap their NFC-enabled phone on the card to be taken directly to your review funnel. NFC cards are available to order directly from the Pixora dashboard.",
      },
    },
    {
      "@type": "Question",
      name: "Do I need an existing website to use a review funnel?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No existing website is required. Pixora Funnel provides your business with a fully hosted, branded public page (e.g., funnel.pixoraautomations.com/f/your-business-name) that loads instantly on customer phones.",
      },
    },
    {
      "@type": "Question",
      name: "How quickly can I set up a review funnel for my business?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Setup takes under 5 minutes. Sign up, enter your Google Business Profile link, upload your logo, and your live review funnel is ready. Print or order QR standees from the dashboard and place them on your tables.",
      },
    },
  ],
};

const webSiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Pixora Funnel",
  url: BASE_URL,
  description:
    "India's #1 review funnel platform for restaurants and local businesses. Get more 5-star Google reviews using QR codes and NFC taps.",
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${BASE_URL}/signup?ref={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
  inLanguage: "en-IN",
  copyrightYear: new Date().getFullYear(),
  copyrightHolder: {
    "@type": "Organization",
    name: "Pixora Automations",
  },
};

export default function SeoSchema() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApplicationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteSchema) }}
      />
    </>
  );
}
