'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import {
  Users,
  Search,
  ExternalLink,
  Store,
  Phone,
  Mail,
  ShieldCheck,
  Calendar,
  Sparkles,
  Key,
  Copy,
  Check,
  Lock,
  RefreshCw,
  X,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';

interface CustomerBusiness {
  id: string;
  name: string;
  slug: string;
  phone?: string;
  email?: string;
  category?: string;
  status: string;
  created_at: string;
  plan_status?: string;
  trial_expires_at?: string;
}

export default function ConvertedCustomersPage() {
  const [customers, setCustomers] = useState<CustomerBusiness[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Credentials Modal State
  const [credentialsModalOpen, setCredentialsModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerBusiness | null>(null);
  const [credEmail, setCredEmail] = useState('');
  const [credPassword, setCredPassword] = useState('');
  const [credFullName, setCredFullName] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatedCreds, setGeneratedCreds] = useState<{
    email: string;
    password: string;
    loginUrl: string;
    businessSlug: string;
  } | null>(null);
  const [credError, setCredError] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState(false);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/sales/customers', {
        headers: { Authorization: session ? `Bearer ${session.access_token}` : '' },
      });
      const data = await res.json();
      if (data.success) {
        setCustomers(data.customers || []);
      }
    } catch (e) {
      console.warn('Fetch customers error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const openCredentialsModal = (cust: CustomerBusiness) => {
    setSelectedCustomer(cust);
    setCredEmail(cust.email || '');
    setCredFullName(cust.name || 'Business Owner');
    setCredPassword('Client@2026');
    setGeneratedCreds(null);
    setCredError(null);
    setCredentialsModalOpen(true);
  };

  const handleGenerateCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    setGenerating(true);
    setCredError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/sales/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: session ? `Bearer ${session.access_token}` : '',
        },
        body: JSON.stringify({
          email: credEmail.trim(),
          password: credPassword.trim(),
          fullName: credFullName.trim() || selectedCustomer.name,
          businessId: selectedCustomer.id,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        setCredError(data.error || 'Failed to generate client credentials');
      } else {
        setGeneratedCreds({
          email: data.credentials.email,
          password: data.credentials.password,
          loginUrl: data.credentials.loginUrl,
          businessSlug: selectedCustomer.slug,
        });
      }
    } catch (err: any) {
      setCredError(err?.message || 'Network error occurred while provisioning credentials');
    } finally {
      setGenerating(false);
    }
  };

  const copyWhatsAppHandover = () => {
    if (!generatedCreds || !selectedCustomer) return;
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://funnel.pixoraautomations.com';
    const text = `🎉 *Your Pixora Review Dashboard is Active!*

Hello ${credFullName || selectedCustomer.name}, your business review system has been set up successfully.

🌐 *Client Dashboard:* ${generatedCreds.loginUrl || `${origin}/login`}
📧 *Login Email:* ${generatedCreds.email}
🔑 *Password:* ${generatedCreds.password}

⭐ *Live Customer Review Funnel:* ${origin}/f/${selectedCustomer.slug}

*What you can do in your Dashboard:*
1. Monitor live customer review ratings & analytics.
2. Download your store's high-resolution QR code stand.
3. Update your business details or change your password anytime in Profile Settings!

Let us know if you need any assistance!`;

    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 3000);
  };

  const filtered = customers.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      (c.category && c.category.toLowerCase().includes(q)) ||
      (c.email && c.email.toLowerCase().includes(q)) ||
      (c.phone && c.phone.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-[#5356EC]" />
            <span>Converted Paying Customers</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Directory of all live business accounts, client dashboard logins, and review funnel links.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search business, owner, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#5356EC] focus:border-[#5356EC]"
          />
        </div>
      </div>

      {loading ? (
        <div className="py-24 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-[#5356EC] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-12 text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 bg-indigo-50 text-[#5356EC] rounded-2xl flex items-center justify-center mx-auto">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900 text-base">
            {search ? 'No matching customers found' : 'No paying customers onboarded yet'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {search
              ? 'Try searching by a different name or email.'
              : 'Close deals from your leads list to activate production review funnels and onboard clients.'}
          </p>
          <Link
            href="/sales/conversions"
            className="px-4 py-2 bg-[#5356EC] hover:bg-[#4346DB] text-white font-bold text-xs rounded-xl shadow-xs inline-flex items-center gap-2 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Go to Conversions</span>
          </Link>
        </div>
      ) : (
        <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase tracking-wider text-[11px] font-semibold">
                <tr>
                  <th className="py-3 px-4">Business Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Contact Details</th>
                  <th className="py-3 px-4">Live Review Funnel</th>
                  <th className="py-3 px-4">Account Status</th>
                  <th className="py-3 px-4 text-right">Dashboard Access</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-indigo-50 text-[#5356EC] flex items-center justify-center font-bold text-xs">
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p>{c.name}</p>
                          <p className="text-[10px] text-slate-400 font-normal">Slug: {c.slug}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 font-medium">
                      {c.category || 'Retail / Services'}
                    </td>

                    <td className="py-3.5 px-4 text-slate-600">
                      {c.email && (
                        <p className="flex items-center gap-1.5 font-medium">
                          <Mail className="w-3 h-3 text-slate-400" /> {c.email}
                        </p>
                      )}
                      {c.phone && (
                        <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400" /> {c.phone}
                        </p>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <a
                        href={`/f/${c.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#5356EC] hover:underline"
                      >
                        <span>/f/{c.slug}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">
                        {c.status ? c.status.toUpperCase() : 'ACTIVE'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => openCredentialsModal(c)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-[#5356EC] font-bold text-xs rounded-xl border border-indigo-200 transition-colors cursor-pointer shadow-2xs"
                      >
                        <Key className="w-3.5 h-3.5" />
                        <span>Client Login Access</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Client Credentials Modal ── */}
      {credentialsModalOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#5356EC] bg-indigo-50 px-2 py-0.5 rounded-full">
                  Client Dashboard Access
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">
                  {selectedCustomer.name}
                </h3>
                <p className="text-xs text-slate-500">
                  Generate or reset email &amp; password for client portal login.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCredentialsModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Generated Credentials Success Box */}
            {generatedCreds ? (
              <div className="space-y-4">
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-emerald-950 space-y-3">
                  <div className="flex items-center gap-2 font-bold text-xs text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Dashboard Account Provisioned Successfully!</span>
                  </div>

                  <div className="space-y-1.5 text-xs bg-white p-3 rounded-xl border border-emerald-100">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Login URL:</span>
                      <a href="/login" target="_blank" className="font-semibold text-[#5356EC] hover:underline">
                        /login
                      </a>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Email:</span>
                      <span className="font-mono font-bold text-slate-900">{generatedCreds.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Password:</span>
                      <span className="font-mono font-bold text-slate-900">{generatedCreds.password}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Live Funnel:</span>
                      <a href={`/f/${selectedCustomer.slug}`} target="_blank" className="font-semibold text-emerald-700 hover:underline">
                        /f/{selectedCustomer.slug}
                      </a>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={copyWhatsAppHandover}
                    className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    {copiedText ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Copied WhatsApp Message!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>📲 Copy WhatsApp Message for Client</span>
                      </>
                    )}
                  </button>

                  <div className="flex gap-2">
                    <a
                      href="/login"
                      target="_blank"
                      className="flex-1 py-2 px-3 border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl text-center transition-colors"
                    >
                      Open Client Login
                    </a>
                    <button
                      type="button"
                      onClick={() => setGeneratedCreds(null)}
                      className="flex-1 py-2 px-3 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
                    >
                      Reset Password Again
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Generation Form */
              <form onSubmit={handleGenerateCredentials} className="space-y-4">
                {credError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{credError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Client Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={credEmail}
                    onChange={(e) => setCredEmail(e.target.value)}
                    placeholder="client@business.com"
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#5356EC] focus:bg-white text-slate-900"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">This email will be used by the client to sign in to their dashboard.</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Client Full Name
                  </label>
                  <input
                    type="text"
                    value={credFullName}
                    onChange={(e) => setCredFullName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#5356EC] focus:bg-white text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Initial Password *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={credPassword}
                      onChange={(e) => setCredPassword(e.target.value)}
                      placeholder="Enter minimum 6 characters"
                      className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#5356EC] focus:bg-white"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">The client can change this password anytime in their dashboard profile.</p>
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setCredentialsModalOpen(false)}
                    className="flex-1 py-2.5 px-4 border border-slate-200 text-slate-600 font-semibold text-xs rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={generating || !credEmail || !credPassword}
                    className="flex-1 py-2.5 px-4 bg-[#5356EC] hover:bg-[#4346DB] text-white font-bold text-xs rounded-xl shadow-md transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {generating ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Provisioning...</span>
                      </>
                    ) : (
                      <>
                        <Key className="w-3.5 h-3.5" />
                        <span>Generate &amp; Activate</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
