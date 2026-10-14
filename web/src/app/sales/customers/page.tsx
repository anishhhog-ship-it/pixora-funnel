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
            Directory of all live business accounts, review funnel links, and handover contacts.
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
                  <th className="py-3 px-4 text-right">Joined</th>
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

                    <td className="py-3.5 px-4 text-right text-slate-400 text-[11px]">
                      {new Date(c.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
