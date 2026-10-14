'use client';

import { useState, useEffect, useRef, Suspense, createElement } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { Prospect, SalesDemo } from '@/types/sales';
import {
  Sparkles,
  ExternalLink,
  Copy,
  CheckCircle2,
  ArrowRight,
  Palette,
  Store,
  ShieldCheck,
  Zap,
  Utensils,
  Coffee,
  Building,
  Cake,
  Scissors,
  Smile,
  Stethoscope,
  Dumbbell,
  Gem,
  ShoppingBag,
  Car,
  Home,
  GraduationCap,
  Briefcase,
  Plane,
  PartyPopper,
  Wrench,
  Hammer,
  Paintbrush,
  Smartphone,
  Pill,
  Camera,
  Heart,
  Layers,
  Search,
  Check,
  ChevronDown,
  X,
  SlidersHorizontal,
  ChevronRight,
} from 'lucide-react';
import SalesQrActions from '@/components/sales/SalesQrActions';
import {
  getFunnelBackground,
  getAllCategories,
  normalizeBusinessCategory,
  BusinessCategoryConfig,
} from '@/config/businessCategories';

function getCategoryIcon(id: string) {
  switch (id) {
    case 'restaurant':
      return Utensils;
    case 'cafe':
      return Coffee;
    case 'hotel':
      return Building;
    case 'bakery':
      return Cake;
    case 'salon':
      return Scissors;
    case 'beauty':
      return Sparkles;
    case 'dentist':
      return Smile;
    case 'clinic':
      return Stethoscope;
    case 'gym':
      return Dumbbell;
    case 'jewellery':
      return Gem;
    case 'fashion':
      return ShoppingBag;
    case 'retail':
      return Store;
    case 'grocery':
      return Store;
    case 'automotive':
      return Car;
    case 'real-estate':
      return Home;
    case 'education':
      return GraduationCap;
    case 'professional':
      return Briefcase;
    case 'travel':
      return Plane;
    case 'events':
      return PartyPopper;
    case 'pvc-plumbing':
      return Wrench;
    case 'hardware':
      return Hammer;
    case 'electrical':
      return Zap;
    case 'paint':
      return Paintbrush;
    case 'electronics':
      return Smartphone;
    case 'pharmacy':
      return Pill;
    case 'home-services':
      return ShieldCheck;
    case 'creative':
      return Camera;
    case 'pet-care':
      return Heart;
    default:
      return Layers;
  }
}

// Business industry sectors; category count is read from the shared registry.
export interface CategorySector {
  id: string;
  label: string;
  badge: string;
  categoryIds: string[];
}

export const CATEGORY_SECTORS: CategorySector[] = [
  {
    id: 'all',
    label: 'All Verticals',
    badge: 'All Categories',
    categoryIds: [],
  },
  {
    id: 'industrial',
    label: 'Hardware & Trade',
    badge: '5 Categories',
    categoryIds: ['hardware', 'pvc-plumbing', 'electrical', 'paint', 'electronics'],
  },
  {
    id: 'food',
    label: 'Food & Dining',
    badge: '4 Categories',
    categoryIds: ['restaurant', 'cafe', 'bakery', 'hotel'],
  },
  {
    id: 'health',
    label: 'Healthcare',
    badge: '3 Categories',
    categoryIds: ['clinic', 'dentist', 'pharmacy'],
  },
  {
    id: 'beauty',
    label: 'Salon & Wellness',
    badge: '3 Categories',
    categoryIds: ['salon', 'beauty', 'gym'],
  },
  {
    id: 'retail',
    label: 'Retail & Luxury',
    badge: '6 Categories',
    categoryIds: ['jewellery', 'fashion', 'retail', 'grocery', 'automotive', 'pet-care'],
  },
  {
    id: 'services',
    label: 'Services & Advisory',
    badge: '8 Categories',
    categoryIds: ['real-estate', 'education', 'professional', 'travel', 'events', 'home-services', 'creative', 'other'],
  },
];

