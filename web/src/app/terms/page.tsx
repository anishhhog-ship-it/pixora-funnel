import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Scale, Clock, ShieldCheck, CheckCircle2, Phone, Mail, AlertCircle, Sparkles } from 'lucide-react';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Terms of Service and Customer Agreement for Pixora Funnel by Pixora Automations.',
};

export default function TermsOfServicePage() {
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
            <Scale className="w-3.5 h-3.5" />
            <span>Service Agreement</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">
            Terms of Service
          </h1>
          <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
            Please read these Terms of Service carefully before utilizing <strong>Pixora Funnel</strong> or any hardware solutions provided by <strong>Pixora Automations</strong>.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-500 font-medium">
            <span>Last Updated: {lastUpdated}</span>
            <span>•</span>
            <span>Applies to: funnel.pixoraautomations.com</span>
            <span>•</span>
            <span className="text-blue-600 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Effective Immediately
            </span>
          </div>
        </div>

        {/* Terms Sections */}
        <div className="space-y-10 text-sm sm:text-base text-slate-700 leading-relaxed">
          
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span className="text-blue-600">1.</span> Acceptance of Terms
            </h2>
            <p>
              By signing up for an account, generating a funnel, scanning an assigned QR code, or utilizing any of our software and physical NFC hardware, you acknowledge and agree to comply with these Terms of Service and our Privacy Policy. If you do not agree to these terms, you must discontinue using our services immediately.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span className="text-blue-600">2.</span> Description of Service
            </h2>
            <p>
              Pixora Funnel delivers specialized customer engagement, feedback collection, digital menu hosting, and Google Business Profile review routing software for local businesses. Core components include:
            </p>
            <ul className="space-y-1.5 list-disc list-inside text-slate-600 pl-2">
              <li>Hosted customer-facing QR & NFC mobile review funnels at unique URLs.</li>
              <li>A sentiment-based routing engine: guiding 4-5 star experiences to Google Maps and channeling 1-3 star feedback to a private owner inbox.</li>
              <li>Interactive digital menus and service catalogs for restaurants, salons, clinics, and local stores.</li>
              <li>A unified web dashboard providing scan telemetry, customer feedback analytics, and auto-reply tooling.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span className="text-blue-600">3.</span> 1-Day Free Trial Policy
            </h2>
            <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-900">
                <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                <span>24-Hour Trial Duration & Expiration Rules</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                Every newly created business account receives a complimentary <strong>1-Day (24-Hour) Free Trial</strong> without requiring a credit card.
              </p>
              <ul className="text-xs sm:text-sm text-slate-700 space-y-1 list-disc list-inside pt-1">
                <li>During the trial, the business has complete access to create menus, generate QR codes, and test the customer review funnel.</li>
                <li>When the trial duration expires (countdown reaches zero), the live client funnel is taken down.</li>
                <li>When guests scan an expired funnel QR code, a notification is displayed: <em>&ldquo;The free trial has been ended. Request the admin to unlock your scanner or purchase for ₹2,599 lifetime now.&rdquo;</em></li>
                <li>Funnel access can be restored immediately by contacting the admin at <strong>+91 92573 78047</strong> or by completing the Lifetime Access purchase.</li>
              </ul>
            </div>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span className="text-blue-600">4.</span> Lifetime Access Pricing
            </h2>
            <p>
              Pixora Funnel offers a special <strong>Lifetime Access Plan</strong> designed to eliminate ongoing monthly software subscriptions for local businesses.
            </p>
            <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200/80 space-y-2">
               <div className="flex items-center gap-2 font-bold text-blue-900">
                 <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                 <span>Two Lifetime Plans</span>
               </div>
               <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                 Pixora Funnel offers Lifetime Software at <strong>₹2,599</strong> without NFC hardware and Lifetime Software + NFC doorstep delivery at <strong>₹2,999</strong>. Both are one-time purchases with lifetime access and no account cap.
               </p>
            </div>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span className="text-blue-600">5.</span> Physical Hardware & Add-ons
            </h2>
            <p>
              Optional physical items—such as NFC tap cards, tabletop clear acrylic stands, and multi-table stand packages—are customized with your business QR codes and delivered to your specified shipping address. Once physical materials are customized and printed, hardware orders are non-refundable unless damaged upon arrival.
            </p>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span className="text-blue-600">6.</span> Business Owner Responsibilities & Acceptable Use
            </h2>
            <p>As an account holder, you agree that you will not:</p>
            <ul className="space-y-1.5 list-disc list-inside text-slate-600 pl-2">
              <li>Upload unlawful, fraudulent, defamatory, or infringing content (including trademarks or copyrighted logos you do not own).</li>
              <li>Provide false Google Place links or attempt to route reviews to an unrelated third-party entity.</li>
              <li>Use automated bots or scripts to generate synthetic scan counts or false feedback records.</li>
              <li>Attempt to reverse-engineer, decompile, or compromise the security of the Pixora Funnel platform.</li>
            </ul>
          </section>

          {/* Section 7 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span className="text-blue-600">7.</span> Google Maps & Third-Party Platforms
            </h2>
            <p>
              Pixora Funnel operates as a facilitator to simplify customer writing and review navigation. We do not own Google Maps, nor can we guarantee specific local search rankings or prevent Google from removing reviews that violate its user content policies. Business owners are responsible for maintaining their own Google Business Profiles in accordance with Google Guidelines.
            </p>
          </section>

          {/* Section 8 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span className="text-blue-600">8.</span> Limitation of Liability
            </h2>
            <p>
              To the fullest extent permitted by law, Pixora Automations shall not be liable for any indirect, incidental, special, or consequential damages resulting from the use or inability to use the service, temporary network downtimes, or customer interactions at your establishment.
            </p>
          </section>

          {/* Section 9 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span className="text-blue-600">9.</span> Governing Law & Jurisdiction
            </h2>
            <p>
              These Terms of Service are governed by and construed in accordance with the laws of India. Any disputes arising out of or in connection with these terms shall be subject to the exclusive jurisdiction of the competent courts in Jaipur, Rajasthan, India.
            </p>
          </section>

          {/* Section 10: Contact */}
          <section className="space-y-3 pt-4 border-t border-slate-200">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span className="text-blue-600">10.</span> Contact & Support Inquiries
            </h2>
            <p>
              For subscription inquiries, trial activations, or support questions, please contact our team directly:
            </p>
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3">
              <div className="font-bold text-slate-900">Pixora Automations Support</div>
              <div className="text-xs sm:text-sm text-slate-600 space-y-1.5">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Direct Helpline & WhatsApp: <a href="tel:9257378047" className="text-blue-600 font-semibold hover:underline">+91 92573 78047</a></span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Support Email: <a href="mailto:support@pixoraautomations.com" className="text-blue-600 font-semibold hover:underline">support@pixoraautomations.com</a></span>
                </div>
                <div>Web Platform: <span className="font-mono text-slate-700">funnel.pixoraautomations.com</span></div>
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
