'use client';

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import {
  Star,
  Upload,
  FileText,
  Database,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  Copy,
  Trash2,
  Download,
  Filter,
  Sparkles,
  ShoppingBag,
  Flame,
  Building,
  Home,
  Utensils,
  Coffee,
  Scissors,
  Activity,
  Layers,
  RefreshCw,
} from 'lucide-react';
import { MASSIVE_CATEGORY_REVIEWS } from '@/data/categoryReviews';

interface CustomTemplate {
  id: string;
  category: string;
  fragment_type: string;
  content: string;
  created_at: string;
}

interface LiveReview {
  id: string;
  business_id: string;
  reviewer_name?: string;
  rating: number;
  review_text: string;
  created_at?: string;
  review_time?: string;
  sentiment?: string;
}

export default function AdminReviewsPage() {
  const [activeTab, setActiveTab] = useState<'library' | 'monitoring'>('library');

  // Stats & Database Templates
  const [loading, setLoading] = useState(true);
  const [customTemplates, setCustomTemplates] = useState<CustomTemplate[]>([]);
  const [liveReviews, setLiveReviews] = useState<LiveReview[]>([]);
  const [categoryStats, setCategoryStats] = useState<Record<string, number>>({});

  // Filter & Search
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Upload Modal / Form State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadMode, setUploadMode] = useState<'text' | 'sql'>('text');
  const [uploadCategory, setUploadCategory] = useState('Clothes Stores');
  const [customCategoryInput, setCustomCategoryInput] = useState('');
  const [textContent, setTextContent] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Copied indicator
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchLibraryData = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers = { Authorization: session ? `Bearer ${session.access_token}` : '' };

      const res = await fetch('/api/admin/reviews/library', { headers });
      const data = await res.json();
      if (data.success) {
        setCustomTemplates(data.customTemplates || []);
        setCategoryStats(data.categoryStats || {});
      }

      // Also fetch live customer reviews
      const { data: reviewsData } = await supabase
        .from('google_reviews')
        .select('*')
        .order('review_time', { ascending: false })
        .limit(50);
      setLiveReviews(reviewsData || []);
    } catch (err) {
      console.error('Failed to load library:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLibraryData();
  }, []);

  // Built-in reviews transformed into displayable items
  const allBuiltInReviews: Array<{ id: string; category: string; content: string; isBuiltIn: boolean }> = [];
  for (const key of Object.keys(MASSIVE_CATEGORY_REVIEWS)) {
    const item = MASSIVE_CATEGORY_REVIEWS[key];
    item.reviews.forEach((r, idx) => {
      allBuiltInReviews.push({
        id: `builtin_${key}_${idx}`,
        category: item.category,
        content: r.replace(/{biz}/g, 'Your Business'),
        isBuiltIn: true,
      });
    });
  }

  // Combined review items
  const allDisplayReviews: Array<{ id: string; category: string; content: string; isBuiltIn: boolean }> = [
    ...customTemplates.map((t) => ({
      id: t.id,
      category: t.category,
      content: t.content,
      isBuiltIn: false,
    })),
    ...allBuiltInReviews,
  ];

  // Filtering
  const filteredReviews = allDisplayReviews.filter((item) => {
    const matchesCategory =
      selectedCategory === 'all' ||
      item.category.toLowerCase() === selectedCategory.toLowerCase() ||
      (selectedCategory === 'custom' && !item.isBuiltIn);

    const matchesSearch =
      !searchQuery ||
      item.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  // Handle File Upload Read
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setTextContent(content || '');
      if (file.name.endsWith('.sql')) {
        setUploadMode('sql');
      } else {
        setUploadMode('text');
      }
    };
    reader.readAsText(file);
  };

  // Submit Upload
  const handleExecuteUpload = async () => {
    if (!textContent.trim()) {
      setUploadError('Please provide text or SQL content to upload.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    const targetCategory = uploadCategory === 'Other / Custom' ? customCategoryInput.trim() || 'General Business' : uploadCategory;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/admin/reviews/library', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: session ? `Bearer ${session.access_token}` : '',
        },
        body: JSON.stringify({
          mode: uploadMode,
          content: textContent,
          category: targetCategory,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        setUploadError(data.error || 'Failed to upload reviews');
      } else {
        setUploadSuccess(data.message || `Successfully added ${data.count} reviews!`);
        setTextContent('');
        if (fileInputRef.current) fileInputRef.current.value = '';
        fetchLibraryData();
        setTimeout(() => {
          setShowUploadModal(false);
          setUploadSuccess(null);
        }, 1800);
      }
    } catch (err: any) {
      setUploadError(err.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  // Delete Custom Review
  const handleDeleteCustomReview = async (id: string) => {
    if (!confirm('Are you sure you want to remove this review from the library?')) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`/api/admin/reviews/library?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: { Authorization: session ? `Bearer ${session.access_token}` : '' },
      });
      const data = await res.json();
      if (data.success) {
        setCustomTemplates((prev) => prev.filter((t) => t.id !== id));
      } else {
        alert(data.error || 'Failed to delete');
      }
    } catch (e: any) {
      alert(e.message || 'Error deleting review');
    }
  };

  // Copy Review Text
  const handleCopyReview = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Export full SQL migration
  const handleExportSql = () => {
    const rows = allDisplayReviews.map((r) => {
      const cat = r.category.replace(/'/g, "''");
      const txt = r.content.replace(/'/g, "''");
      return `  ('${cat}', 'body', '${txt}')`;
    });
    const sql = `-- Pixora Massive Review Library Export (${new Date().toISOString()})\nINSERT INTO public.review_category_templates (category, fragment_type, content)\nVALUES\n${rows.join(',\n')}\nON CONFLICT DO NOTHING;\n`;
    const blob = new Blob([sql], { type: 'text/sql' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pixora_review_library_${Date.now()}.sql`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export Text
  const handleExportText = () => {
    const text = allDisplayReviews.map((r) => `${r.category} | ${r.content}`).join('\n\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pixora_review_library_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Load Sample helper
  const handleLoadSample = () => {
    if (uploadMode === 'sql') {
      setTextContent(`-- Sample SQL Review Inserts
INSERT INTO public.review_category_templates (category, fragment_type, content)
VALUES
  ('Clothes Stores', 'body', 'The fabric quality is exceptionally soft and premium. Fits like custom bespoke tailoring!'),
  ('Perfume Stores', 'body', 'Long-lasting projection that stays fresh on clothes for over 12 hours. Pure luxury in every spray.'),
  ('Offices', 'body', 'Pristine professional workspace with blazing-fast fiber internet and serene meeting booths.'),
  ('Real Estates', 'body', 'Completely transparent advisory with verified title deeds and smooth registry assistance.');
`);
    } else {
      setTextContent(`Outstanding collection with high-grade breathable fabrics and pristine trial rooms.
Polite and knowledgeable sales staff that helped me choose the perfect formal blazer.
The fit was impeccable right off the rack with zero need for alterations.
Exceptional durability even after multiple washes. Worth every single rupee!`);
    }
  };

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Header & Action Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold font-serif text-slate-900 tracking-tight">Review Library &amp; Monitoring</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-[#5356EC] border border-indigo-100">
              {allDisplayReviews.length} Ready Reviews
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage the AI review generator presets, upload batch reviews via Text/SQL, and monitor live customer sentiment.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={fetchLibraryData}
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 cursor-pointer shadow-xs"
            title="Refresh Library"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={handleExportSql}
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
            title="Export full library as SQL migration"
          >
            <Database className="w-3.5 h-3.5 text-blue-600" />
            <span>Export SQL</span>
          </button>

          <button
            type="button"
            onClick={handleExportText}
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
            title="Export as Text file"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>Export TXT</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setShowUploadModal(true);
              setUploadError(null);
              setUploadSuccess(null);
            }}
            className="px-4 py-2 rounded-xl bg-[#5356EC] hover:bg-[#4346DB] text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-sm transition-all"
          >
            <Upload className="w-4 h-4 stroke-[2.5]" />
            <span>Upload Reviews (Text / SQL)</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('library')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'library'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-4 h-4 text-emerald-400" />
          <span>Massive Review Library ({allDisplayReviews.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('monitoring')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'monitoring'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
          <span>Live Customer Feedback ({liveReviews.length})</span>
        </button>
      </div>

      {activeTab === 'library' ? (
        <>
          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider">Total Library Items</span>
                <Sparkles className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-2xl font-bold text-slate-900 font-mono">{allDisplayReviews.length}</div>
              <p className="text-[10px] text-slate-400 mt-0.5">Pre-written 5★ templates</p>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider">Clothes &amp; Perfumes</span>
                <ShoppingBag className="w-4 h-4 text-rose-500" />
              </div>
              <div className="text-2xl font-bold text-slate-900 font-mono">
                {(categoryStats['Clothes Stores'] || 0) + (categoryStats['Perfume Stores'] || 0) || 44}
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">Retail, fabrics &amp; scents</p>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider">Offices &amp; Real Estate</span>
                <Building className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-2xl font-bold text-slate-900 font-mono">
                {(categoryStats['Offices'] || 0) + (categoryStats['Real Estates'] || 0) || 30}
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">Corporate &amp; properties</p>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider">Combinator Variations</span>
                <Activity className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-bold text-emerald-600 font-mono">64,000+</div>
              <p className="text-[10px] text-slate-400 mt-0.5">Unique blends per tenant</p>
            </div>
          </div>

          {/* Category Filter Pills & Search */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 custom-scrollbar">
                {[
                  { id: 'all', label: 'All Reviews', icon: Layers },
                  { id: 'Clothes Stores', label: 'Clothes Stores', icon: ShoppingBag },
                  { id: 'Perfume Stores', label: 'Perfume Stores', icon: Flame },
                  { id: 'Offices', label: 'Offices & Coworking', icon: Building },
                  { id: 'Real Estates', label: 'Real Estate', icon: Home },
                  { id: 'Restaurants & Dining', label: 'Dining', icon: Utensils },
                  { id: 'Cafes & Bakeries', label: 'Cafes', icon: Coffee },
                  { id: 'Salons & Wellness', label: 'Salons', icon: Scissors },
                  { id: 'custom', label: 'Custom Uploaded', icon: Database },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isSelected = selectedCategory.toLowerCase() === tab.id.toLowerCase();
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setSelectedCategory(tab.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-all ${
                        isSelected
                          ? 'bg-[#5356EC] text-white shadow-xs'
                          : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Search Box */}
              <div className="relative w-full sm:w-64 flex-shrink-0">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search reviews by keyword..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#5356EC] focus:border-[#5356EC]"
                />
              </div>
            </div>
          </div>

          {/* Reviews Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold px-1">
              <span>Showing {filteredReviews.length} pre-written review templates</span>
              <span>Available on Step 2 of customer funnel</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredReviews.map((item) => (
                <div
                  key={item.id}
                  className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all group relative"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold tracking-wide uppercase bg-slate-100 text-slate-700 border border-slate-200">
                        {item.category}
                      </span>
                      <div className="flex items-center text-amber-400 gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} className="w-3 h-3 fill-amber-400" />
                        ))}
                      </div>
                    </div>

                    <p className="text-xs text-slate-800 leading-relaxed font-sans font-normal">
                      &ldquo;{item.content}&rdquo;
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-3 text-[11px] text-slate-400">
                    <span className="text-[10px] font-medium">
                      {item.isBuiltIn ? 'Core Library' : 'Custom Uploaded'} • {item.content.length} chars
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleCopyReview(item.id, item.content)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 cursor-pointer transition-colors"
                        title="Copy Review Text"
                      >
                        {copiedId === item.id ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {!item.isBuiltIn && (
                        <button
                          type="button"
                          onClick={() => handleDeleteCustomReview(item.id)}
                          className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 cursor-pointer transition-colors"
                          title="Delete Custom Review"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredReviews.length === 0 && (
              <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-8 space-y-3">
                <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
                <h3 className="font-bold text-sm text-slate-900">No reviews found</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Try adjusting your search query or upload new reviews for this category using the button above.
                </p>
              </div>
            )}
          </div>
        </>
      ) : (
        /* Live Customer Reviews Monitoring */
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Customer Feedback Stream</h3>
              <p className="text-xs text-slate-500">Reviews submitted by real customers across all active funnels.</p>
            </div>
            <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
              {liveReviews.length} Recorded
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {liveReviews.map((rev) => (
              <div key={rev.id} className="py-4 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900">{rev.reviewer_name || 'Anonymous Customer'}</span>
                    <div className="flex items-center text-amber-400">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-3 h-3 ${s <= (rev.rating || 5) ? 'fill-amber-400' : 'text-slate-200'}`}
                        />
                      ))}
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {rev.review_time ? new Date(rev.review_time).toLocaleDateString() : 'Recent'}
                  </span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed font-sans">&ldquo;{rev.review_text}&rdquo;</p>
              </div>
            ))}

            {liveReviews.length === 0 && (
              <div className="text-center py-12 text-slate-400 text-xs">
                No customer reviews submitted yet. They will appear here in real-time as users complete the review funnel.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl p-6 sm:p-7 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-[#5356EC] flex items-center justify-center font-bold">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Upload Reviews to Library</h3>
                  <p className="text-[11px] text-slate-500">Add reviews via plain text or executable SQL script.</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {uploadError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            {uploadSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{uploadSuccess}</span>
              </div>
            )}

            {/* Mode Toggle */}
            <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setUploadMode('text')}
                className={`py-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  uploadMode === 'text' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Simple Text / TXT File</span>
              </button>

              <button
                type="button"
                onClick={() => setUploadMode('sql')}
                className={`py-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  uploadMode === 'sql' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Database className="w-3.5 h-3.5" />
                <span>SQL Statements / .SQL File</span>
              </button>
            </div>

            {/* Form Fields */}
            <div className="space-y-4 text-xs">
              {uploadMode === 'text' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Target Category</label>
                    <select
                      value={uploadCategory}
                      onChange={(e) => setUploadCategory(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#5356EC]"
                    >
                      <option value="Clothes Stores">Clothes Stores (Fashion &amp; Apparel)</option>
                      <option value="Perfume Stores">Perfume Stores (Fragrances &amp; Attar)</option>
                      <option value="Offices">Offices (Corporate &amp; Coworking)</option>
                      <option value="Real Estates">Real Estates &amp; Properties</option>
                      <option value="Restaurants &amp; Dining">Restaurants &amp; Dining</option>
                      <option value="Cafes &amp; Bakeries">Cafes &amp; Bakeries</option>
                      <option value="Salons &amp; Wellness">Salons &amp; Spas</option>
                      <option value="Healthcare &amp; Clinics">Healthcare &amp; Clinics</option>
                      <option value="Fitness &amp; Gyms">Fitness &amp; Gyms</option>
                      <option value="Other / Custom">Other / Custom Category</option>
                    </select>
                  </div>

                  {uploadCategory === 'Other / Custom' && (
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700">Custom Category Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Jewellery Stores"
                        value={customCategoryInput}
                        onChange={(e) => setCustomCategoryInput(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#5356EC]"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* File Upload Selector */}
              <div className="flex items-center justify-between p-3 rounded-xl border border-dashed border-slate-300 bg-slate-50">
                <div className="flex items-center gap-2">
                  <Upload className="w-4 h-4 text-slate-500" />
                  <span className="text-slate-600 font-medium text-[11px]">
                    Upload {uploadMode === 'sql' ? '.sql file' : '.txt or .csv file'}
                  </span>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={uploadMode === 'sql' ? '.sql,.txt' : '.txt,.csv,.json'}
                  onChange={handleFileUpload}
                  className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[11px] file:font-semibold file:bg-[#5356EC] file:text-white cursor-pointer"
                />
              </div>

              {/* Text Area */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-700">
                    {uploadMode === 'sql' ? 'SQL Insert Content' : 'Review Text (One review per line)'}
                  </label>
                  <button
                    type="button"
                    onClick={handleLoadSample}
                    className="text-[11px] font-bold text-[#5356EC] hover:underline cursor-pointer"
                  >
                    Paste Starter Sample
                  </button>
                </div>
                <textarea
                  rows={7}
                  placeholder={
                    uploadMode === 'sql'
                      ? "INSERT INTO public.review_category_templates (category, fragment_type, content)\nVALUES\n  ('Clothes Stores', 'body', 'The fabric quality is outstanding!'),\n  ('Perfume Stores', 'body', 'Long lasting oud fragrance with great sillage.');"
                      : "Type or paste reviews here, one per line:\nOutstanding clothing collection with spotless trial rooms.\nSuper polite assistants that gave great fashion advice.\nFabric feels breathable and washes remarkably well."
                  }
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-3 text-slate-900 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-[#5356EC]"
                />
                <p className="text-[10px] text-slate-400">
                  {uploadMode === 'sql'
                    ? 'Tip: You can paste any INSERT INTO statements; quotes will be sanitized automatically.'
                    : 'Tip: You can also format lines as "Category | Review Text" to upload multiple categories at once.'}
                </p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isUploading || !textContent.trim()}
                onClick={handleExecuteUpload}
                className="px-5 py-2 rounded-xl bg-[#5356EC] hover:bg-[#4346DB] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-sm"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{isUploading ? 'Uploading to Library…' : 'Upload to Library'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
