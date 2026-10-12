import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Shield, Lock, Eye, FileText, Phone, Mail, CheckCircle2 } from 'lucide-react';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Privacy Policy for Pixora Funnel by Pixora Automations. Learn how we handle, protect, and respect your data.',
};

export default function PrivacyPolicyPage() {
  const lastUpdated = 'October 6, 2026';

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-blue-100 selection:text-blue-900 font-sans antialiased flex flex-col justify-between">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100 py-3.5 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <Image
              src="/pixora-logo.png"
              alt="Pixora Funnel"
              width={200}
              height={55}
              className="h-10 sm:h-12 w-auto object-contain transition-transform group-hover:scale-105"
            />
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-50"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 flex-1">
        {/* Title Header */}
        <div className="border-b border-slate-200 pb-8 mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold uppercase tracking-wider mb-3">
            <Shield className="w-3.5 h-3.5" />
            <span>Data Protection & Trust</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">
            Privacy Policy
          </h1>
          <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
            Your trust is our foundation. This policy describes how <strong>Pixora Funnel</strong> (operated by <strong>Pixora Automations</strong>) collects, utilizes, and protects information across our platform and customer review funnels.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-500 font-medium">
            <span>Last Updated: {lastUpdated}</span>
            <span>•</span>
            <span>Applies to: funnel.pixoraautomations.com</span>
            <span>•</span>
            <span className="text-emerald-600 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> DPDP & IT Act Compliant
            </span>
          </div>
        </div>

        {/* Policy Sections */}
        <div className="space-y-10 text-sm sm:text-base text-slate-700 leading-relaxed">
          
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span className="text-blue-600">1.</span> Information We Collect
            </h2>
            <p>
              When you use Pixora Funnel—either as a business owner registering for our service or as an end-customer scanning a physical QR code or tapping an NFC stand—we may collect the following information:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                <h3 className="font-bold text-slate-900 text-sm mb-1.5 flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-blue-600" />
                  Business Owner Account Data
                </h3>
                <ul className="text-xs sm:text-sm text-slate-600 space-y-1 list-disc list-inside">
                  <li>Business Name and category (Restaurant, Salon, Clinic, etc.)</li>
                  <li>Account owner mobile phone number and login credentials</li>
                  <li>Google Business Profile Maps review URL or Place ID</li>
                  <li>Branding assets: brand logos, cover banners, and menu items</li>
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                <h3 className="font-bold text-slate-900 text-sm mb-1.5 flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-emerald-600" />
                  End-Customer Interaction Data
                </h3>
                <ul className="text-xs sm:text-sm text-slate-600 space-y-1 list-disc list-inside">
                  <li>Star sentiment ratings submitted through the review funnel (1 to 5 stars)</li>
                  <li>Private feedback resolution text (for 1-3 star ratings)</li>
                  <li>Optional customer contact details provided voluntarily for resolution</li>
                  <li>Anonymized telemetry: scan timestamps and browser user-agent</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span className="text-blue-600">2.</span> How We Use Your Information
            </h2>
            <p>We process collected data solely for legitimate business operations, specifically:</p>
            <ul className="space-y-2 list-disc list-inside text-slate-600 pl-2">
              <li><strong>Generating Branded Customer Funnels:</strong> Hosting your unique business QR experience at <code className="text-xs font-mono bg-slate-100 px-1 py-0.5 rounded">/f/[business-slug]</code>.</li>
              <li><strong>Reputation Protection & Routing:</strong> Assisting happy customers with 1-tap review text and routing them directly to your Google Business Profile, while directing 1-3 star feedback to your private portal.</li>
              <li><strong>Owner Alert Notifications:</strong> Sending instant alerts to business owners when private negative feedback requires timely resolution before it impacts public ratings.</li>
              <li><strong>Analytics & Metrics:</strong> Displaying scan counts, visitor conversions, and feedback sentiment within your business dashboard.</li>
              <li><strong>Account Administration:</strong> Managing your 1-day free trial, lifetime subscription status, and customer support inquiries.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span className="text-blue-600">3.</span> Google Business Profile & Third-Party Services
            </h2>
            <p>
              Pixora Funnel is designed to assist businesses with legitimate customer feedback. We adhere strictly to the following principles:
            </p>
            <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-100 space-y-2 text-slate-700">
              <p className="font-semibold text-blue-900">
                Transparent Customer Routing
              </p>
              <p className="text-xs sm:text-sm">
                Customers who choose to submit a Google review do so through their own Google accounts on Google Maps. Pixora Funnel does not post reviews automatically without user consent, does not generate fake reviews, and does not capture Google account passwords.
              </p>
            </div>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span className="text-blue-600">4.</span> Data Storage & Security Measures
            </h2>
            <p>
              All customer and business records are stored securely in enterprise cloud databases protected by:
            </p>
            <ul className="space-y-1.5 list-disc list-inside text-slate-600 pl-2">
              <li><strong>SSL/TLS Encryption:</strong> All data transmitted between browsers and our servers uses 256-bit encryption (HTTPS).</li>
              <li><strong>Row Level Security (RLS):</strong> Multi-tenant isolation guarantees that business owners can only view and edit their own business records.</li>
              <li><strong>Secure Cloud Storage:</strong> Media assets (logos, menus) are stored in dedicated cloud buckets with secure access controls.</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span className="text-blue-600">5.</span> 1-Day Free Trial & Demo Expiration
            </h2>
            <p>
              New businesses receive a 24-hour full-featured trial. When the demo countdown reaches zero without an active lifetime subscription, public access to the review scanner is paused. While the scanner displays a trial completion notice with purchase instructions, your historical reviews and analytics remain safe in your dashboard archive.
            </p>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span className="text-blue-600">6.</span> Cookies & Local Storage
            </h2>
            <p>
              We do not use invasive third-party tracking cookies or sell user profiles to advertisers. We use essential browser <code className="text-xs font-mono bg-slate-100 px-1 py-0.5 rounded">localStorage</code> solely to remember your login session, manage PWA install prompt status, and provide smooth interface preferences.
            </p>
          </section>

          {/* Section 7 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span className="text-blue-600">7.</span> Your Rights & Data Deletion
            </h2>
            <p>
              As a business owner or guest, you have the right to request access to your personal information, request corrections, or request complete account deletion. To request data removal, simply contact our support team.
            </p>
          </section>

          {/* Section 8: Contact */}
          <section className="space-y-3 pt-4 border-t border-slate-200">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span className="text-blue-600">8.</span> Contact Us & Grievance Redressal
            </h2>
            <p>
              If you have any questions, feedback, or privacy-related requests, please reach out to our team:
            </p>
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3">
              <div className="font-bold text-slate-900">Pixora Automations — Privacy Office</div>
              <div className="text-xs sm:text-sm text-slate-600 space-y-1.5">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Direct Phone & WhatsApp: <a href="tel:9257378047" className="text-blue-600 font-semibold hover:underline">+91 92573 78047</a></span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Support Email: <a href="mailto:support@pixoraautomations.com" className="text-blue-600 font-semibold hover:underline">support@pixoraautomations.com</a></span>
                </div>
                <div>Domain: <span className="font-mono text-slate-700">funnel.pixoraautomations.com</span></div>
              </div>
            </div>
          </section>

        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
