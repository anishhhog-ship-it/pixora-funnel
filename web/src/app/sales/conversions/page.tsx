'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { Prospect, SalesDemo, CommercialPlan, CustomerHandoverPackage } from '@/types/sales';
import {
  ArrowRightLeft,
  CheckCircle2,
  Copy,
  ExternalLink,
  Truck,
  MessageSquare,
  AlertCircle,
} from 'lucide-react';
import { createSalesIdempotencyKey, getPublicFunnelUrl } from '@/lib/salesClient';

type PaymentMethod = 'UPI' | 'Bank Transfer' | 'Cash';

export default function ConversionsWrapper() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Loading Conversions...</div>}>
      <ConversionsPage />
    </Suspense>
  );
}

const DEFAULT_COMMERCIAL_PLANS: CommercialPlan[] = [
  {
    id: 'plan_lifetime_launch',
    name: 'Founder Launch Lifetime Offer',
    slug: 'lifetime_launch_100',
    description: 'Exclusive launch offer for first 100 businesses. Lifetime Review Funnel software access with zero renewal fees.',
    price_paise: 259900,
    price_inr: 2599,
    billing_interval: 'lifetime',
    duration_years: 99,
    is_lifetime: true,
    includes_nfc: false,
    max_slots: 100,
    slots_used: 12,
    is_active: true,
    display_order: 1,
    features: ['Lifetime Review Funnel Software', 'Unlimited Google Reviews Routing', 'Smart AI Review Wizard', 'Custom QR Stand Asset', 'Zero Recurring Fees'],
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'plan_2year_software',
    name: 'Standard 2-Year Plan',
    slug: 'standard_2year_software',
    description: 'Full access for 2 full years to Pixora Review Funnel, smart routing, and QR assets.',
    price_paise: 259900,
    price_inr: 2599,
    billing_interval: '2_years',
    duration_years: 2,
    is_lifetime: false,
    includes_nfc: false,
    max_slots: null,
    slots_used: 0,
    is_active: true,
    display_order: 2,
    features: ['2-Year Full Software License', 'Unlimited Table & Counter Scans', 'AI Auto-Reply Generator', 'Dynamic Feedback Routing', 'Priority Support'],
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'plan_2year_nfc',
    name: 'Standard 2-Year Plan + NFC Delivery',
    slug: 'standard_2year_nfc',
    description: '2-Year Review Funnel access plus premium custom printed NFC Card & Stand delivered to doorstep.',
    price_paise: 299900,
    price_inr: 2999,
    billing_interval: '2_years',
    duration_years: 2,
    is_lifetime: false,
    includes_nfc: true,
    max_slots: null,
    slots_used: 0,
    is_active: true,
    display_order: 3,
    features: ['2-Year Full Software License', '1x Custom NFC Business Card', '1x Acrylic Table Display Stand', 'Doorstep Express Courier', 'Ready to Tap & Collect Reviews'],
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  },
];

