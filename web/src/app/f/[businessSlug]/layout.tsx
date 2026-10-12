import { businessService, getFunnelBackground } from '@/services';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import Image from 'next/image';
import { Lock, AlertTriangle, ArrowRight, PhoneCall, Sparkles } from 'lucide-react';

// Luxury Lotus Floral SVG Mark (matches reference screenshot)
function LotusBrandIcon({ className = "w-10 h-10", fill = "#D4AF37" }: { className?: string; fill?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M50 14 C44 32 40 54 50 78 C60 54 56 32 50 14 Z" stroke={fill} strokeWidth="3.2" fill={fill} fillOpacity="0.15" strokeLinecap="round" />
      <path d="M50 78 C36 60 28 42 36 24 C44 34 48 55 50 78 Z" stroke={fill} strokeWidth="3.2" fill={fill} fillOpacity="0.15" strokeLinecap="round" />
      <path d="M50 78 C64 60 72 42 64 24 C56 34 52 55 50 78 Z" stroke={fill} strokeWidth="3.2" fill={fill} fillOpacity="0.15" strokeLinecap="round" />
      <path d="M50 78 C24 68 16 50 22 36 C30 44 44 64 50 78 Z" stroke={fill} strokeWidth="3.2" fill={fill} fillOpacity="0.15" strokeLinecap="round" />
      <path d="M50 78 C76 68 84 50 78 36 C70 44 56 64 50 78 Z" stroke={fill} strokeWidth="3.2" fill={fill} fillOpacity="0.15" strokeLinecap="round" />
    </svg>
  );
}

