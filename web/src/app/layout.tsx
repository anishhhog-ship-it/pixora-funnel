import type { Metadata, Viewport } from "next";
import "./globals.css";
import PwaRegister from "@/components/PwaRegister";
import ExtensionGuard from "@/components/ExtensionGuard";

const BASE_URL = "https://funnel.pixoraautomations.com";

export const viewport: Viewport = {
  themeColor: "#0B3D2E",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),

  title: {
    default: "Pixora Funnel – Review Funnels for Restaurants & Local Businesses",
    template: "%s | Pixora Funnel",
  },

  description:
    "Pixora Funnel gives restaurants, cafés, salons, clinics, and other local businesses a branded QR and NFC review journey with menus and follow-up workflows.",

  keywords: [
    "review funnel",
    "review funnel for restaurants",
    "Google review funnel India",
    "restaurant review management software",
    "get more Google reviews",
    "QR code review system",
    "NFC review tap card",
    "Google review automation",
    "local business reputation management",
    "restaurant reputation management India",
    "review funnel software",
    "increase Google reviews restaurant",
    "automated review generation",
    "review collection tool",
    "customer feedback funnel",
    "Pixora Funnel",
    "review funnel for cafes",
    "review funnel for salons",
    "digital menu QR code",
    "Google Maps ranking tool",
  ],

  authors: [{ name: "Pixora Automations", url: BASE_URL }],
  creator: "Pixora Automations",
  publisher: "Pixora Automations",

  category: "Business Software",

  alternates: {
    canonical: BASE_URL,
  },

  openGraph: {
    type: "website",
    locale: "en_IN",
    url: BASE_URL,
    siteName: "Pixora Funnel",
    title: "Pixora Funnel – Review Funnels for Restaurants & Local Businesses",
    description:
      "Create a branded QR and NFC customer feedback journey for your restaurant or local business with Pixora Funnel.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Pixora Funnel – Google Review Funnel for Local Businesses",
        type: "image/png",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Pixora Funnel – Branded Review Funnels for Restaurants",
    description:
      "Create a branded customer feedback and Google review journey using smart QR and NFC taps.",
    images: ["/og-image.png"],
    creator: "@pixoraapp",
    site: "@pixoraapp",
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  manifest: "/manifest.json",

  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Pixora Funnel",
  },

  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/icon.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },

  other: {
    "geo.region": "IN",
    "geo.country": "India",
    "language": "English",
    "revisit-after": "7 days",
    "rating": "general",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var o=Element.prototype.setAttribute;Element.prototype.setAttribute=function(n,v){if(n==='bis_skin_checked'||n==='bis_register'||n==='bis_size'||(n&&n.indexOf('bis_')===0))return;return o.apply(this,arguments);};if(typeof MutationObserver!=='undefined'){var clean=function(node){if(node&&node.removeAttribute){if(node.hasAttribute('bis_skin_checked'))node.removeAttribute('bis_skin_checked');if(node.hasAttribute('bis_register'))node.removeAttribute('bis_register');if(node.hasAttribute('bis_size'))node.removeAttribute('bis_size');}};var obs=new MutationObserver(function(mutations){for(var i=0;i<mutations.length;i++){var m=mutations[i];if(m.type==='attributes'&&m.attributeName&&(m.attributeName==='bis_skin_checked'||m.attributeName.indexOf('bis_')===0)){clean(m.target);}else if(m.type==='childList'&&m.addedNodes){for(var j=0;j<m.addedNodes.length;j++){var n=m.addedNodes[j];if(n.nodeType===1){clean(n);if(n.querySelectorAll){var nested=n.querySelectorAll('[bis_skin_checked],[bis_register],[bis_size]');for(var k=0;k<nested.length;k++)clean(nested[k]);}}}}}});obs.observe(document.documentElement,{attributes:true,childList:true,subtree:true,attributeFilter:['bis_skin_checked','bis_register','bis_size']});}}catch(e){}})();`,
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Playfair+Display:ital,wght@0,400;0,600;0,700;0,800;1,400&display=swap"
          rel="stylesheet"
        />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body
        className="antialiased min-h-screen bg-[#FDFBF7]"
        style={{ fontFamily: "'Inter', sans-serif" }}
        suppressHydrationWarning
      >
        <ExtensionGuard />
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
