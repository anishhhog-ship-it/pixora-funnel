/**
 * SeoSchema.tsx
 * Injects JSON-LD structured data (Schema.org) into the page <head>.
 * This tells Google *exactly* what the site is, what it offers,
 * its pricing, FAQs, and org details — enabling rich results & better rankings.
 *
 * Schemas included:
 *  1. SoftwareApplication  → Describes the product, features, and offers
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
    "Pixora Funnel is a review funnel platform for local businesses. Create a branded customer journey with smart QR codes and NFC taps, private feedback, digital menus, and customer analytics.",
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
       name: "Lifetime Software",
      price: "2599",
      priceCurrency: "INR",
      description:
         "Lifetime software access. Includes QR review funnel, digital menu, scan analytics, and AI auto reply system. Without physical NFC card.",
       availability: "https://schema.org/InStock",
      seller: {
        "@type": "Organization",
        name: "Pixora Automations",
      },
    },
    {
      "@type": "Offer",
       name: "Lifetime Software + NFC doorstep delivery",
      price: "2999",
      priceCurrency: "INR",
      description:
         "Lifetime software access plus a Custom Branded NFC Smart Tap Review Card delivered to your doorstep. Includes QR funnel, auto reply system, digital menu, and analytics.",
       availability: "https://schema.org/InStock",
      seller: {
        "@type": "Organization",
        name: "Pixora Automations",
      },
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
        text: "Customers scan your table QR code or tap an NFC card. They're greeted by your branded mobile page where they rate their visit. 4-5 star guests get AI-suggested review text and are sent directly to your Google review link. 1-3 star guests submit private feedback to you.",
      },
    },
    {
      "@type": "Question",
      name: "How does Pixora Funnel pricing work?",
      acceptedAnswer: {
        "@type": "Answer",
         text: "Pixora Funnel offers two transparent lifetime plans with zero monthly SaaS fees: Lifetime Software at ₹2,599 without a physical NFC card and Lifetime Software + NFC doorstep delivery at ₹2,999. Both plans include the full software suite and activate the 24/7 AI Auto Reply system.",
      },
    },
    {
      "@type": "Question",
      name: "Can I use Pixora Funnel for my restaurant to get more Google reviews?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Pixora Funnel is specifically designed to help restaurants, cafés, dhabas, and food outlets invite customer feedback. Place a branded QR standee on each table so customers can open the review journey without downloading an app.",
      },
    },
    {
      "@type": "Question",
      name: "What does Pixora Funnel include?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Pixora Funnel combines QR code review collection, NFC tap cards, review writing assistance, digital menus, private feedback, and customer activity views for local businesses. The configured plans are listed on the pricing section.",
      },
    },
    {
      "@type": "Question",
      name: "How can I improve my restaurant's Google Maps ranking?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Review quality and recency can contribute to a business's public presence, but no tool can guarantee a particular Google Maps ranking. Pixora Funnel gives customers a branded way to share their own feedback and continue to the business's Google review page.",
      },
    },
    {
      "@type": "Question",
      name: "Does the customer need to download an app to leave a review?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No app download is required. Customers scan the QR code with their phone camera or tap an NFC card, and the review page opens in their browser.",
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
        text: "No existing website is required. Pixora Funnel provides your business with a fully hosted, branded public page (e.g., funnel.pixoraautomations.com/f/your-business-name) that customers can open on their phones.",
      },
    },
    {
      "@type": "Question",
      name: "How quickly can I set up a review funnel for my business?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Sign up, enter your Google Business Profile link, upload your logo, and follow the guided setup to publish your review funnel. Print or order QR standees from the dashboard and place them on your tables.",
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
    "A branded QR and NFC customer feedback and Google review journey for restaurants and local businesses.",
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${BASE_URL}/onboarding?ref={search_term_string}`,
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
