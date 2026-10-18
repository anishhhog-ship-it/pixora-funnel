'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { SalesDemo } from '@/types/sales';
import SalesQrActions from '@/components/sales/SalesQrActions';
import {
  Layers,
  Sparkles,
  ExternalLink,
  Copy,
  CheckCircle2,
  QrCode,
  ArrowRight,
  Eye,
  Calendar,
  X,
  Search,
} from 'lucide-react';

export default function MyDemosPage() {
  const [demos, setDemos] = useState<SalesDemo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [qrModalDemo, setQrModalDemo] = useState<SalesDemo | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchDemos = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/sales/demos', {
        headers: { Authorization: session ? `Bearer ${session.access_token}` : '' },
      });
      const data = await res.json();
      if (data.success) {
        setDemos(data.demos || []);
      } else setError(data.error || 'Demos could not be loaded.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Demos could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch synchronizes this client-only list with the API.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchDemos();
  }, []);

  const handleCopy = (slug: string) => {
    const url = `${window.location.origin}/f/${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  const filteredDemos = demos.filter((d) => {
    const q = search.toLowerCase();
    return (
      d.business_name.toLowerCase().includes(q) ||
      d.category.toLowerCase().includes(q) ||
      d.slug.toLowerCase().includes(q)
    );
  });

  const isDemoExpired = (demo: SalesDemo) => Boolean(demo.is_expired);
  const isDemoRevoked = (demo: SalesDemo) => demo.status === 'revoked';
  const isDemoInvalid = (demo: SalesDemo) => !['active', 'shared', 'converted'].includes(demo.status);
  const isDemoLocked = (demo: SalesDemo) => isDemoExpired(demo) || isDemoInvalid(demo);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Active Client Demos</h1>
          <p className="text-xs text-slate-500 mt-1">
            Browse and manage customized review funnels built for client presentations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search demos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#5356EC] focus:border-[#5356EC]"
            />
          </div>

          <Link
            href="/sales/demo-builder"
            className="px-4 py-2.5 bg-[#5356EC] hover:bg-[#4346DB] text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 flex-shrink-0 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>+ Create New Demo</span>
          </Link>
        </div>
      </div>

      {error && <div className="flex items-center justify-between rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700"><span>{error}</span><button type="button" onClick={fetchDemos} className="min-h-11 rounded-xl border border-rose-200 bg-white px-3 font-bold">Retry</button></div>}

      {loading ? (
        <div className="py-24 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-[#5356EC] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredDemos.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center space-y-4 shadow-xs">
          <div className="w-12 h-12 bg-indigo-50 text-[#5356EC] rounded-2xl flex items-center justify-center mx-auto">
            <Layers className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-slate-900 text-base">
              {search ? 'No matching demos found' : 'No client demos created yet'}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {search
                ? 'Try a different business name or category.'
                : 'Build your first interactive demonstration to show business owners how review funnels work.'}
            </p>
          </div>
          <Link
            href="/sales/demo-builder"
            className="px-4 py-2 bg-[#5356EC] hover:bg-[#4346DB] text-white font-bold text-xs rounded-xl shadow-xs inline-flex items-center gap-2"
          >
            <Sparkles className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Launch Demo Builder</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDemos.map((d) => (
            <div
              key={d.id}
              className="bg-white border border-slate-200/90 rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-sm shadow-xs"
                      style={{ backgroundColor: d.primary_color || '#5356EC' }}
                    >
                      {d.business_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm leading-tight">{d.business_name}</h3>
                      <p className="text-[11px] text-slate-500 font-medium">{d.category}</p>
                    </div>
                  </div>

                   <span
                     className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        isDemoRevoked(d)
                          ? 'bg-slate-100 text-slate-600 border-slate-300'
                          : isDemoInvalid(d)
                          ? 'bg-slate-100 text-slate-600 border-slate-300'
                          : isDemoExpired(d)
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                         : d.status === 'converted'
                         ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                         : 'bg-indigo-50 text-[#5356EC] border-indigo-200'
                     }`}
                   >
                      {isDemoRevoked(d) ? 'REVOKED' : isDemoInvalid(d) ? 'UNAVAILABLE' : isDemoExpired(d) ? 'EXPIRED' : d.status === 'converted' ? 'CONVERTED' : 'ACTIVE'}
                   </span>
                </div>

                <div className="flex items-center gap-4 text-slate-500 text-[11px]">
                  <span className="flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-slate-400" />
                    <span>{d.view_count || 0} client views</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{new Date(d.created_at).toLocaleDateString()}</span>
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopy(d.slug)}
                    className="flex-1 py-2 px-2.5 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {copiedSlug === d.slug ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-500" />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>

                   {isDemoLocked(d) ? (
                     <span className="p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-500" title={isDemoRevoked(d) ? 'Demo revoked' : isDemoInvalid(d) ? 'Demo unavailable' : 'Demo expired'}>
                       <ExternalLink className="w-3.5 h-3.5" />
                     </span>
                   ) : (
                     <a
                       href={`/f/${d.slug}`}
                       target="_blank"
                       rel="noreferrer"
                       className="p-2 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
                       title="Open Customer Funnel"
                     >
                       <ExternalLink className="w-3.5 h-3.5" />
                     </a>
                   )}

                  <button
                    onClick={() => setQrModalDemo(d)}
                    className="p-2 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                    title="View QR Code"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                  </button>
                </div>

                {d.status !== 'converted' && !isDemoLocked(d) && (
                  <Link
                    href={`/sales/conversions?demoId=${d.id}&prospectId=${d.prospect_id || ''}`}
                    className="w-full py-2.5 rounded-xl bg-[#5356EC] hover:bg-[#4346DB] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all"
                  >
                    <span>Convert to Customer</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* QR Code Inspection Modal */}
      {qrModalDemo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center space-y-5 shadow-2xl">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-900 text-sm">Customer Review Funnel QR</h3>
              <button
                onClick={() => setQrModalDemo(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

             <p className="text-xs text-slate-900 font-bold">{qrModalDemo.business_name}</p>
             <SalesQrActions slug={qrModalDemo.slug} />

            <button
              onClick={() => setQrModalDemo(null)}
              className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
