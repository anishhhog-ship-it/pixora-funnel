import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Apple,
  ArrowRight,
  Check,
  CheckCircle2,
  Download,
  ExternalLink,
  Globe2,
  PackageCheck,
  ShieldCheck,
  Smartphone,
  Sparkles,
} from 'lucide-react';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import { MOBILE_DOWNLOAD_CONFIG } from '@/config/mobileDownload';

const BASE_URL = 'https://funnel.pixoraautomations.com';

export const metadata: Metadata = {
  title: 'Download Pixora Funnel',
  description:
    'Download the Pixora Funnel mobile app for Android or iPhone, or use the web app to manage your review funnel from any device.',
  alternates: {
    canonical: `${BASE_URL}/download`,
  },
  openGraph: {
    title: 'Download Pixora Funnel for Android and iPhone',
    description:
      'Keep your customer feedback, review funnel, and business workspace close at hand with Pixora Funnel.',
    url: `${BASE_URL}/download`,
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Pixora Funnel mobile app download page',
      },
    ],
  },
};

function StoreButton({
  href,
  label,
}: {
  href: string | null;
  label: string;
}) {
  if (!href) {
    return (
      <div
        aria-disabled="true"
        className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 text-sm font-semibold text-slate-500"
      >
        <Download className="h-4 w-4" aria-hidden="true" />
        <span>Coming soon</span>
      </div>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="public-focus-ring flex min-h-12 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(15,23,42,0.16)] transition-all hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-lg"
    >
      <Download className="h-4 w-4" aria-hidden="true" />
      <span>{label}</span>
      <ExternalLink className="h-3.5 w-3.5 text-white/70" aria-hidden="true" />
    </a>
  );
}

function StatusRow({
  label,
  value,
  positive = true,
}: {
  label: string;
  value: string;
  positive?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-t border-slate-100 py-3 text-xs">
      <span className="text-slate-500">{label}</span>
      <span className={`text-right font-semibold ${positive ? 'text-slate-700' : 'text-amber-700'}`}>
        {value}
      </span>
    </div>
  );
}

export default function DownloadPage() {
  const { android, ios, version } = MOBILE_DOWNLOAD_CONFIG;
  const androidAvailable = Boolean(android.url);
  const iosAvailable = Boolean(ios.url);

  return (
    <div className="min-h-screen bg-[#fbfcff] text-slate-900 antialiased">
      <Navbar />

      <main>
        <section className="relative isolate overflow-hidden border-b border-slate-100 bg-white px-4 pb-16 pt-12 sm:px-6 sm:pb-20 lg:px-8 lg:pb-24 lg:pt-20">
          <div className="landing-grid pointer-events-none absolute inset-0 -z-10" aria-hidden="true" />
          <div className="pointer-events-none absolute -right-32 -top-32 -z-10 h-[28rem] w-[28rem] rounded-full bg-blue-100/70 blur-3xl" aria-hidden="true" />
          <div className="pointer-events-none absolute -bottom-48 left-1/4 -z-10 h-96 w-96 rounded-full bg-emerald-100/60 blur-3xl" aria-hidden="true" />

          <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20">
            <div className="max-w-2xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-200/80 bg-blue-50/80 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-blue-700">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                Pixora Funnel mobile
              </div>

              <h1 className="max-w-xl text-4xl font-extrabold leading-[1.04] tracking-[-0.045em] text-slate-950 sm:text-5xl lg:text-[4.25rem]">
                Your customer experience,{' '}
                <span className="bg-gradient-to-r from-blue-700 via-indigo-600 to-emerald-600 bg-clip-text text-transparent">
                  always within reach.
                </span>
              </h1>

              <p className="mt-6 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg">
                Keep an eye on reviews, feedback, funnel activity, and your business workspace wherever the day takes you. The customer journey stays simple; your owner tools stay close.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <a
                  href="#downloads"
                  className="public-focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-slate-950 px-6 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(15,23,42,0.18)] transition-all hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-lg sm:text-base"
                >
                  <Download className="h-4 w-4" aria-hidden="true" />
                  See download options
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </a>
                <Link
                  href="/login"
                  className="public-focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 text-sm font-semibold text-slate-800 shadow-sm transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 sm:text-base"
                >
                  Use the web app
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>

              <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-slate-500">
                <span className="inline-flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-emerald-600" strokeWidth={3} aria-hidden="true" />
                  Built for business owners
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-emerald-600" strokeWidth={3} aria-hidden="true" />
                  Customer-facing flow stays app-free
                </span>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-md lg:mr-0">
              <div className="absolute -inset-6 rounded-[2.5rem] bg-gradient-to-br from-blue-100/90 via-indigo-50/70 to-emerald-100/80 blur-2xl" aria-hidden="true" />
              <div className="relative overflow-hidden rounded-[2rem] border border-white/80 bg-slate-950 p-3 shadow-[0_30px_80px_rgba(30,64,175,0.2)]">
                <div className="overflow-hidden rounded-[1.5rem] bg-white">
                  <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
                        <Smartphone className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <div>
                        <div className="text-xs font-bold text-slate-900">Pixora Funnel</div>
                        <div className="text-[10px] text-slate-400">Owner workspace</div>
                      </div>
                    </div>
                    <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700">Live view</span>
                  </div>

                  <div className="space-y-3 bg-slate-50 p-5">
                    <div className="rounded-2xl bg-gradient-to-br from-slate-950 via-blue-950 to-blue-800 p-5 text-white shadow-lg">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-blue-200">Today at a glance</p>
                          <p className="mt-2 text-3xl font-extrabold tracking-tight">Your next review</p>
                          <p className="mt-1 text-xs text-blue-100/75">Make every visit easier to follow up on.</p>
                        </div>
                        <ShieldCheck className="h-7 w-7 text-emerald-300" aria-hidden="true" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">Feedback</p>
                        <p className="mt-2 text-2xl font-extrabold text-slate-900">Ready</p>
                        <p className="mt-1 text-[10px] text-emerald-600">Private path available</p>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">Funnel</p>
                        <p className="mt-2 text-2xl font-extrabold text-slate-900">Live</p>
                        <p className="mt-1 text-[10px] text-blue-600">QR + NFC ready</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                        <PackageCheck className="h-4.5 w-4.5" aria-hidden="true" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800">One focused owner view</p>
                        <p className="mt-0.5 text-[11px] text-slate-500">Review activity and follow-up in one place.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="downloads" className="scroll-mt-24 bg-[#fbfcff] px-4 py-16 sm:px-6 md:py-24 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-600">
                <Globe2 className="h-3.5 w-3.5 text-blue-600" aria-hidden="true" />
                Choose your platform
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">Download the owner app</h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">
                The app is for business owners and teams. Customers do not need to install anything to use your QR or NFC funnel.
              </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <article className="group relative overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_12px_40px_rgba(15,23,42,0.06)] transition-shadow hover:shadow-[0_20px_52px_rgba(15,23,42,0.1)] sm:p-8">
                <div className="absolute right-0 top-0 h-36 w-36 rounded-full bg-emerald-50 blur-2xl" aria-hidden="true" />
                <div className="relative">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                        <Smartphone className="h-6 w-6" aria-hidden="true" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-slate-950">Android</h3>
                        <p className="text-xs text-slate-500">Google Play or direct package</p>
                      </div>
                    </div>
                    <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${androidAvailable ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>
                      {androidAvailable ? 'Available' : 'Coming soon'}
                    </span>
                  </div>

                  <p className="relative mt-6 min-h-12 text-sm leading-relaxed text-slate-600">
                    Manage review activity, customer feedback, and your live funnel from an Android phone.
                  </p>

                  <div className="relative mt-6 space-y-0 rounded-2xl border border-slate-100 bg-slate-50 px-4">
                    <StatusRow label="Package ID" value={android.packageId} />
                    <StatusRow label="App version" value={version} />
                    <StatusRow
                      label="Release link"
                      value={androidAvailable ? 'Configured' : 'Not configured'}
                      positive={androidAvailable}
                    />
                  </div>

                  <div className="relative mt-6">
                    <StoreButton href={android.url} label="Download for Android" />
                    {!androidAvailable && (
                      <p className="mt-3 text-center text-xs leading-relaxed text-slate-500">
                        The Android package is configured, but its public release URL has not been published yet.{' '}
                        <Link href="/login" className="font-semibold text-blue-700 hover:text-blue-800 hover:underline">Use the web app for now</Link>.
                      </p>
                    )}
                  </div>
                </div>
              </article>

              <article className="group relative overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_12px_40px_rgba(15,23,42,0.06)] transition-shadow hover:shadow-[0_20px_52px_rgba(15,23,42,0.1)] sm:p-8">
                <div className="absolute right-0 top-0 h-36 w-36 rounded-full bg-blue-50 blur-2xl" aria-hidden="true" />
                <div className="relative">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-800">
                        <Apple className="h-6 w-6" aria-hidden="true" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-slate-950">iPhone & iPad</h3>
                        <p className="text-xs text-slate-500">Apple App Store</p>
                      </div>
                    </div>
                    <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${iosAvailable ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>
                      {iosAvailable ? 'Available' : 'Coming soon'}
                    </span>
                  </div>

                  <p className="relative mt-6 min-h-12 text-sm leading-relaxed text-slate-600">
                    Keep your Pixora workspace handy on iPhone or iPad with a native iOS experience built for quick owner check-ins.
                  </p>

                  <div className="relative mt-6 space-y-0 rounded-2xl border border-slate-100 bg-slate-50 px-4">
                    <StatusRow label="Bundle ID" value={ios.bundleId} />
                    <StatusRow label="App version" value={version} />
                    <StatusRow
                      label="Store link"
                      value={iosAvailable ? 'Configured' : 'Not configured'}
                      positive={iosAvailable}
                    />
                  </div>

                  <div className="relative mt-6">
                    <StoreButton href={ios.url} label="View on the App Store" />
                    {!iosAvailable && (
                      <p className="mt-3 text-center text-xs leading-relaxed text-slate-500">
                        The iOS bundle is configured, but its public App Store URL has not been published yet.{' '}
                        <Link href="/login" className="font-semibold text-blue-700 hover:text-blue-800 hover:underline">Use the web app for now</Link>.
                      </p>
                    )}
                  </div>
                </div>
              </article>
            </div>

            <div className="mx-auto mt-8 flex max-w-3xl flex-col items-center justify-between gap-4 rounded-2xl border border-blue-100 bg-blue-50/70 px-5 py-4 text-center sm:flex-row sm:text-left">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" aria-hidden="true" />
                <div>
                  <p className="text-sm font-bold text-slate-900">No app download needed for your customers</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-slate-600">Your public QR and NFC review experience works in a mobile browser.</p>
                </div>
              </div>
              <Link href="/" className="public-focus-ring inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold text-blue-700 transition-colors hover:bg-white hover:text-blue-800">
                Explore the web experience
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>

        <section className="border-y border-slate-800 bg-slate-950 px-4 py-16 text-white sm:px-6 md:py-20 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-300">Made for the moments between service</p>
              <h2 className="mt-3 max-w-xl text-3xl font-extrabold tracking-tight sm:text-4xl">Everything your team needs, without adding friction.</h2>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-slate-300 sm:text-base">
                Pixora keeps the guest journey lightweight while giving owners a clear place to understand feedback, protect relationships, and keep the next action moving.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { icon: ShieldCheck, title: 'Private feedback', text: 'See what needs attention before it becomes a public problem.' },
                { icon: Smartphone, title: 'Quick check-ins', text: 'Open your workspace from a phone when the floor is busy.' },
                { icon: Globe2, title: 'Web ready', text: 'Your customer-facing funnel works on any modern phone.' },
              ].map(({ icon: Icon, title, text }) => (
                <div key={title} className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
                  <Icon className="h-5 w-5 text-blue-300" aria-hidden="true" />
                  <h3 className="mt-4 text-sm font-bold text-white">{title}</h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-400">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
