'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { Prospect, ProspectStage, LeadSource } from '@/types/sales';
import {
  Users2,
  Plus,
  Search,
  Filter,
  Phone,
  Mail,
  MapPin,
  ExternalLink,
  Sparkles,
  ArrowRight,
  Clock,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  X,
  MessageSquare,
  Building,
  Tag,
} from 'lucide-react';
import { SALES_CATEGORY_OPTIONS } from '@/data/categoryReviews';

const STAGES: ProspectStage[] = [
  'New Lead',
  'Contacted',
  'Qualified',
  'Demo In Progress',
  'Demo Shared',
  'Follow-up',
  'Payment Pending',
  'Won',
  'Activated',
  'Lost',
];

const SOURCES: LeadSource[] = ['Field Sales', 'WhatsApp', 'Meta Ads', 'Website', 'Referrals', 'Other'];

export default function LeadsPage() {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedStage, setSelectedStage] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');

  // Modal State
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    businessName: '',
    contactName: '',
    phone: '',
    email: '',
    category: SALES_CATEGORY_OPTIONS[0].name,
    city: '',
    address: '',
    website: '',
    googleMapsUrl: '',
    leadSource: 'Field Sales' as LeadSource,
    notes: '',
    nextFollowupDate: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchProspects = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      const params = new URLSearchParams();
      if (selectedStage !== 'all') params.append('stage', selectedStage);
      if (search) params.append('search', search);

      const res = await fetch(`/api/sales/prospects?${params.toString()}`, {
        headers: {
          Authorization: session ? `Bearer ${session.access_token}` : '',
        },
      });
      const data = await res.json();
      if (data.success) {
        setProspects(data.prospects || []);
      }
    } catch (e) {
      console.warn('Fetch prospects error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProspects();
  }, [selectedStage, search]);

  const handleCreateLead = async (ignoreWarning = false) => {
    setSubmitting(true);
    setErrorMessage(null);
    setDuplicateWarning(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/sales/prospects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: session ? `Bearer ${session.access_token}` : '',
        },
        body: JSON.stringify({
          ...formData,
          ignoreDuplicateWarning: ignoreWarning,
        }),
      });

      const data = await res.json();

      if (res.status === 409 && data.warning === 'DUPLICATE_POSSIBLE') {
        setDuplicateWarning(data.message);
        setSubmitting(false);
        return;
      }

      if (!data.success) {
        setErrorMessage(data.error || 'Failed to save lead');
      } else {
        setAddModalOpen(false);
        setFormData({
          businessName: '',
          contactName: '',
          phone: '',
          email: '',
          category: SALES_CATEGORY_OPTIONS[0].name,
          city: '',
          address: '',
          website: '',
          googleMapsUrl: '',
          leadSource: 'Field Sales',
          notes: '',
          nextFollowupDate: '',
        });
        fetchProspects();
      }
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStage = async (id: string, newStage: ProspectStage) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      await fetch('/api/sales/prospects', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: session ? `Bearer ${session.access_token}` : '',
        },
        body: JSON.stringify({ id, stage: newStage }),
      });
      fetchProspects();
    } catch (e) {
      console.warn('Stage update error:', e);
    }
  };

  const filteredProspects = prospects.filter((lead) => {
    if (selectedCategory !== 'all' && lead.category !== selectedCategory) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Leads & Prospects</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage field interactions, schedule follow-ups, and build customized demos.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white border border-slate-200 rounded-xl p-1 flex text-xs font-semibold shadow-sm">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'table' ? 'bg-[#5356EC] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              List View
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'kanban' ? 'bg-[#5356EC] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pipeline Kanban
            </button>
          </div>

          <button
            onClick={() => setAddModalOpen(true)}
            className="px-4 py-2.5 bg-[#5356EC] hover:bg-[#4346DB] text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Add Prospect</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white border border-slate-200/90 p-3.5 rounded-2xl shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search business name, phone, city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-slate-500 whitespace-nowrap">Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 font-medium focus:outline-none max-w-[200px] truncate"
            >
              <option value="all">All Categories</option>
              {SALES_CATEGORY_OPTIONS.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-slate-500 whitespace-nowrap">Stage:</span>
            <select
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 font-medium focus:outline-none"
            >
              <option value="all">All Stages ({prospects.length})</option>
              {STAGES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="py-24 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : prospects.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 bg-indigo-50 text-[#5356EC] rounded-2xl flex items-center justify-center mx-auto">
            <Users2 className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-slate-900 text-base">No prospects registered yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Start by adding your first lead or prospect to demonstrate the Pixora Review Funnel.
            </p>
          </div>
          <button
            onClick={() => setAddModalOpen(true)}
            className="px-4 py-2 bg-[#5356EC] hover:bg-[#4346DB] text-white font-bold text-xs rounded-xl shadow-sm inline-flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Create First Lead</span>
          </button>
        </div>
      ) : viewMode === 'table' ? (
        /* Table View */
        <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200/80 uppercase tracking-wider text-[10px] font-bold">
                <tr>
                  <th className="py-3 px-4">Business & Contact</th>
                  <th className="py-3 px-4">Category & City</th>
                  <th className="py-3 px-4">Source</th>
                  <th className="py-3 px-4">Current Stage</th>
                  <th className="py-3 px-4">Next Follow-up</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProspects.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 space-y-0.5">
                      <p className="font-bold text-slate-900 text-sm">{lead.business_name}</p>
                      <div className="flex items-center gap-3 text-[11px] text-slate-500">
                        {lead.contact_name && <span>{lead.contact_name}</span>}
                        {lead.phone && (
                          <span className="flex items-center gap-1 text-slate-600">
                            <Phone className="w-2.5 h-2.5" /> {lead.phone}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-700">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/60 mb-0.5">
                        <Tag className="w-2.5 h-2.5" />
                        <span>{lead.category || 'General'}</span>
                      </span>
                      <p className="text-[11px] text-slate-400">{lead.city || 'Location unassigned'}</p>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-semibold border border-slate-200">
                        {lead.lead_source}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <select
                        value={lead.stage}
                        onChange={(e) => handleUpdateStage(lead.id, e.target.value as ProspectStage)}
                        className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-[11px] font-bold text-[#5356EC] focus:outline-none"
                      >
                        {STAGES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                      {lead.next_followup_date ? (
                        <span className="flex items-center gap-1 text-amber-600 font-semibold">
                          <Calendar className="w-3 h-3" />
                          {new Date(lead.next_followup_date).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="text-slate-400">None scheduled</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/sales/demo-builder?prospectId=${lead.id}&name=${encodeURIComponent(
                            lead.business_name
                          )}&cat=${encodeURIComponent(lead.category)}&mapsUrl=${encodeURIComponent(lead.google_maps_url || '')}`}
                          className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-[#5356EC] text-[#5356EC] hover:text-white border border-indigo-100 text-[11px] font-bold flex items-center gap-1 transition-all"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>Build Demo</span>
                        </Link>

                        <Link
                          href={`/sales/conversions?prospectId=${lead.id}`}
                          className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-600 text-emerald-600 hover:text-white border border-emerald-100 text-[11px] font-bold flex items-center gap-1 transition-all"
                        >
                          <span>Convert</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Kanban View */
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STAGES.map((stage) => {
            const stageLeads = filteredProspects.filter((p) => p.stage === stage);
            return (
              <div
                key={stage}
                className="w-72 flex-shrink-0 bg-white border border-slate-200/80 rounded-2xl p-3.5 flex flex-col space-y-3 shadow-sm"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-xs font-bold text-slate-800">{stage}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    {stageLeads.length}
                  </span>
                </div>

                <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[600px]">
                  {stageLeads.map((lead) => (
                    <div
                      key={lead.id}
                      className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-3 space-y-2 hover:border-slate-300 transition-colors shadow-2xs"
                    >
                      <div>
                        <h4 className="font-bold text-slate-900 text-xs">{lead.business_name}</h4>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 mt-1">
                          <Tag className="w-2 h-2" />
                          <span>{lead.category || 'General'}</span>
                        </span>
                      </div>
                      {lead.phone && (
                        <p className="text-[11px] text-slate-600 flex items-center gap-1">
                          <Phone className="w-2.5 h-2.5 text-slate-400" /> {lead.phone}
                        </p>
                      )}
                      <div className="pt-2 border-t border-slate-200/60 flex justify-between items-center text-[10px]">
                        <Link
                          href={`/sales/demo-builder?prospectId=${lead.id}&name=${encodeURIComponent(
                            lead.business_name
                          )}&cat=${encodeURIComponent(lead.category)}&mapsUrl=${encodeURIComponent(lead.google_maps_url || '')}`}
                          className="text-[#5356EC] hover:underline font-bold"
                        >
                          Build Demo →
                        </Link>
                        <Link
                          href={`/sales/conversions?prospectId=${lead.id}`}
                          className="text-emerald-600 hover:underline font-bold"
                        >
                          Convert
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Lead Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-[#5356EC] flex items-center justify-center">
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Register New Prospect</h3>
                  <p className="text-xs text-slate-500">Record business details and schedule demo</p>
                </div>
              </div>
              <button
                onClick={() => setAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {duplicateWarning && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-800 space-y-2">
                <div className="flex items-center gap-2 font-bold">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Possible Duplicate Lead Detected</span>
                </div>
                <p>{duplicateWarning}</p>
                <button
                  type="button"
                  onClick={() => handleCreateLead(true)}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs"
                >
                  Create Anyway (Ignore Warning)
                </button>
              </div>
            )}

            {errorMessage && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-700">
                {errorMessage}
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleCreateLead(false);
              }}
              className="space-y-4 text-xs"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-700 font-bold">Business Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Royal Sweets & Bakery"
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-slate-700 font-bold">Select Category *</label>
                    <span className="text-[10px] text-indigo-600 font-semibold flex items-center gap-0.5">
                      <Sparkles className="w-2.5 h-2.5" /> AI Review Presets
                    </span>
                  </div>
                  <select
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 font-semibold focus:outline-none focus:bg-white focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                  >
                    {Object.entries(
                      SALES_CATEGORY_OPTIONS.reduce((acc, cat) => {
                        acc[cat.group] = acc[cat.group] || [];
                        acc[cat.group].push(cat);
                        return acc;
                      }, {} as Record<string, typeof SALES_CATEGORY_OPTIONS>)
                    ).map(([group, cats]) => (
                      <optgroup key={group} label={`── ${group} ──`}>
                        {cats.map((c) => (
                          <option key={c.id} value={c.name}>
                            {c.name}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
              </div>

              {/* Dynamic review preset hint based on selected category */}
              {(() => {
                const selectedOpt = SALES_CATEGORY_OPTIONS.find((c) => c.name === formData.category) || SALES_CATEGORY_OPTIONS[0];
                return (
                  <div className="p-3 rounded-2xl bg-gradient-to-r from-indigo-50 via-purple-50 to-blue-50 border border-indigo-100 flex items-start gap-2.5 text-[11px] text-indigo-950">
                    <Sparkles className="w-4 h-4 text-[#5356EC] shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <p className="font-extrabold text-indigo-900">
                        {selectedOpt.name} Funnel Preset Active
                      </p>
                      <p className="text-slate-600 leading-relaxed">
                        {selectedOpt.description}. Selecting this category ensures the customer funnel displays hyper-relevant 5-star pre-written reviews tailored to their business.
                      </p>
                    </div>
                  </div>
                );
              })()}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-700 font-bold">Contact Person</label>
                  <input
                    type="text"
                    placeholder="e.g. Ramesh Patel"
                    value={formData.contactName}
                    onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-700 font-bold">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="e.g. 9876543210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-700 font-bold">Email Address</label>
                  <input
                    type="email"
                    placeholder="owner@business.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-700 font-bold">Business Address</label>
                  <input
                    type="text"
                    placeholder="Shop/Office No, Street, Landmark"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-700 font-bold">City / Area</label>
                  <input
                    type="text"
                    placeholder="e.g. Mumbai, Bandra West"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 font-bold">Google Maps / Review URL</label>
                <input
                  type="url"
                  placeholder="https://maps.app.goo.gl/..."
                  value={formData.googleMapsUrl}
                  onChange={(e) => setFormData({ ...formData, googleMapsUrl: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-700 font-bold">Lead Source</label>
                  <select
                    value={formData.leadSource}
                    onChange={(e) => setFormData({ ...formData, leadSource: e.target.value as LeadSource })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none"
                  >
                    {SOURCES.map((src) => (
                      <option key={src} value={src}>
                        {src}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-700 font-bold">Next Follow-up Date</label>
                  <input
                    type="date"
                    value={formData.nextFollowupDate}
                    onChange={(e) => setFormData({ ...formData, nextFollowupDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 font-bold">Meeting Notes / Objections</label>
                <textarea
                  rows={3}
                  placeholder="Key customer needs, current review count, objections..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-[#5356EC] hover:bg-[#4346DB] text-white font-bold flex items-center gap-2 shadow-sm disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Create Lead & Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
