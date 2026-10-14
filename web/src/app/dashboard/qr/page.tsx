'use client';

import { useState, useEffect } from 'react';
import {
  QrCode,
  Copy,
  ExternalLink,
  Download,
  Printer,
  Plus,
  Search,
  Edit2,
  Trash2,
  Check,
  Sparkles,
  X,
  ChevronDown,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { qrService, businessService, analyticsService, getCatalogTerminology } from '@/services';
import { QRCodeItem, Business } from '@/types';
import { cn, copyToClipboard } from '@/lib/utils';
import {
  PortalCard,
  PortalErrorState,
  PortalLoadingState,
  PortalPageHeader,
  PortalStatCard,
} from '@/components/client-portal/PortalUI';

const QR_TABS = ['Active QR Codes', 'Print Materials', 'Design & Customize'];
const COLORS = ['#2563EB', '#0B3D2E', '#D4AF37', '#1a1a1a', '#8B5CF6'];

export default function QRCodePage() {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedColor, setSelectedColor] = useState(0);
  const [ctaText, setCTAText] = useState('Scan to Rate & View Menu');
  const [qrs, setQrs] = useState<QRCodeItem[]>([]);
  const [activeBiz, setActiveBiz] = useState<Business | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [totalMenuViews, setTotalMenuViews] = useState(0);
  const [selectedQrId, setSelectedQrId] = useState<string | null>(null);

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [editingQr, setEditingQr] = useState<QRCodeItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editLocation, setEditLocation] = useState('');

  const [notification, setNotification] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      setLoadError(null);
      try {
        const biz = await businessService.getActiveBusiness();
        setActiveBiz(biz);
        const bizId = biz?.businessId || (await businessService.getActiveBusinessId());

        const [qrsData, analyticsData] = await Promise.all([
          qrService.getQRCodes(bizId, biz?.slug),
          analyticsService.getAnalytics(bizId),
        ]);

        setQrs(qrsData);
        setSelectedQrId(qrsData[0]?.qrId || null);
        setTotalMenuViews(analyticsData.menuViews);
      } catch (err) {
        console.error('Failed to load QR data:', err);
        setLoadError('QR touchpoints are temporarily unavailable.');
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [loadAttempt]);

  const totalScans = qrs.reduce((sum, q) => sum + (q.scans || 0), 0);
  const qrBaseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://funnel.pixoraautomations.com';
  const terminology = getCatalogTerminology(activeBiz?.category);
  const bizSlug = activeBiz?.slug || 'your-business';

  // Selected QR for Stand Preview
  const activePreviewQr = qrs.find((q) => q.qrId === selectedQrId) || qrs[0];
  const activePreviewTargetUrl = activePreviewQr
    ? `${qrBaseUrl}/f/${bizSlug}${
        activePreviewQr.location && activePreviewQr.location !== 'Main Entrance & Counter'
          ? `?loc=${encodeURIComponent(activePreviewQr.location)}`
          : ''
      }`
    : `${qrBaseUrl}/f/${bizSlug}`;

  const handleCopyLink = async (url: string, id?: string) => {
    const ok = await copyToClipboard(url);
    if (ok) {
      if (id) {
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2500);
      } else {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2500);
      }
    }
  };

  // Preset suggestions based on business category
  const isFoodCategory =
    terminology.isFood ||
    (activeBiz?.category &&
      /restaurant|cafe|bar|bakery|food|hotel|dining/i.test(activeBiz.category));

  const quickPresets = isFoodCategory
    ? [
        { name: 'Billing Counter', location: 'Checkout Desk' },
        { name: 'Table 1', location: 'Dining Area' },
        { name: 'Table 2', location: 'Dining Area' },
        { name: 'Takeaway Bags', location: 'Packaging Bag' },
        { name: 'Bar Counter', location: 'Bar Top' },
        { name: 'Outdoor Patio', location: 'Outdoor Seating' },
      ]
    : [
        { name: 'Billing Counter', location: 'Checkout Desk' },
        { name: 'Reception Desk', location: 'Front Lobby' },
        { name: 'Sales Office', location: 'Customer Consultation' },
        { name: 'Product Packaging', location: 'Delivery Box / Package' },
        { name: 'Storefront Window', location: 'Main Entrance Stand' },
        { name: 'Service Counter', location: 'Customer Helpdesk' },
      ];

  // Create QR Code
  const handleCreateSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!activeBiz) return;
    if (!newName.trim()) {
      alert('Please enter a name for the QR code.');
      return;
    }

    setIsSubmitting(true);
    try {
      const generated = await qrService.createQRCode(activeBiz.businessId, {
        name: newName.trim(),
        location: newLocation.trim() || newName.trim(),
        slug: activeBiz.slug,
      });

      setQrs((prev) => [...prev, generated]);
      setSelectedQrId(generated.qrId);
      setIsCreateModalOpen(false);
      setNewName('');
      setNewLocation('');
      showNotification(`Created QR Code "${generated.name}" successfully! 🎉`);
    } catch (err) {
      console.error(err);
      alert('Failed to generate QR code. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Rename / Edit QR Code
  const handleOpenEdit = (qr: QRCodeItem) => {
    setEditingQr(qr);
    setEditName(qr.name);
    setEditLocation(qr.location);
  };

  const handleEditSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!activeBiz || !editingQr) return;
    if (!editName.trim()) {
      alert('Please enter a name.');
      return;
    }

    setIsSubmitting(true);
    try {
      const updated = await qrService.updateQRCode(activeBiz.businessId, editingQr.qrId, {
        name: editName.trim(),
        location: editLocation.trim() || editName.trim(),
        slug: activeBiz.slug,
      });

      if (updated) {
        setQrs((prev) => prev.map((q) => (q.qrId === editingQr.qrId ? updated : q)));
      } else {
        setQrs((prev) =>
          prev.map((q) =>
            q.qrId === editingQr.qrId
              ? {
                  ...q,
                  name: editName.trim(),
                  location: editLocation.trim() || editName.trim(),
                }
              : q
          )
        );
      }
      setEditingQr(null);
      showNotification(`Updated QR Code "${editName.trim()}" successfully!`);
    } catch (err) {
      console.error(err);
      alert('Failed to update QR code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete QR Code
  const handleDeleteQR = async (qr: QRCodeItem) => {
    if (qrs.length <= 1) {
      alert('Your business must have at least one active default QR code.');
      return;
    }
    const confirmDelete = window.confirm(
      `Are you sure you want to remove the QR code "${qr.name}"?`
    );
    if (!confirmDelete || !activeBiz) return;

    try {
      await qrService.deleteQRCode(activeBiz.businessId, qr.qrId);
      setQrs((prev) => prev.filter((q) => q.qrId !== qr.qrId));
      if (selectedQrId === qr.qrId) {
        const remaining = qrs.filter((q) => q.qrId !== qr.qrId);
        setSelectedQrId(remaining[0]?.qrId || null);
      }
      showNotification(`QR Code "${qr.name}" removed.`);
    } catch (err) {
      console.error(err);
      alert('Failed to delete QR code.');
    }
  };

  const filteredQRs = qrs.filter(
    (q) =>
      q.name.toLowerCase().includes(search.toLowerCase()) ||
      q.location.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return <PortalLoadingState label="Loading QR touchpoints" />;
  }

  if (loadError) {
    return <PortalErrorState description={loadError} onRetry={() => setLoadAttempt((attempt) => attempt + 1)} />;
  }

  return (
    <div className="space-y-5 pb-10">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-5 right-5 z-50 bg-gray-900 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 border border-gray-700 animate-in fade-in slide-in-from-top-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{notification}</span>
        </div>
      )}

      <PortalPageHeader
        eyebrow="Customer touchpoints"
        title="QR Codes"
        description={`Manage live QR touchpoints, print materials, and ${terminology.isFood ? 'menu' : 'catalogue'} routing for your business.`}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<QrCode className="w-5 h-5 text-gray-700" />}
          bg="bg-gray-100"
          value={totalScans.toLocaleString()}
          title="Total QR Scans"
          sub="Customer scans"
        />
        <StatCard
          icon={<EyeIcon />}
          bg="bg-rose-50"
          value={totalMenuViews.toLocaleString()}
          title={terminology.viewsMetricLabel}
          sub={terminology.isFood ? 'Diners who opened menu' : 'Visitors who viewed catalogue'}
        />
        <StatCard
          icon={<LinkIcon />}
          bg="bg-blue-50"
          value={qrs.length.toString()}
          title="Active QR Touchpoints"
          sub="Provisioned touchpoints"
        />
        <StatCard
          icon={<Check className="w-5 h-5 text-emerald-600" />}
          bg="bg-green-50"
          value={totalScans > 0 ? `${Math.min(100, Math.round((totalMenuViews / totalScans) * 100))}%` : '0%'}
          title="Scan Conversion"
          sub="View conversion rate"
        />
      </div>

      {/* Tabs & Generate Action */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200">
        <div className="flex items-center gap-1">
          {QR_TABS.map((tab, i) => (
            <button
              key={i}
              onClick={() => setActiveTab(i)}
              className={cn(
                'px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-colors cursor-pointer',
                activeTab === i
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        <button
          onClick={() => {
            setNewName('');
            setNewLocation('');
            setIsCreateModalOpen(true);
          }}
          className="flex items-center gap-2 text-white text-xs sm:text-sm font-semibold px-4 py-2 rounded-xl mb-1 bg-blue-600 hover:bg-blue-700 transition cursor-pointer shadow-xs"
        >
          <Plus className="w-4 h-4" /> Generate New QR Code
        </button>
      </div>

      {/* TAB 0: ACTIVE QR CODES */}
      {activeTab === 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left: Live QR Stand Preview */}
          <div className="lg:col-span-5">
            <PortalCard className="p-5">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">Live QR Stand Preview</h3>
                  <p className="text-[11px] text-gray-400">
                    Scan to test live customer review funnel & {terminology.isFood ? 'menu' : 'catalogue'}
                  </p>
                </div>
                <span className="flex items-center gap-1 text-[11px] font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full" /> Active
                </span>
              </div>

              {/* Selector when multiple QR codes exist */}
              {qrs.length > 1 && (
                <div className="mb-3.5 bg-gray-50 border border-gray-200/80 rounded-xl p-2.5">
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                    Select Placement to Preview:
                  </label>
                  <div className="relative">
                    <select
                      value={selectedQrId || ''}
                      onChange={(e) => setSelectedQrId(e.target.value)}
                      className="w-full bg-white border border-gray-200 text-gray-900 text-xs font-semibold rounded-lg px-3 py-1.5 pr-8 appearance-none focus:outline-none focus:ring-1 focus:ring-blue-600 cursor-pointer"
                    >
                      {qrs.map((q) => (
                        <option key={q.qrId} value={q.qrId}>
                          {q.name} ({q.location})
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              )}

              {/* QR Stand Display */}
              <div
                className="w-full rounded-2xl flex flex-col items-center justify-center p-6 mb-4"
                style={{
                  background: 'linear-gradient(135deg, #FDFBF7 0%, #f0ece4 100%)',
                  border: '1px solid #e8e0d0',
                }}
              >
                <div className="relative w-full max-w-[200px] aspect-square bg-white rounded-2xl shadow-sm p-4 flex flex-col items-center justify-center border border-gray-100">
                  {/* Generated QR visual - Locked to high-contrast pure black for 100% scan reliability */}
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
                      activePreviewTargetUrl
                    )}&color=000000&bgcolor=FFFFFF`}
                    alt="Pixora QR Code"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="mt-3 text-center">
                  <p
                    className="font-bold text-base text-gray-900"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    {activeBiz?.name || 'Your Business'}
                  </p>
                  <p className="text-[10px] tracking-widest text-[#D4AF37] uppercase font-semibold">
                    {activePreviewQr?.name || activeBiz?.category || 'Local Business'}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{activePreviewQr?.location}</p>
                </div>
                <a
                  href={activePreviewTargetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 w-full flex items-center justify-center gap-2 text-white text-xs font-bold py-2.5 rounded-xl transition-opacity hover:opacity-95 shadow-xs"
                  style={{ background: COLORS[selectedColor] }}
                >
                  <QrCode className="w-4 h-4" /> {ctaText}
                </a>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <a
                  href={`https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&data=${encodeURIComponent(
                    activePreviewTargetUrl
                  )}&color=000000&bgcolor=FFFFFF&download=1`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-1.5 text-white text-xs font-semibold py-2.5 rounded-xl cursor-pointer bg-blue-600 hover:bg-blue-700 transition shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" /> Download QR
                </a>
                <button
                  className="flex items-center justify-center gap-1.5 text-gray-700 text-xs font-semibold py-2.5 px-3 rounded-xl border border-gray-200 hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleCopyLink(activePreviewTargetUrl)}
                >
                  <Copy className="w-3.5 h-3.5" /> {copiedLink ? 'Copied! ✅' : 'Copy Link'}
                </button>
              </div>
            </PortalCard>
          </div>

          {/* Right: Touchpoints & Options */}
          <div className="lg:col-span-7 space-y-4">
            <PortalCard className="space-y-4 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">QR Code Placement Strategy</h3>
                  <p className="text-[11px] text-gray-400">
                    Place unique QR codes across your establishment to see where your customers scan the most.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setNewName('');
                    setNewLocation('');
                    setIsCreateModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Touchpoint
                </button>
              </div>

              {/* Quick Preset Generator Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                {quickPresets.slice(0, 6).map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setNewName(preset.name);
                      setNewLocation(preset.location);
                      setIsCreateModalOpen(true);
                    }}
                    className="p-3 text-left border border-gray-100 rounded-xl hover:border-blue-400 hover:bg-blue-50/30 transition group cursor-pointer bg-gray-50/50"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-gray-800 group-hover:text-blue-600">
                        {preset.name}
                      </span>
                      <Plus className="w-3.5 h-3.5 text-gray-400 group-hover:text-blue-600 transition" />
                    </div>
                    <span className="text-[10px] text-gray-400 block">{preset.location}</span>
                  </button>
                ))}
              </div>

              {/* Hardware Stands Promotion */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/60 flex items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 mb-0.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>Order Physical Acrylic NFC &amp; QR Stands</span>
                  </div>
                  <p className="text-[11px] text-amber-800/80">
                    Get premium acrylic table stands with embedded high-speed NFC chips delivered directly to your doorstep.
                  </p>
                </div>
                <a
                  href="/products"
                  className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold whitespace-nowrap hover:bg-blue-700 transition"
                >
                  View Stands →
                </a>
              </div>
            </PortalCard>
          </div>
        </div>
      )}

      {/* TAB 1: PRINT MATERIALS */}
      {activeTab === 1 && (
        <PortalCard className="space-y-6 p-6">
          <div>
            <h3 className="font-bold text-gray-900 text-sm">Printable QR Stand &amp; Sticker Templates</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              High-resolution templates optimized for standard printers and print shops (A5, A6, Tent Cards).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Table Tent Card */}
            <div className="border border-gray-200 rounded-2xl p-4 flex flex-col justify-between hover:shadow-md transition">
              <div>
                <div className="w-full aspect-[4/3] bg-amber-50 rounded-xl border border-amber-100 flex flex-col items-center justify-center p-4 mb-3">
                  <div className="w-20 h-20 bg-white rounded-lg p-1.5 shadow-xs mb-2">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
                        activePreviewTargetUrl
                      )}&color=000000&bgcolor=FFFFFF`}
                      alt="QR"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <p className="text-xs font-bold text-gray-900">{activeBiz?.name}</p>
                  <p className="text-[9px] text-amber-800 font-medium">Table Tent Stand (A6)</p>
                </div>
                <h4 className="font-bold text-xs text-gray-900">Table Tent Stand (A6)</h4>
                <p className="text-[11px] text-gray-400 mt-0.5">Perfect for restaurant dining tables, waiting lounges, and counters.</p>
              </div>
              <a
                href={`https://api.qrserver.com/v1/create-qr-code/?size=1200x1200&data=${encodeURIComponent(
                  activePreviewTargetUrl
                )}&color=000000&bgcolor=FFFFFF&download=1`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition"
              >
                <Download className="w-3.5 h-3.5" /> Download Print PNG
              </a>
            </div>

            {/* Window & Door Sticker */}
            <div className="border border-gray-200 rounded-2xl p-4 flex flex-col justify-between hover:shadow-md transition">
              <div>
                <div className="w-full aspect-[4/3] bg-blue-50 rounded-xl border border-blue-100 flex flex-col items-center justify-center p-4 mb-3">
                  <div className="w-20 h-20 bg-white rounded-lg p-1.5 shadow-xs mb-2">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
                        activePreviewTargetUrl
                      )}&color=000000&bgcolor=FFFFFF`}
                      alt="QR"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <p className="text-xs font-bold text-gray-900">Scan as You Leave</p>
                  <p className="text-[9px] text-blue-700 font-medium">Window / Door Sticker</p>
                </div>
                <h4 className="font-bold text-xs text-gray-900">Entrance &amp; Window Sticker</h4>
                <p className="text-[11px] text-gray-400 mt-0.5">Captures customer reviews right as guests exit your store or cafe.</p>
              </div>
              <a
                href={`https://api.qrserver.com/v1/create-qr-code/?size=1200x1200&data=${encodeURIComponent(
                  activePreviewTargetUrl
                )}&color=000000&bgcolor=FFFFFF&download=1`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition"
              >
                <Download className="w-3.5 h-3.5" /> Download Sticker Asset
              </a>
            </div>

            {/* Billing Counter Acrylic Insert */}
            <div className="border border-gray-200 rounded-2xl p-4 flex flex-col justify-between hover:shadow-md transition">
              <div>
                <div className="w-full aspect-[4/3] bg-emerald-50 rounded-xl border border-emerald-100 flex flex-col items-center justify-center p-4 mb-3">
                  <div className="w-20 h-20 bg-white rounded-lg p-1.5 shadow-xs mb-2">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
                        activePreviewTargetUrl
                      )}&color=000000&bgcolor=FFFFFF`}
                      alt="QR"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <p className="text-xs font-bold text-gray-900">Checkout Review Stand</p>
                  <p className="text-[9px] text-emerald-700 font-medium">Counter Stand (A5)</p>
                </div>
                <h4 className="font-bold text-xs text-gray-900">Billing Counter Stand (A5)</h4>
                <p className="text-[11px] text-gray-400 mt-0.5">Positioned at cash register where diners &amp; shoppers wait for payment.</p>
              </div>
              <a
                href={`https://api.qrserver.com/v1/create-qr-code/?size=1200x1200&data=${encodeURIComponent(
                  activePreviewTargetUrl
                )}&color=000000&bgcolor=FFFFFF&download=1`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition"
              >
                <Download className="w-3.5 h-3.5" /> Download Counter Stand
              </a>
            </div>
          </div>
        </PortalCard>
      )}

      {/* TAB 2: DESIGN & CUSTOMIZE */}
      {activeTab === 2 && (
        <PortalCard className="space-y-6 p-6">
          <div>
            <h3 className="font-bold text-gray-900 text-sm">Customize QR Display &amp; Branding</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Personalize colors and call-to-actions to match your business theme.
            </p>
          </div>

          <div className="max-w-xl space-y-5">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">
                Brand Accent Color
              </label>
              <div className="flex gap-3">
                {COLORS.map((color, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedColor(i)}
                    className={cn(
                      'w-10 h-10 rounded-full border-2 transition-all cursor-pointer',
                      selectedColor === i
                        ? 'border-gray-900 scale-110 shadow-sm ring-2 ring-gray-900/10'
                        : 'border-transparent'
                    )}
                    style={{ background: color }}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Display Call To Action (Button Banner)
              </label>
              <input
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                value={ctaText}
                onChange={(e) => setCTAText(e.target.value)}
                maxLength={50}
                placeholder="Scan to Rate & View Menu"
              />
              <p className="text-[11px] text-gray-400 mt-1">
                Note: QR code patterns remain locked to high-contrast pure black (#000000) for 100% camera scanning accuracy across all mobile devices.
              </p>
            </div>
          </div>
        </PortalCard>
      )}

      {/* ALL QR CODES TABLE */}
      <PortalCard className="overflow-hidden">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-5 border-b border-gray-100 gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-gray-900 text-sm">All QR Codes ({qrs.length})</h3>
              <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                {qrs.length === 1 ? '1 Default Active' : `${qrs.length} Active Touchpoints`}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              Manage, rename, and generate location-specific QR codes for your business
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-xs outline-none focus:ring-1 focus:ring-blue-600 w-full sm:w-48"
                placeholder="Filter QR codes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <button
              onClick={() => {
                setNewName('');
                setNewLocation('');
                setIsCreateModalOpen(true);
              }}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-2 rounded-xl transition cursor-pointer whitespace-nowrap shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" /> Add New
            </button>
          </div>
        </div>

        {filteredQRs.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-xs">
            No QR codes found matching "{search}".
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50 border-b border-gray-100 text-gray-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Name / Placement</th>
                  <th className="px-5 py-3 font-semibold">Location</th>
                  <th className="px-5 py-3 font-semibold">Target Link</th>
                  <th className="px-5 py-3 font-semibold">Total Scans</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredQRs.map((qr, index) => {
                  const targetUrl = `${qrBaseUrl}/f/${bizSlug}${
                    qr.location && qr.location !== 'Main Entrance & Counter'
                      ? `?loc=${encodeURIComponent(qr.location)}`
                      : ''
                  }`;

                  const isDefaultPrimary = index === 0;

                  return (
                    <tr key={qr.qrId} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3.5 font-semibold text-gray-900">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-gray-700">
                            <QrCode className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-gray-900">{qr.name}</span>
                              {isDefaultPrimary && (
                                <span className="text-[10px] bg-amber-50 text-amber-800 font-bold px-1.5 py-0.2 rounded border border-amber-200/60">
                                  Default
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-gray-400 block">ID: {qr.qrId}</span>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-3.5 text-gray-600 font-medium">
                        <span className="bg-gray-100 px-2.5 py-1 rounded-md text-[11px] text-gray-700">
                          {qr.location}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 text-blue-600">
                        <a
                          href={targetUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline flex items-center gap-1"
                        >
                          <span className="truncate max-w-[160px]">/f/{bizSlug}</span>
                          <ExternalLink className="w-3 h-3 flex-shrink-0" />
                        </a>
                      </td>

                      <td className="px-5 py-3.5 font-bold text-gray-900">{qr.scans || 0}</td>

                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/50">
                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                          Active
                        </span>
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Copy Link Button */}
                          <button
                            onClick={() => handleCopyLink(targetUrl, qr.qrId)}
                            className={cn(
                              'text-xs px-2.5 py-1 rounded-lg transition-colors cursor-pointer font-medium border',
                              copiedId === qr.qrId
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold'
                                : 'text-gray-600 hover:text-blue-600 bg-white border-gray-200 hover:bg-gray-50'
                            )}
                            title="Copy Direct Link"
                          >
                            {copiedId === qr.qrId ? 'Copied! ✅' : 'Copy'}
                          </button>

                          {/* Rename / Edit Button */}
                          <button
                            onClick={() => handleOpenEdit(qr)}
                            className="text-xs px-2.5 py-1 rounded-lg text-gray-700 hover:text-blue-600 bg-white border border-gray-200 hover:bg-gray-50 transition cursor-pointer font-medium flex items-center gap-1"
                            title="Rename QR Code"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>Rename</span>
                          </button>

                          {/* Direct High-Res Download */}
                          <a
                            href={`https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&data=${encodeURIComponent(
                              targetUrl
                            )}&color=000000&bgcolor=FFFFFF&download=1`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs p-1.5 rounded-lg text-gray-600 hover:text-blue-600 bg-white border border-gray-200 hover:bg-gray-50 transition"
                            title="Download PNG"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>

                          {/* Delete Button (Allowed if more than 1 QR code exists) */}
                          {qrs.length > 1 && (
                            <button
                              onClick={() => handleDeleteQR(qr)}
                              className="text-xs p-1.5 rounded-lg text-gray-400 hover:text-rose-600 bg-white border border-gray-200 hover:bg-rose-50 hover:border-rose-200 transition cursor-pointer"
                              title="Delete QR code"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </PortalCard>

      {/* MODAL 1: GENERATE NEW QR CODE */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <QrCode className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">Generate New QR Code</h3>
                  <p className="text-[11px] text-gray-400">Create a new touchpoint for your business</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Suggestion Chips */}
            <div>
              <label className="block text-[11px] font-semibold text-gray-600 mb-1.5">
                Quick Category Suggestions:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {quickPresets.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setNewName(preset.name);
                      setNewLocation(preset.location);
                    }}
                    className={cn(
                      'text-[11px] px-2.5 py-1 rounded-lg border transition font-medium cursor-pointer',
                      newName === preset.name
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-blue-400 hover:bg-blue-50/50'
                    )}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  QR Code Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Billing Counter, Table 4, Takeaway Bags"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2 text-xs text-gray-900 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Location / Placement Description
                </label>
                <input
                  type="text"
                  placeholder="e.g. Checkout Desk, Table Tops, Delivery Boxes"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2 text-xs text-gray-900 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                />
              </div>

              {/* Encoded Link Preview */}
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-200/70 text-[11px]">
                <span className="text-gray-500 font-semibold block mb-0.5">Target Destination Link:</span>
                <span className="font-mono text-blue-600 break-all">
                  {qrBaseUrl}/f/{bizSlug}
                  {newLocation ? `?loc=${encodeURIComponent(newLocation)}` : ''}
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-800 rounded-xl hover:bg-gray-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !newName.trim()}
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl transition cursor-pointer shadow-xs"
                >
                  {isSubmitting ? 'Generating...' : 'Generate QR Code'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: RENAME / EDIT QR CODE */}
      {editingQr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">Rename QR Code</h3>
                  <p className="text-[11px] text-gray-400">Update the name and location for this touchpoint</p>
                </div>
              </div>
              <button
                onClick={() => setEditingQr(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  QR Code Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2 text-xs text-gray-900 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Placement / Location
                </label>
                <input
                  type="text"
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2 text-xs text-gray-900 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingQr(null)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-800 rounded-xl hover:bg-gray-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !editName.trim()}
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl transition cursor-pointer shadow-xs"
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, bg, value, title, sub }: any) {
  return <PortalStatCard icon={icon} iconBackground={bg} value={value} title={title} description={sub} />;
}

const EyeIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 text-rose-400" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const LinkIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
);