export default async function FunnelLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ businessSlug: string }>;
}) {
  const { businessSlug } = await params;
  const business = await businessService.getBusinessBySlug(businessSlug);
  if (!business) {
    notFound();
  }

  // Check if trial has ended (demo time hit zero) and business is not on an active paid plan
  // In local development / preview on localhost, always allow live preview
  let isLocal = process.env.NODE_ENV !== 'production';
  try {
    const headerList = await headers();
    const host = headerList.get('host') || '';
    if (host.includes('localhost') || host.includes('127.0.0.1')) {
      isLocal = true;
    }
  } catch (e) {}

  const isExpired = !isLocal && (
    business.planStatus === 'expired' ||
    (business.trialExpiresAt &&
      new Date(business.trialExpiresAt).getTime() <= Date.now() &&
      business.planStatus !== 'active')
  );

  // Resolve background & theme via centralized category engine
  const { desktop, mobile, overlay, categoryConfig } = getFunnelBackground(business);
  const primaryColor = business.theme?.primaryColor || categoryConfig.defaultPrimaryColor || '#0B3D2E';
  const secondaryColor = business.theme?.secondaryColor || categoryConfig.defaultSecondaryColor || '#D4AF37';
  const tagline = business.theme?.tagline || categoryConfig.subheadline || 'GOOD FOOD • GREAT COMPANY • BRIGHTER DAYS';
  const hasCustomLogo = business.theme?.logo && business.theme.logo !== '/placeholder.png';
  const logoUrl = business.theme?.logo || business.logo;

  return (
    <div className="min-h-screen flex flex-col relative text-gray-900 overflow-x-hidden font-sans select-none">
      
      {/* ── Full Bleed Background Ambience (Responsive Desktop & Mobile) ── */}
      <div className="fixed inset-0 w-full h-full z-0 pointer-events-none">
        {/* Desktop Image */}
        <div className="hidden sm:block absolute inset-0 w-full h-full">
          <Image 
            src={desktop} 
            alt={`${business.name} Background`} 
            fill 
            unoptimized
            priority
            className="object-cover object-center"
          />
        </div>
        {/* Mobile Image */}
        <div className="sm:hidden absolute inset-0 w-full h-full">
          <Image 
            src={mobile} 
            alt={`${business.name} Mobile Background`} 
            fill 
            unoptimized
            priority
            className="object-cover object-center"
          />
        </div>

        {/* Dynamic Category Vignette & Contrast Overlay */}
        <div 
          className="absolute inset-0 backdrop-blur-[0.5px]"
          style={{
            background: overlay.gradient || `rgba(0, 0, 0, ${overlay.opacity || 0.65})`,
          }}
        />
      </div>

      {/* ── Top Floating Language Selector ── */}
      <div className="relative z-20 w-full max-w-md mx-auto px-4 pt-3 flex justify-end">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 hover:bg-black/60 border border-white/20 text-white text-xs font-medium backdrop-blur-md transition shadow-xs cursor-pointer">
          <svg className="w-3.5 h-3.5 opacity-80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
          <span>English</span>
          <svg className="w-3 h-3 opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </div>
      </div>

      {/* ── Main Content Container ── */}
      <div className="relative z-10 flex-grow flex flex-col pt-2 pb-6 px-4 max-w-md mx-auto w-full">
        
        {/* Brand Header */}
        <header className="flex flex-col items-center mb-6 text-white text-center">
          {hasCustomLogo && logoUrl ? (
            <div className="w-14 h-14 relative mb-2 rounded-2xl overflow-hidden shadow-lg border border-white/20 bg-white/10 backdrop-blur-md">
              <Image 
                src={logoUrl} 
                alt={`${business.name} Logo`} 
                fill 
                unoptimized
                className="object-cover" 
              />
            </div>
          ) : (
            <div className="mb-1 flex items-center justify-center">
              <LotusBrandIcon className="w-12 h-12" fill={secondaryColor} />
            </div>
          )}

          <h1 
            className="text-3xl sm:text-4xl font-serif font-bold tracking-tight mb-0.5 text-[#F7F2E7]"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            {business.name}
          </h1>

          <p className="text-[11px] tracking-[0.24em] uppercase font-medium text-[#E5C278] opacity-90">
            {business.category}
          </p>

          {tagline && (
            <div className="flex items-center justify-center gap-2 mt-2.5 text-[10px] tracking-[0.2em] uppercase text-white/75 font-normal">
              <span>{tagline}</span>
            </div>
          )}
        </header>

        {/* Page Body */}
        <main className="flex-grow flex flex-col justify-center">
          {isExpired ? (
            <div className="w-full max-w-sm mx-auto my-auto p-6 sm:p-7 rounded-[32px] bg-white/95 backdrop-blur-md shadow-2xl border border-rose-200 text-slate-900 text-center animate-in zoom-in-95 duration-300">
              {/* Lock Badge Icon */}
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-tr from-rose-500 to-rose-600 text-white flex items-center justify-center shadow-lg shadow-rose-500/25">
                <Lock className="w-8 h-8" />
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold uppercase tracking-wider mb-2.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Scanner Inactive</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold font-serif text-slate-900 tracking-tight leading-tight">
                Free Trial Has Ended
              </h2>

              <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                The free trial for <strong>{business.name}</strong> review funnel has concluded and this scanner has been taken down.
              </p>

              {/* Requirement Box */}
              <div className="my-5 p-3.5 bg-amber-50 rounded-2xl border border-amber-200/90 text-left text-xs text-amber-950 space-y-1.5">
                <p className="font-bold flex items-center gap-1.5 text-amber-900">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>How to Unlock Your Funnel:</span>
                </p>
                <p className="text-[12px] text-amber-800 leading-relaxed">
                  Activate an active 1-year plan to re-activate your customer review system and turn on AI Auto Reply:
                </p>
                <div className="pt-1 space-y-1 text-[11px] text-slate-700 font-medium">
                  <div>• <strong>₹2,599:</strong> 1-Year Plan (Without NFC Card)</div>
                  <div>• <strong>₹2,999:</strong> Lifetime Free Access (First 100 Accounts Offer + NFC Smart Review Card)</div>
                </div>
              </div>

              {/* Purchase & Unlock Buttons Redirecting to 9257378047 */}
              <div className="space-y-2 pt-1">
                <a
                  href={`https://wa.me/919257378047?text=${encodeURIComponent(
                    `Hi! The free trial for ${business.name} has ended. I want to claim the ₹2,999 Lifetime Free Access Plan (First 100 Accounts Offer with NFC Review Card) to unlock our scanner.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Unlock Lifetime + NFC Card (₹2,999)</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>

                <a
                  href={`https://wa.me/919257378047?text=${encodeURIComponent(
                    `Hi! The free trial for ${business.name} has ended. I want to activate the ₹2,599 1-Year Plan (Without NFC Card) to unlock our scanner.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <span>Unlock 1-Year Plan without NFC (₹2,599)</span>
                </a>

                <a
                  href={`https://wa.me/919257378047?text=${encodeURIComponent(
                    `Hi Admin! Please unlock the QR review scanner for ${business.name}.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <PhoneCall className="w-3.5 h-3.5 text-slate-600" />
                  <span>Request Admin to Unlock (+91 92573 78047)</span>
                </a>

                <a
                  href="tel:9257378047"
                  className="block text-center text-[11px] text-slate-500 hover:text-slate-900 font-medium pt-1"
                >
                  Direct Call: +91 92573 78047
                </a>
              </div>
            </div>
          ) : (
            children
          )}
        </main>
      </div>

      {/* ── Global Wave Footer ── */}
      <footer className="relative z-10 w-full text-center py-5 mt-auto overflow-hidden">
        <div 
          className="w-full h-16 absolute bottom-0 -z-10 rounded-t-[100%] scale-150 transform translate-y-7 shadow-2xl border-t border-[#D4AF37]/30"
          style={{ backgroundColor: primaryColor }}
        ></div>
        <div className="relative z-20 flex items-center justify-center gap-2">
          <span className="text-[11px] sm:text-xs text-white/80 font-medium">Powered by</span>
          <Image
            src="/pixora-logo-white.png"
            alt="Pixora Automations"
            width={140}
            height={36}
            className="h-6 sm:h-7 w-auto object-contain inline-block opacity-95"
          />
          <span className="text-rose-400 text-xs">❤️</span>
        </div>
      </footer>
    </div>
  );
}