// Popular Quick Access Categories
const FEATURED_CATEGORY_IDS = [
  'hardware',
  'pvc-plumbing',
  'electrical',
  'paint',
  'electronics',
  'restaurant',
  'cafe',
  'clinic',
  'salon',
  'jewellery',
  'automotive',
  'real-estate',
  'gym',
  'bakery',
];

export default function DemoBuilderWrapper() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading Demo Builder...</div>}>
      <DemoBuilderPage />
    </Suspense>
  );
}

function DemoBuilderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialProspectId = searchParams.get('prospectId') || '';
  const initialName = searchParams.get('name') || '';
  const initialCat = searchParams.get('cat') || '';

  const allCategories = getAllCategories();

  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [selectedProspectId, setSelectedProspectId] = useState(initialProspectId);

  const [businessName, setBusinessName] = useState(initialName || '');
  const [category, setCategory] = useState(initialCat || 'Restaurant & Fine Dining');
  const [reviewDestinationUrl, setReviewDestinationUrl] = useState('https://maps.app.goo.gl/');
  const [primaryColor, setPrimaryColor] = useState('#0B3D2E');
  const [secondaryColor, setSecondaryColor] = useState('#D4AF37');
  const [templateSlug, setTemplateSlug] = useState('classic');

  // Category Selector Dropdown & Modal State
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [activeSector, setActiveSector] = useState('all');
  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  const categoryDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
        setIsCategoryDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [building, setBuilding] = useState(false);
  const [createdDemo, setCreatedDemo] = useState<Pick<SalesDemo, 'id' | 'slug'> | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Current normalized category config
  const currentCategoryConfig = normalizeBusinessCategory(category);

  // Sector title lookup for current category
  const currentSector = CATEGORY_SECTORS.find((s) => s.id !== 'all' && s.categoryIds.includes(currentCategoryConfig.id)) || {
    id: 'general',
    label: 'Services & General',
    badge: 'Standard',
    categoryIds: [],
  };

  useEffect(() => {
    async function fetchProspects() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const res = await fetch('/api/sales/prospects', {
          headers: { Authorization: session ? `Bearer ${session.access_token}` : '' },
        });
        const data = await res.json();
        if (data.success && data.prospects) {
          setProspects(data.prospects);
        }
      } catch (e) {
        console.warn('Prospects fetch error:', e);
      }
    }
    fetchProspects();
  }, []);

  const handleSelectProspect = (pId: string) => {
    setSelectedProspectId(pId);
    const found = prospects.find((p) => p.id === pId);
    if (found) {
      setBusinessName(found.business_name);
      setCategory(found.category);
      const catConfig = normalizeBusinessCategory(found.category);
      if (catConfig.defaultPrimaryColor) setPrimaryColor(catConfig.defaultPrimaryColor);
      if (catConfig.defaultSecondaryColor) setSecondaryColor(catConfig.defaultSecondaryColor);
      if (found.google_maps_url) {
        setReviewDestinationUrl(found.google_maps_url);
      }
    }
  };

  const handleApplyCategory = (catConfig: BusinessCategoryConfig) => {
    setCategory(catConfig.name);
    if (catConfig.defaultPrimaryColor) setPrimaryColor(catConfig.defaultPrimaryColor);
    if (catConfig.defaultSecondaryColor) setSecondaryColor(catConfig.defaultSecondaryColor);
    setIsCategoryDropdownOpen(false);
    setShowCategoryModal(false);
  };

  const handleCreateDemo = async () => {
    if (!businessName.trim() || !reviewDestinationUrl.trim()) {
      setErrorMsg('Please enter both business name and Google review URL.');
      return;
    }

    setBuilding(true);
    setErrorMsg(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/sales/demos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: session ? `Bearer ${session.access_token}` : '',
        },
        body: JSON.stringify({
          prospectId: selectedProspectId || null,
          businessName,
          category,
          reviewDestinationUrl,
          primaryColor,
          templateSlug,
          config: {
            headline: currentCategoryConfig.headline,
            subheadline: currentCategoryConfig.subheadline,
            topics: currentCategoryConfig.footerFeatures?.map((f) => f.label) || [],
          },
        }),
      });

      const data = await res.json();
      if (!data.success) {
        setErrorMsg(data.error || 'Failed to create demo');
      } else {
        setCreatedDemo(data.demo);
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to create demo');
    } finally {
      setBuilding(false);
    }
  };

  const funnelPublicUrl = createdDemo
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/f/${createdDemo.slug}`
    : '';

  const handleCopyLink = () => {
    if (funnelPublicUrl) {
      navigator.clipboard.writeText(funnelPublicUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const PRESET_COLORS = ['#0B3D2E', '#2563EB', '#7C3AED', '#DC2626', '#D97706', '#0F172A', '#0891B2', '#059669'];

  // Filtered categories for the interactive selector & browser modal
  const filteredCategories = allCategories.filter((cat) => {
    // Filter by sector if active
    if (activeSector !== 'all') {
      const sector = CATEGORY_SECTORS.find((s) => s.id === activeSector);
      if (sector && !sector.categoryIds.includes(cat.id)) {
        return false;
      }
    }
    // Filter by search query
    const q = categorySearchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      cat.name.toLowerCase().includes(q) ||
      cat.description.toLowerCase().includes(q) ||
      cat.theme.toLowerCase().includes(q) ||
      cat.aliases.some((a) => a.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-[#5356EC]" />
          <span>Interactive Funnel &amp; Demo Builder</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Configure authentic, live Review Funnels matching the exact production customer experience.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Form: White Theme Configuration Card */}
        <div className="lg:col-span-7 bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {errorMsg}
            </div>
          )}

          {/* Success Card if Funnel Created */}
          {createdDemo && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 space-y-4 animate-in fade-in duration-300">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Real Customer Funnel Ready!</h3>
                  <p className="text-[11px] text-emerald-700">This is the real, live customer review funnel provided to the business.</p>
                </div>
              </div>

               <div className="bg-white border border-emerald-200 rounded-xl p-3 flex items-center justify-between gap-3 text-xs shadow-2xs">
                <span className="text-slate-800 font-mono font-semibold truncate">{funnelPublicUrl}</span>
                <button
                  onClick={handleCopyLink}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1.5 flex-shrink-0 cursor-pointer shadow-xs transition-colors"
                >
                  {copiedLink ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Copied!' : 'Copy Funnel Link'}</span>
                </button>
               </div>

               <div className="rounded-2xl border border-emerald-200 bg-white p-4">
                 <p className="mb-3 text-xs font-bold text-slate-800">QR for the acrylic stand</p>
                 <SalesQrActions slug={createdDemo.slug} compact />
               </div>

              <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
                <a
                  href={`/f/${createdDemo.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 flex items-center gap-1.5 shadow-2xs"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Real Customer Funnel</span>
                </a>

                <Link
                  href={`/sales/conversions?demoId=${createdDemo.id}&prospectId=${selectedProspectId}`}
                  className="px-4 py-2 rounded-xl bg-[#5356EC] hover:bg-[#4346DB] text-white text-xs font-bold shadow-sm flex items-center gap-1.5"
                >
                  <span>Close Deal &amp; Convert Customer</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}

          {/* Step 1: Select Prospect */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              1. Link to Prospect (Optional)
            </label>
            <select
              value={selectedProspectId}
              onChange={(e) => handleSelectProspect(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:bg-white focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">-- Choose Existing Lead or Enter New --</option>
              {prospects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.business_name} ({p.category})
                </option>
              ))}
            </select>
          </div>

          {/* Step 2: Business Customization */}
          <div className="space-y-5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              2. Business Details &amp; Category
            </label>

            {/* Business Name */}
            <div className="space-y-1">
              <span className="text-slate-600 text-xs font-semibold">Business Name *</span>
              <input
                type="text"
                required
                placeholder="e.g. Brij Mantra Bistro / Shree Ram Hardware"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Comprehensive Category Selection Feature */}
            <div className="space-y-3 bg-slate-50/80 border border-slate-200/90 rounded-2xl p-4 sm:p-5 relative">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Store className="w-4 h-4 text-[#5356EC]" />
                    <span>Business Category &amp; Funnel Layout</span>
                  </span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Select the exact vertical to configure the production funnel theme and prompts.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setCategorySearchQuery('');
                    setActiveSector('all');
                    setShowCategoryModal(true);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-slate-300 text-[#5356EC] font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer flex-shrink-0"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                   <span>Browse All {allCategories.length}</span>
                </button>
              </div>

              {/* Interactive Searchable Category Trigger & Dropdown */}
              <div className="relative" ref={categoryDropdownRef}>
                <div
                  onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                  className={`bg-white border rounded-xl p-3 flex items-center justify-between gap-3 shadow-2xs cursor-pointer transition-all ${
                    isCategoryDropdownOpen
                      ? 'border-[#5356EC] ring-2 ring-indigo-500/10'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-white shadow-xs"
                      style={{ backgroundColor: primaryColor }}
                    >
                       {createElement(getCategoryIcon(currentCategoryConfig.id), { className: 'w-5 h-5' })}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-slate-900 text-xs truncate">{currentCategoryConfig.name}</h4>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-[#5356EC] border border-indigo-100 flex-shrink-0">
                          {currentCategoryConfig.theme}
                        </span>
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 flex-shrink-0">
                          {currentSector.label.split('(')[0].trim()}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                        {currentCategoryConfig.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs font-semibold text-[#5356EC] hidden sm:inline">
                      {isCategoryDropdownOpen ? 'Close' : 'Select'}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 transition-transform ${
                        isCategoryDropdownOpen ? 'rotate-180 text-[#5356EC]' : ''
                      }`}
                    />
                  </div>
                </div>

                {/* Searchable Dropdown Menu */}
                {isCategoryDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl z-30 p-3 space-y-3 animate-in fade-in slide-in-from-top-2 duration-150">
                    {/* Search Field */}
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        autoFocus
                        placeholder="Search categories (e.g. plumbing, dental, hardware, cafe, salon)..."
                        value={categorySearchQuery}
                        onChange={(e) => setCategorySearchQuery(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-8 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-indigo-500"
                      />
                      {categorySearchQuery && (
                        <button
                          type="button"
                          onClick={() => setCategorySearchQuery('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Sector Filter Tabs */}
                    <div className="flex gap-1 overflow-x-auto pb-1 no-scrollbar text-[11px]">
                      {CATEGORY_SECTORS.map((sector) => {
                        const isSectorActive = activeSector === sector.id;
                        return (
                          <button
                            key={sector.id}
                            type="button"
                            onClick={() => setActiveSector(sector.id)}
                            className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${
                              isSectorActive
                                ? 'bg-[#5356EC] text-white font-bold shadow-2xs'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {sector.label}
                          </button>
                        );
                      })}
                    </div>

                    {/* Scrollable Category Options */}
                    <div className="max-h-60 overflow-y-auto space-y-1 pr-1 divide-y divide-slate-100">
                      {filteredCategories.length === 0 ? (
                        <div className="p-4 text-center text-xs text-slate-500">
                          No category matching &ldquo;{categorySearchQuery}&rdquo; in this sector.
                        </div>
                      ) : (
                        filteredCategories.map((cat) => {
                          const Icon = getCategoryIcon(cat.id);
                          const isSelected = currentCategoryConfig.id === cat.id;

                          return (
                            <div
                              key={cat.id}
                              onClick={() => handleApplyCategory(cat)}
                              className={`p-2.5 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition-all ${
                                isSelected
                                  ? 'bg-indigo-50/80 text-[#5356EC] font-semibold'
                                  : 'hover:bg-slate-50 text-slate-800'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div
                                  className="w-7 h-7 rounded-lg flex items-center justify-center text-white flex-shrink-0"
                                  style={{ backgroundColor: cat.defaultPrimaryColor || '#5356EC' }}
                                >
                                  <Icon className="w-3.5 h-3.5" />
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-bold truncate">{cat.name}</span>
                                    <span className="text-[10px] text-slate-400 font-medium px-1.5 py-0.2 bg-slate-100 rounded">
                                      {cat.theme}
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-slate-500 truncate">{cat.description}</p>
                                </div>
                              </div>

                              {isSelected ? (
                                <Check className="w-4 h-4 text-[#5356EC] flex-shrink-0" />
                              ) : (
                                <ChevronRight className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Dropdown Footer */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                      <span>Showing {filteredCategories.length} categories</span>
                      <button
                        type="button"
                        onClick={() => {
                          setIsCategoryDropdownOpen(false);
                          setShowCategoryModal(true);
                        }}
                        className="text-[#5356EC] font-bold hover:underline"
                      >
                         Open Full Category Grid &rarr;
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Category Chips for 1-Click Switch */}
              <div className="pt-1">
                <span className="text-[11px] font-semibold text-slate-500 block mb-1.5">
                  Popular Verticals (Instant 1-Click Switch):
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                  {FEATURED_CATEGORY_IDS.map((catId) => {
                    const cat = allCategories.find((c) => c.id === catId);
                    if (!cat) return null;
                    const Icon = getCategoryIcon(cat.id);
                    const isSelected = currentCategoryConfig.id === cat.id;

                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => handleApplyCategory(cat)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-50 text-[#5356EC] border-indigo-300 font-bold shadow-2xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-[#5356EC]' : 'text-slate-400'}`} />
                        <span>{cat.name.split('&')[0].trim()}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Active Category Auto-Configured Funnel Highlights */}
              <div className="pt-2 border-t border-slate-200/70 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                <div className="bg-white/90 border border-slate-200 rounded-xl p-2.5 space-y-1">
                  <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px] block">
                    Headline Question
                  </span>
                  <p className="text-slate-800 font-medium italic line-clamp-2">
                    &ldquo;{currentCategoryConfig.headline}&rdquo;
                  </p>
                </div>

                <div className="bg-white/90 border border-slate-200 rounded-xl p-2.5 space-y-1">
                  <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px] block">
                    Customer Experience Focus
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {(currentCategoryConfig.footerFeatures || [
                      { label: 'Fast & Easy' },
                      { label: 'Quality Service' },
                      { label: 'Verified Reviews' },
                    ]).slice(0, 3).map((f, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-medium"
                      >
                        {f.label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Google Review URL */}
            <div className="space-y-1">
              <span className="text-slate-600 text-xs font-semibold">Google Maps Review Destination URL *</span>
              <input
                type="url"
                required
                placeholder="https://maps.app.goo.gl/..."
                value={reviewDestinationUrl}
                onChange={(e) => setReviewDestinationUrl(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-indigo-500"
              />
              <p className="text-[11px] text-slate-400">
                Where 4 &amp; 5-star positive reviews are routed automatically.
              </p>
            </div>
          </div>

          {/* Step 3: Visual Theme Accent */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <Palette className="w-3.5 h-3.5 text-[#5356EC]" />
                <span>3. Primary Theme Accent Color</span>
              </label>
              <span className="text-[11px] text-slate-400 font-mono">{primaryColor}</span>
            </div>

            <div className="flex items-center gap-3">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setPrimaryColor(c)}
                  className={`w-8 h-8 rounded-full border-2 transition-transform cursor-pointer ${
                    primaryColor === c ? 'scale-125 border-slate-900 shadow-md ring-2 ring-indigo-200' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c }}
                  title={c}
                />
              ))}
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-8 h-8 rounded-full bg-transparent cursor-pointer border border-slate-200"
                title="Custom Color Picker"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={handleCreateDemo}
              disabled={building}
              className="w-full py-3.5 rounded-xl bg-[#5356EC] hover:bg-[#4346DB] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 stroke-[2.5]" />
              <span>{building ? 'Building Real Customer Funnel...' : 'Generate Real Customer Funnel'}</span>
            </button>
          </div>
        </div>

        {/* Right Preview Card: EXACT REAL PIXORA FUNNEL DESIGN */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Real Customer Funnel
            </span>
            <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
              Live Customer Screen (/f/)
            </span>
          </div>

          {/* Mobile Shell with Atmospheric Backdrop */}
          {(() => {
            const catBg = getFunnelBackground({ category });
            const previewSlug = businessName
              ? businessName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
              : 'your-business';

            return (
              <div className="relative rounded-[36px] overflow-hidden border-[8px] border-slate-900 shadow-2xl bg-slate-950 max-w-sm mx-auto min-h-[580px] flex flex-col justify-between">
                {/* Mini Mobile Browser Top Bar */}
                <div className="relative z-20 w-full bg-slate-900/90 backdrop-blur-md px-3.5 py-2 flex items-center justify-between border-b border-white/10 text-[10px]">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0 animate-pulse" />
                    <span className="font-mono text-stone-200 truncate">
                      /f/{previewSlug}
                    </span>
                  </div>
                  <span className="text-[9px] uppercase tracking-wider text-emerald-400 font-bold bg-emerald-950/70 px-2 py-0.5 rounded border border-emerald-700/50 flex-shrink-0">
                    REAL FUNNEL
                  </span>
                </div>

                {/* Background Image / Ambient Vignette */}
                <div
                  className="absolute inset-0 bg-cover bg-center transition-all duration-500"
                  style={{
                    backgroundImage: `url(${catBg.desktop})`,
                  }}
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background: catBg.overlay.gradient || 'rgba(0,0,0,0.65)',
                  }}
                />

                {/* Top Funnel Content */}
                <div className="relative z-10 p-5 pt-7 flex flex-col items-center text-center">
                  {/* Lotus Floral Emblem */}
                  <div className="mb-2.5">
                    <svg className="w-9 h-9 mx-auto" viewBox="0 0 100 100" fill="none">
                      <path d="M50 14 C44 32 40 54 50 78 C60 54 56 32 50 14 Z" stroke="#D4AF37" strokeWidth="3.2" fill="#D4AF37" fillOpacity="0.2" />
                      <path d="M50 78 C36 60 28 42 36 24 C44 34 48 55 50 78 Z" stroke="#D4AF37" strokeWidth="3.2" fill="#D4AF37" fillOpacity="0.2" />
                      <path d="M50 78 C64 60 72 42 64 24 C56 34 52 55 50 78 Z" stroke="#D4AF37" strokeWidth="3.2" fill="#D4AF37" fillOpacity="0.2" />
                      <path d="M50 78 C24 68 16 50 22 36 C30 44 44 64 50 78 Z" stroke="#D4AF37" strokeWidth="3.2" fill="#D4AF37" fillOpacity="0.2" />
                      <path d="M50 78 C76 68 84 50 78 36 C70 44 56 64 50 78 Z" stroke="#D4AF37" strokeWidth="3.2" fill="#D4AF37" fillOpacity="0.2" />
                    </svg>
                  </div>

                  {/* "Your experience matters" Pill Badge */}
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/40 border border-white/20 text-[10px] font-bold uppercase tracking-widest text-stone-200 mb-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
                    <span>Your experience matters</span>
                  </div>

                  {/* Playfair Serif Headline */}
                  <h3
                    className="text-2xl font-bold text-[#FAF5EB] leading-tight mb-1"
                    style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                  >
                    {catBg.categoryConfig.headline || 'How was your visit?'}
                  </h3>
                  <p className="text-xs text-stone-300 font-light">
                    {businessName || 'Your Business Name'}
                  </p>
                </div>

                {/* Central White Review Card */}
                <div className="relative z-10 mx-4 mb-4 rounded-[28px] border border-white/80 bg-white/95 p-5 shadow-2xl backdrop-blur-md text-center">
                  {/* Official Google G Logo Badge */}
                  <div className="flex justify-center mb-3">
                    <div className="w-11 h-11 rounded-full bg-white border border-slate-100 shadow-md flex items-center justify-center">
                      <svg viewBox="0 0 24 24" width="24" height="24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.31-1.03 2.41-2.16 3.16v2.62h3.49c2.04-1.89 3.22-4.67 3.22-7.79z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.49-2.62c-.98.66-2.23 1.05-3.79 1.05-2.91 0-5.38-1.97-6.26-4.62H2.12v2.71C3.94 20.48 7.68 23 12 23z" fill="#34A853" />
                        <path d="M5.74 14.15c-.22-.66-.35-1.36-.35-2.15s.13-1.49.35-2.15V7.14H2.12C1.4 8.59 1 10.25 1 12s.4 3.41 1.12 4.86l3.62-2.71z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.07.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.68 1 3.94 3.52 2.12 7.14l3.62 2.71c.88-2.65 3.35-4.47 6.26-4.47z" fill="#EA4335" />
                      </svg>
                    </div>
                  </div>

                  <div className="space-y-3 text-left">
                    <div className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Production flow preview</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-slate-600">
                      Owners will use the live funnel to submit their own rating and feedback. This builder does not simulate, gate, or generate a review.
                    </p>
                    <a href={reviewDestinationUrl || '#'} target="_blank" rel="noreferrer" className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white">
                      Open configured review destination <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>

                {/* Bottom Brand Watermark */}
                <div className="relative z-10 pb-4 text-center">
                  <span className="text-[10px] text-stone-300 font-semibold tracking-wider uppercase drop-shadow-sm">
                    Powered by Pixora Funnel
                  </span>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Comprehensive Category Browser Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-[#5356EC] flex items-center justify-center">
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Select Business Category</h3>
                  <p className="text-xs text-slate-500">
                     {allCategories.length} industry-specific themes tailored for Google Maps review growth
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowCategoryModal(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Search Bar & Sector Filter */}
            <div className="p-4 sm:px-6 bg-slate-50 border-b border-slate-100 space-y-2.5">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by category, products, or keywords (e.g. clinic, pipe, hardware, mobile, cafe, salon)..."
                  value={categorySearchQuery}
                  onChange={(e) => setCategorySearchQuery(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-9 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#5356EC] focus:border-[#5356EC]"
                />
                {categorySearchQuery && (
                  <button
                    type="button"
                    onClick={() => setCategorySearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Modal Sector Filter Tabs */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
                {CATEGORY_SECTORS.map((sector) => {
                  const isSectorActive = activeSector === sector.id;
                  return (
                    <button
                      key={sector.id}
                      type="button"
                      onClick={() => setActiveSector(sector.id)}
                      className={`px-3 py-1 rounded-lg font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                        isSectorActive
                          ? 'bg-[#5356EC] text-white shadow-2xs'
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {sector.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Modal Categories Grid */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              {filteredCategories.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                  <p className="text-xs text-slate-500">No category matching &ldquo;{categorySearchQuery}&rdquo;</p>
                  <button
                    type="button"
                    onClick={() => {
                      setCategory(categorySearchQuery);
                      setShowCategoryModal(false);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-[#5356EC] text-white text-xs font-bold"
                  >
                    Use &ldquo;{categorySearchQuery}&rdquo; as custom category
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {filteredCategories.map((cat) => {
                    const Icon = getCategoryIcon(cat.id);
                    const isSelected = currentCategoryConfig.id === cat.id;

                    return (
                      <div
                        key={cat.id}
                        onClick={() => handleApplyCategory(cat)}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-2.5 ${
                          isSelected
                            ? 'bg-indigo-50/70 border-[#5356EC] ring-1 ring-[#5356EC] shadow-xs'
                            : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-white flex-shrink-0"
                              style={{ backgroundColor: cat.defaultPrimaryColor || '#5356EC' }}
                            >
                              <Icon className="w-4 h-4" />
                            </div>
                            <div>
                              <h4 className="font-bold text-slate-900 text-xs leading-tight">{cat.name}</h4>
                              <span className="text-[10px] text-slate-400 font-medium block">
                                {cat.theme}
                              </span>
                            </div>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-[#5356EC] flex-shrink-0 mt-0.5" />}
                        </div>

                        <p className="text-[11px] text-slate-500 leading-snug line-clamp-2">
                          {cat.description}
                        </p>

                        <div className="pt-1 border-t border-slate-100 flex items-center justify-between text-[10px]">
                          <span className="text-slate-400 font-mono">
                            {cat.menuEnabled ? 'Menu Enabled' : 'Catalogue Ready'}
                          </span>
                          <span className="font-bold text-[#5356EC]">
                            {isSelected ? 'Selected' : 'Click to Apply'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:px-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">
                Showing {filteredCategories.length} of {allCategories.length} categories
              </span>
              <button
                type="button"
                onClick={() => setShowCategoryModal(false)}
                className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold hover:bg-slate-100 cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
