'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, Search, Phone, Mail, Star, ExternalLink, Calendar, ShieldCheck, Trash2 } from 'lucide-react';
import { customerService, businessService } from '@/services';
import { Customer, Business } from '@/types';
import {
  PortalCard,
  PortalErrorState,
  PortalLoadingState,
  PortalPageHeader,
} from '@/components/client-portal/PortalUI';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [activeBiz, setActiveBiz] = useState<Business | null>(null);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      setLoadError(null);
      try {
        const biz = await businessService.getActiveBusiness();
        setActiveBiz(biz);
        const bizId = biz?.businessId || await businessService.getActiveBusinessId();

        const data = await customerService.getCustomers(bizId);
        setCustomers(data);
      } catch (err) {
        console.error('Failed to load customers:', err);
        setLoadError('Customer records are temporarily unavailable.');
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [loadAttempt]);

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone && c.phone.includes(search)) ||
    (c.email && c.email.toLowerCase().includes(search.toLowerCase()))
  );

  if (isLoading) {
    return <PortalLoadingState label="Loading customer directory" />;
  }

  if (loadError) {
    return <PortalErrorState description={loadError} onRetry={() => setLoadAttempt((attempt) => attempt + 1)} />;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      {/* Header */}
      <PortalPageHeader
        eyebrow="Relationship workspace"
        title="Customer Directory"
        description="Verified customer contacts captured through QR review funnels and private feedback channels."
        actions={
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm">
            Total Captured: <strong className="text-slate-900">{customers.length}</strong>
          </div>
        }
      />

      {customers.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm max-w-2xl mx-auto space-y-4">
          <div className="w-16 h-16 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center mx-auto">
            <Users className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 font-serif">No Customer Records Yet</h3>
          <p className="text-xs sm:text-sm text-gray-500 max-w-md mx-auto">
            When diners scan your QR code and submit their experience or private feedback, their contact information will automatically be saved to your private CRM.
          </p>
          {activeBiz && (
            <div className="pt-2">
              <a
                href={`/f/${activeBiz.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0B3D2E] text-white text-xs font-bold hover:bg-[#12543e] transition-colors"
              >
                <span>View Live Funnel</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}
        </div>
      ) : (
        /* Customers Table */
        <PortalCard className="overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                placeholder="Search by name, phone or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-10 rounded-xl text-xs bg-gray-50 border-gray-200"
              />
            </div>
            <div className="text-[11px] text-gray-400 font-medium">
              Showing {filteredCustomers.length} of {customers.length}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50 border-b border-gray-100 text-gray-500">
                <tr>
                  <th className="px-5 py-3.5 font-semibold">Customer</th>
                  <th className="px-5 py-3.5 font-semibold">Phone / WhatsApp</th>
                  <th className="px-5 py-3.5 font-semibold">Email</th>
                  <th className="px-5 py-3.5 font-semibold">Total Visits</th>
                  <th className="px-5 py-3.5 font-semibold">Last Rating</th>
                  <th className="px-5 py-3.5 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredCustomers.map((c) => {
                  const whatsappClean = (c.phone || '').replace(/[^0-9]/g, '');
                  const whatsappUrl = whatsappClean 
                    ? `https://wa.me/${whatsappClean}?text=${encodeURIComponent(`Hello ${c.name}, thank you for dining with us at ${activeBiz?.name || 'our business'}!`)}`
                    : null;

                  return (
                    <tr key={c.customerId} className="hover:bg-gray-50/70 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-[#0B3D2E]/10 text-[#0B3D2E] font-bold flex items-center justify-center shrink-0">
                            {c.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{c.name}</p>
                            <p className="text-[10px] text-gray-400">Captured via Funnel</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        {c.phone ? (
                          <span className="font-mono text-gray-700">{c.phone}</span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        {c.email ? (
                          <span className="text-gray-600">{c.email}</span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-gray-900">
                        {c.totalVisits || 1}
                      </td>
                      <td className="px-5 py-3.5">
                        {c.lastRating ? (
                          <div className="flex items-center gap-1 text-amber-500 font-semibold">
                            <Star className="w-3.5 h-3.5 fill-current" />
                            <span>{c.lastRating} Stars</span>
                          </div>
                        ) : (
                          <span className="text-gray-400">Rating Only</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {whatsappUrl ? (
                          <a
                            href={whatsappUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-semibold transition-colors"
                          >
                            <Phone className="w-3 h-3" />
                            <span>WhatsApp</span>
                          </a>
                        ) : (
                          <span className="text-gray-400 text-[11px]">No Phone</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </PortalCard>
      )}
    </div>
  );
}