function ConversionsPage() {
  const searchParams = useSearchParams();
  const initialProspectId = searchParams.get('prospectId') || '';
  const initialDemoId = searchParams.get('demoId') || '';

  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [demos, setDemos] = useState<SalesDemo[]>([]);
  const [plans, setPlans] = useState<CommercialPlan[]>(DEFAULT_COMMERCIAL_PLANS);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retryNonce, setRetryNonce] = useState(0);

  // Form State
  const [selectedProspectId, setSelectedProspectId] = useState(initialProspectId);
  const [selectedDemoId, setSelectedDemoId] = useState(initialDemoId);
  const [selectedPlanSlug, setSelectedPlanSlug] = useState('lifetime_launch_100');

  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPassword, setCustomerPassword] = useState('Client@1234');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [transactionReference, setTransactionReference] = useState('');

  // Business Address & Details (filled during onboarding by salesperson)
  const [businessAddress, setBusinessAddress] = useState('');
  const [city, setCity] = useState('');
  const state = 'Maharashtra';
  const [pincode, setPincode] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [handoverPackage, setHandoverPackage] = useState<CustomerHandoverPackage | null>(null);
  const [copiedMsg, setCopiedMsg] = useState(false);

  useEffect(() => {
    async function loadInitialData() {
      try {
        setLoadError(null);
        const { data: { session } } = await supabase.auth.getSession();
        const headers = { Authorization: session ? `Bearer ${session.access_token}` : '' };

        const [pRes, dRes, plRes] = await Promise.all([
          fetch('/api/sales/prospects', { headers }),
          fetch('/api/sales/demos', { headers }),
          fetch('/api/sales/plans', { headers }),
        ]);

        const [pData, dData, plData] = await Promise.all([
          pRes.json(),
          dRes.json(),
          plRes.json(),
        ]);

        if (pData.success) setProspects(pData.prospects || []);
        if (dData.success) setDemos(dData.demos || []);
        if (plData.success && Array.isArray(plData.plans) && plData.plans.length > 0) {
          setPlans(plData.plans.map((p: any) => ({
            ...p,
            price_inr: p.price_inr ?? (p.price_paise ? Math.round(p.price_paise / 100) : 2599),
          })));
        }
      } catch (e) {
        setLoadError(e instanceof Error ? e.message : 'Sales conversion data could not be loaded.');
      } finally {
        setLoading(false);
      }
    }
    loadInitialData();
  }, [retryNonce]);

  // Autofill prospect info
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (selectedProspectId) {
        const p = prospects.find((item) => item.id === selectedProspectId);
        if (p) {
          if (!customerName) setCustomerName(p.contact_name || p.business_name);
          if (!customerPhone && p.phone) setCustomerPhone(p.phone);
          if (p.address && !businessAddress) setBusinessAddress(p.address);
          if (p.city && !city) setCity(p.city);
          if (p.notes && !businessAddress && p.notes.includes('Address:')) setBusinessAddress(p.notes.split('Address:')[1].trim());
        }
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [selectedProspectId, prospects, customerName, customerPhone, businessAddress, city]);

  const selectedPlan = plans.find((p) => p.slug === selectedPlanSlug);
  const includesNfc = selectedPlan?.includes_nfc ?? false;

  const handleConvert = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!selectedProspectId) {
      setErrorMessage('Please select a prospect.');
      return;
    }
    if (!selectedPlan) {
      setErrorMessage('No available commercial plan is loaded. Retry the plans request before recording a sale.');
      return;
    }
    if (!customerEmail.trim() || !customerName.trim()) {
      setErrorMessage('Customer name and email are strictly required for account creation.');
      return;
    }
    if (paymentMethod !== 'Cash' && !transactionReference.trim()) {
      setErrorMessage('Please enter the UPI Reference / UTR Number for payment verification.');
      return;
    }
    if (includesNfc && (!businessAddress.trim() || !pincode.trim())) {
      setErrorMessage('This plan includes physical NFC hardware. Please provide complete business/shipping address and pincode.');
      return;
    }

    setSubmitting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const idempotencyKey = createSalesIdempotencyKey(selectedProspectId, selectedDemoId || null);

      const res = await fetch('/api/sales/convert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: session ? `Bearer ${session.access_token}` : '',
        },
        body: JSON.stringify({
          prospectId: selectedProspectId,
          demoId: selectedDemoId || null,
          planSlug: selectedPlanSlug,
          customerName,
          customerEmail,
          customerPassword: customerPassword.trim() || 'Client@1234',
          customerPhone: customerPhone.trim() || null,
          address: businessAddress.trim() || null,
          city: city.trim() || null,
          paymentMethod,
          transactionReference: transactionReference.trim() || null,
          shippingAddress: businessAddress.trim() || null,
          state: includesNfc ? state : null,
          pincode: includesNfc ? pincode : null,
          idempotencyKey,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        setErrorMessage(data.error || 'Conversion failed');
      } else {
       setHandoverPackage(data.handover || { ...data.order, activationStatus: 'pending_payment' });
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Conversion failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyWhatsApp = () => {
    if (handoverPackage?.whatsappMessageTemplate) {
      navigator.clipboard.writeText(handoverPackage.whatsappMessageTemplate);
      setCopiedMsg(true);
      setTimeout(() => setCopiedMsg(false), 2500);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#5356EC] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {loadError && <div className="flex items-center justify-between rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700"><span>{loadError}</span><button type="button" onClick={() => setRetryNonce((value) => value + 1)} className="min-h-11 rounded-xl border border-rose-200 bg-white px-3 font-bold">Retry</button></div>}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <ArrowRightLeft className="w-6 h-6 text-emerald-600" />
          <span>Demo-to-Customer Conversion & Handover</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Record the sale and directly activate the client plan. Instant customer dashboard credentials, live funnel, and QR code provisioned immediately.
        </p>
      </div>

      {handoverPackage ? (
        /* Handover Package Screen */
        <div className="bg-white border border-emerald-300 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm animate-in fade-in duration-300">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider">
                 {handoverPackage.activationStatus === 'active' ? 'DEAL CLOSED • ACCOUNT ACTIVATED' : 'PAYMENT RECEIPT RECORDED • VERIFICATION PENDING'}
              </span>
              <h2 className="text-xl font-bold text-slate-900">
                 {handoverPackage.activationStatus === 'active'
                   ? `${handoverPackage.businessName} is officially live.`
                   : `${handoverPackage.businessName} is not live yet.`}
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                 <span className="text-slate-500 font-semibold">{handoverPackage.activationStatus === 'active' ? 'Live Production Review Funnel' : 'Demo URL while payment is reviewed'}</span>
               <p className="font-mono text-[#5356EC] break-all font-bold">
                 {handoverPackage.publicFunnelUrl?.startsWith('http') ? handoverPackage.publicFunnelUrl : getPublicFunnelUrl(handoverPackage.businessSlug || handoverPackage.publicFunnelUrl?.replace('/f/', '') || '')}
               </p>
              <a
                href={handoverPackage.publicFunnelUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[11px] text-[#5356EC] hover:underline pt-1 font-semibold"
              >
                <span>Test Live Customer Experience</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2.5">
              <span className="text-slate-500 font-semibold">Customer Dashboard Login Credentials</span>
              <p className="font-mono text-emerald-600 font-bold">{handoverPackage.loginUrl}</p>
              <div className="space-y-1 pt-1">
                <p className="text-[11px] text-slate-700">
                  Email: <span className="text-slate-900 font-mono font-bold">{handoverPackage.customerEmail}</span>
                </p>
                {handoverPackage.initialPassword && (
                  <p className="text-[11px] text-slate-700">
                    Password: <span className="text-emerald-700 font-mono font-bold bg-white px-2 py-0.5 rounded border border-emerald-200">{handoverPackage.initialPassword}</span>
                  </p>
                )}
                <p className="text-[10px] text-slate-500 italic">
                  Client can change their password anytime in their dashboard profile section.
                </p>
              </div>
              {handoverPackage.activationStatus !== 'active' && <p className="text-[11px] font-semibold text-amber-700">The account, funnel and QR remain inactive until an admin or manager verifies the payment receipt.</p>}
            </div>
          </div>

          {/* WhatsApp Message Template */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-xs">WhatsApp Onboarding Message Template</h3>
              </div>
              <button
                type="button"
                onClick={handleCopyWhatsApp}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
              >
                {copiedMsg ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedMsg ? 'Copied to Clipboard!' : 'Copy Message'}</span>
              </button>
            </div>

            <pre className="bg-white p-4 rounded-xl text-xs text-slate-800 whitespace-pre-wrap font-sans border border-slate-200 leading-relaxed">
              {handoverPackage.whatsappMessageTemplate}
            </pre>
            <p className="text-[11px] text-slate-400">
              🔒 Privacy Guaranteed: Account setup instructions sent securely via invitation email. No customer password exposed.
            </p>
          </div>

          <div className="flex items-center justify-between pt-2">
            <Link
              href="/sales"
              className="text-xs text-slate-500 hover:text-slate-900 font-semibold"
            >
              ← Back to Sales Command
            </Link>
            <button
              onClick={() => {
                setHandoverPackage(null);
                setSelectedProspectId('');
                setSelectedDemoId('');
                setCustomerName('');
                setCustomerEmail('');
                setTransactionReference('');
              }}
              className="px-4 py-2 bg-[#5356EC] hover:bg-[#4346DB] text-white text-xs font-bold rounded-xl cursor-pointer"
            >
              Convert Another Deal
            </button>
          </div>
        </div>
      ) : (
        /* Conversion Form */
        <form onSubmit={handleConvert} className="space-y-6">
          {errorMessage && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* 1. Select Prospect & Demo */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 space-y-4 shadow-xs">
            <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider">
              1. Prospect &amp; Demo Linkage
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-700 font-semibold">Select Prospect *</label>
                <select
                  required
                  value={selectedProspectId}
                  onChange={(e) => setSelectedProspectId(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#5356EC] focus:border-[#5356EC]"
                >
                  <option value="">-- Choose Prospect --</option>
                  {prospects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.business_name} ({p.stage})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-slate-700 font-semibold">Associated Demo</label>
                  <span className="text-[10px] text-slate-400 font-medium">Optional (Auto-creates funnel if none)</span>
                </div>
                <select
                  value={selectedDemoId}
                  onChange={(e) => setSelectedDemoId(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#5356EC] focus:border-[#5356EC]"
                >
                  <option value="">-- Direct Onboarding (No Demo Required - Auto-Create Funnel) --</option>
                  {demos.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.business_name} ({d.slug})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* 2. Choose Commercial Plan */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider">
                2. Commercial Plan &amp; Offer Selection
              </h3>
              <span className="text-[11px] text-slate-500 font-medium">
                {plans.length} Packages Available
              </span>
            </div>

            {plans.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                Loading commercial plans...
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {plans.map((pl) => {
                  const isSelected = selectedPlanSlug === pl.slug;
                  const priceInr = pl.price_inr ?? (pl.price_paise ? Math.round(pl.price_paise / 100) : 2599);
                  return (
                    <div
                      key={pl.id || pl.slug}
                      onClick={() => setSelectedPlanSlug(pl.slug)}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between space-y-3 ${
                        isSelected
                          ? 'bg-indigo-50/70 border-[#5356EC] shadow-xs ring-1 ring-[#5356EC]'
                          : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 text-xs leading-snug">{pl.name}</span>
                          {pl.is_lifetime && (
                            <span className="px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold">
                              LIFETIME
                            </span>
                          )}
                          {pl.includes_nfc && (
                            <span className="px-1.5 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-bold">
                              + NFC CARD
                            </span>
                          )}
                        </div>
                        <div className="text-base font-bold text-slate-900">
                          ₹{priceInr.toLocaleString('en-IN')}
                        </div>
                        <p className="text-[11px] text-slate-500 leading-relaxed">{pl.description}</p>
                      </div>

                      <div className="text-[10px] text-[#5356EC] font-semibold pt-1 flex items-center justify-between">
                        <span>{isSelected ? '✓ Selected' : 'Click to Select'}</span>
                        <span className="text-[10px] text-slate-400">
                          {pl.is_lifetime ? 'No Renewals' : `${pl.duration_years || 2} Years`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 3. Customer & Payment Details */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 space-y-4 shadow-xs">
            <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider">
              3. Customer &amp; Payment Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-700 font-semibold">Customer Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Patel"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#5356EC] focus:border-[#5356EC]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 font-semibold">Account Login Email *</label>
                <input
                  type="email"
                  required
                  placeholder="ramesh@business.com"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#5356EC] focus:border-[#5356EC]"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-slate-700 font-semibold">Client Initial Password *</label>
                  <button
                    type="button"
                    onClick={() => {
                      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$';
                      let pass = 'Px!';
                      for (let i = 0; i < 6; i++) pass += chars.charAt(Math.floor(Math.random() * chars.length));
                      setCustomerPassword(pass);
                    }}
                    className="text-[10px] font-bold text-[#5356EC] hover:underline cursor-pointer"
                  >
                    Generate
                  </button>
                </div>
                <input
                  type="text"
                  required
                  placeholder="e.g. Client@1234"
                  value={customerPassword}
                  onChange={(e) => setCustomerPassword(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900 font-mono placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#5356EC] focus:border-[#5356EC]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 font-semibold">Mobile / Phone Number</label>
                <input
                  type="tel"
                  placeholder="9876543210"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#5356EC] focus:border-[#5356EC]"
                />
              </div>
            </div>

            {/* Business Address & Location (Shown on customer funnel) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs pt-1">
              <div className="sm:col-span-2 space-y-1">
                <label className="text-slate-700 font-semibold flex items-center justify-between">
                  <span>Business Address</span>
                  <span className="text-[10px] text-slate-400 font-normal">Shows on customer funnel</span>
                </label>
                <input
                  type="text"
                  placeholder="Shop/Office number, street, landmark"
                  value={businessAddress}
                  onChange={(e) => setBusinessAddress(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#5356EC] focus:border-[#5356EC]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 font-semibold">City / Area</label>
                <input
                  type="text"
                  placeholder="e.g. Mumbai, Bandra West"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#5356EC] focus:border-[#5356EC]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
              <div className="space-y-1">
                <label className="text-slate-700 font-semibold">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => {
                    const method = e.target.value as PaymentMethod;
                    setPaymentMethod(method);
                    if (method === 'Cash') {
                      setTransactionReference('');
                    }
                  }}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#5356EC] focus:border-[#5356EC]"
                >
                  <option value="UPI">UPI (GooglePay / PhonePe / Paytm)</option>
                  <option value="Bank Transfer">Bank Transfer / IMPS / NEFT</option>
                  <option value="Cash">Cash Collected</option>
                </select>
              </div>

              {paymentMethod === 'Cash' ? (
                <div className="space-y-1">
                  <label className="text-slate-700 font-semibold">Payment Verification</label>
                  <div className="w-full bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 text-emerald-800 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span className="font-semibold text-[11px]">
                      Cash collected by salesperson • No UTR required • Plan activates directly
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="text-slate-700 font-semibold">UPI Reference / UTR Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="12-digit UTR (e.g. 428190382910)"
                    value={transactionReference}
                    onChange={(e) => setTransactionReference(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#5356EC] focus:border-[#5356EC]"
                  />
                </div>
              )}
            </div>

            {/* NFC Shipping Address if plan includes NFC */}
            {includesNfc && (
              <div className="pt-3 border-t border-slate-100 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-700">
                  <Truck className="w-4 h-4 text-amber-600" />
                  <span>Physical NFC Card Courier Shipping Details</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-slate-700 font-semibold">Delivery Address *</label>
                    <input
                      type="text"
                      required
                      placeholder="Shop/Office number, street, landmark"
                      value={businessAddress}
                      onChange={(e) => setBusinessAddress(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#5356EC] focus:border-[#5356EC]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-700 font-semibold">Pincode *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 400050"
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#5356EC] focus:border-[#5356EC]"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting || !selectedPlan}
            className="w-full py-4 rounded-xl bg-[#5356EC] hover:bg-[#4346DB] text-white font-bold text-sm shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
            <span>
              {submitting
                ? 'Activating client plan directly…'
                : selectedPlan
                ? `Activate Client Plan Directly (₹${selectedPlan.price_inr.toLocaleString('en-IN')})`
                : 'Select an available plan'}
            </span>
          </button>
        </form>
      )}
    </div>
  );
}
