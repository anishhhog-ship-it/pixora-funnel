'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { 
  Search, 
  ChevronLeft, 
  Bookmark, 
  Heart, 
  Flame, 
  Leaf, 
  Star, 
  UtensilsCrossed, 
  Check, 
  Share2, 
  PlusSquare, 
  Smartphone, 
  Download, 
  X,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { businessService, menuService, analyticsService, getCatalogTerminology } from '@/services';
import { Business, MenuCategory, MenuItem } from '@/types';

export default function CustomerMenuPage() {
  const router = useRouter();
  const routeParams = useParams();
  const businessSlug = (routeParams?.businessSlug as string) || 'your-business';

  const [business, setBusiness] = useState<Business | null>(null);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('cat_all');
  const [searchQuery, setSearchQuery] = useState('');
  const [saved, setSaved] = useState(false);
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [isMenuEnabled, setIsMenuEnabled] = useState(true);

  // Homescreen Install State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showHomescreenModal, setShowHomescreenModal] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [selectedItemDetail, setSelectedItemDetail] = useState<MenuItem | null>(null);

  const terminology = getCatalogTerminology(business?.category);

  // Attach dynamic PWA manifest for this business
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let link: HTMLLinkElement | null = document.querySelector('link[rel="manifest"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'manifest';
      document.head.appendChild(link);
    }
    link.href = `/api/manifest?slug=${encodeURIComponent(businessSlug)}`;

    // Listen for native beforeinstallprompt (Android / Chrome)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for appinstalled
    const handleAppInstalled = () => {
      setSaved(true);
      localStorage.setItem(`menu_saved_${businessSlug}`, 'true');
      setDeferredPrompt(null);
      setToastMsg('App installed on home screen! 🎉');
      setTimeout(() => setToastMsg(null), 4000);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [businessSlug]);

  useEffect(() => {
    analyticsService.trackEvent('menu_view', { slug: businessSlug });

    let isActive = true;
    setIsLoading(true);
    setLoadError(false);

    businessService.getBusinessBySlug(businessSlug)
      .then(async (biz) => {
        if (!biz) return;
        const menuEnabled = biz.menuEnabled !== false && biz.theme?.menuEnabled !== false;
        setBusiness(biz);
        setIsMenuEnabled(menuEnabled);
        if (!menuEnabled) return;

        const [cats, itms] = await Promise.all([
          menuService.getCategories(biz.businessId),
          menuService.getItems(biz.businessId)
        ]);
        if (!isActive) return;
        setCategories(cats);
        setItems(itms);
        const isSaved = localStorage.getItem(`menu_saved_${businessSlug}`);
        setSaved(Boolean(isSaved));
      })
      .catch(() => {
        if (isActive) setLoadError(true);
      })
      .finally(() => {
        setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [businessSlug]);

  // Handle Save Menu / Add to Homescreen
  const handleSaveMenu = async () => {
    // If native prompt is available (Android/Chromium), trigger it!
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          setSaved(true);
          localStorage.setItem(`menu_saved_${businessSlug}`, 'true');
          setDeferredPrompt(null);
          analyticsService.trackEvent('menu_saved', { slug: businessSlug, mode: 'pwa_prompt' });
          if (business) {
            menuService.saveMenuRecord(business.businessId, `session_${Date.now()}`);
          }
          setToastMsg('Saved to your mobile home screen! 🎉');
          setTimeout(() => setToastMsg(null), 4000);
          return;
        }
      } catch (err) {
        console.warn('Native prompt error:', err);
      }
    }

    // Otherwise, show the step-by-step visual homescreen modal (iOS & Chrome guide)
    setShowHomescreenModal(true);
  };

  const handleConfirmSaved = () => {
    setSaved(true);
    localStorage.setItem(`menu_saved_${businessSlug}`, 'true');
    analyticsService.trackEvent('menu_saved', { slug: businessSlug, mode: 'homescreen_manual' });
    if (business) {
      menuService.saveMenuRecord(business.businessId, `session_${Date.now()}`);
    }
    setShowHomescreenModal(false);
    setToastMsg('Menu saved to your phone! 📱');
    setTimeout(() => setToastMsg(null), 3500);
  };

  const toggleFavorite = (itemId: string) => {
    setFavorites(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  if (isLoading) {
    return (
      <div className="-mt-8 min-h-screen w-full rounded-t-3xl bg-[#FDFBF7] px-5 pb-12 pt-8" role="status" aria-live="polite">
        <div className="mx-auto max-w-2xl space-y-5">
          <div className="flex items-center justify-between">
            <div className="h-10 w-10 rounded-full bg-slate-200 funnel-skeleton" />
            <div className="h-9 w-24 rounded-full bg-slate-200 funnel-skeleton" />
          </div>
          <div className="h-10 w-3/4 rounded-xl bg-slate-200 funnel-skeleton" />
          <div className="h-4 w-2/3 rounded-full bg-slate-200 funnel-skeleton" />
          <div className="h-12 rounded-2xl bg-slate-200 funnel-skeleton" />
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((item) => <div key={item} className="h-48 rounded-2xl bg-slate-200 funnel-skeleton" />)}
          </div>
          <span className="sr-only">Loading the public catalogue…</span>
        </div>
      </div>
    );
  }

  if (loadError || !business) {
    return (
      <div className="-mt-8 flex min-h-[60vh] w-full items-center justify-center rounded-t-3xl bg-[#FDFBF7] px-5 py-12">
        <div className="mx-auto max-w-sm rounded-3xl border border-slate-200 bg-white p-7 text-center shadow-lg" role="alert">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
            <UtensilsCrossed className="h-6 w-6" aria-hidden="true" />
          </div>
          <h2 className="font-serif text-2xl font-bold text-slate-900">Catalogue unavailable</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">We could not load this public catalogue right now. Please return to the review page and try again.</p>
          <Button type="button" onClick={() => router.back()} className="mt-5 w-full rounded-xl">Return to review page</Button>
        </div>
      </div>
    );
  }

  if (!isMenuEnabled) {
    return (
      <div className="-mt-8 flex min-h-[60vh] w-full items-center justify-center rounded-t-3xl bg-[#FDFBF7] px-5 py-12">
        <div className="mx-auto max-w-sm rounded-3xl border border-slate-200 bg-white p-7 text-center shadow-lg" role="status">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
            <UtensilsCrossed className="h-6 w-6" aria-hidden="true" />
          </div>
          <h2 className="font-serif text-2xl font-bold text-slate-900">{terminology.isFood ? 'Menu' : 'Catalogue'} not available</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">This business has not enabled its public {terminology.isFood ? 'menu' : 'catalogue'}.</p>
          <Button type="button" onClick={() => router.push(`/f/${businessSlug}`)} className="mt-5 w-full rounded-xl">Return to review page</Button>
        </div>
      </div>
    );
  }

  const filteredItems = items.filter(item => {
    const matchesCategory = activeCategory === 'cat_all' || item.categoryId === activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           (item.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch && item.isLive;
  });

  const popularItems = filteredItems.filter(i => i.isBestseller);
  const otherItems = filteredItems.filter(i => !i.isBestseller);

  return (
    <div className="relative z-20 -mt-8 min-h-screen w-full rounded-t-3xl bg-[#FDFBF7] pb-24 pt-4 shadow-[0_-10px_40px_rgba(0,0,0,0.14)]">
      
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-[#0B3D2E] text-white px-5 py-3 rounded-full text-xs font-semibold shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-300">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Sticky Header with Search */}
      <div className="sticky top-0 z-30 border-b border-gray-100 bg-[#FDFBF7]/94 px-5 pb-5 pt-4 backdrop-blur-xl">
        <div className="flex items-center justify-between mb-3">
          <button 
            type="button" 
            onClick={() => router.back()} 
            className="funnel-focus-ring -ml-2 rounded-full p-2 transition-colors hover:bg-gray-100 cursor-pointer" 
            aria-label="Back to review page"
          >
            <ChevronLeft className="w-6 h-6 text-gray-800" />
          </button>
          
          <Button 
            variant={saved ? "default" : "outline"} 
            size="sm" 
            className={`funnel-focus-ring rounded-full shadow-sm transition-all hover:-translate-y-0.5 cursor-pointer font-semibold text-xs ${
              saved 
                ? 'bg-[#0B3D2E] text-white border-transparent' 
                : 'border-[#0B3D2E] text-[#0B3D2E] bg-white hover:bg-emerald-50'
            }`}
            aria-pressed={saved}
            onClick={handleSaveMenu}
          >
            {saved ? (
              <>
                <Check className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
                Saved to Phone
              </>
            ) : (
              <>
                <Bookmark className="w-3.5 h-3.5 mr-1.5" />
                {terminology.saveButtonLabel}
              </>
            )}
          </Button>
        </div>

        <h2 className="mb-1 font-serif text-3xl font-bold leading-tight text-[#0B3D2E]">
          <span className="text-gray-900">Our</span> {terminology.publicPageHeading}
        </h2>
        <p className="text-xs text-gray-600 mb-4 max-w-[320px] line-clamp-2">
          {business?.theme?.tagline || (terminology.isFood 
            ? 'A delightful selection of dishes made with the finest ingredients.' 
            : 'Explore our full collection of products, packages, and premium services.')}
        </p>

        <div className="relative">
          <label htmlFor="catalogue-search" className="sr-only">Search the catalogue</label>
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input 
            placeholder={terminology.isFood ? "Search dishes, cuisines, ingredients..." : "Search products, services, offerings..."} 
            id="catalogue-search"
            className="funnel-focus-ring h-11 rounded-2xl border-gray-200 bg-white pl-10 text-xs shadow-xs"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="px-5">
        {/* Horizontal Category Scroll */}
        <div className="flex overflow-x-auto gap-3 py-4 no-scrollbar mb-4 -mx-5 px-5">
          {categories.map((cat) => (
            <button
              key={cat.categoryId} 
              onClick={() => setActiveCategory(cat.categoryId)}
              type="button"
              aria-pressed={activeCategory === cat.categoryId}
              aria-label={`Show ${cat.name}`}
              className={`funnel-focus-ring group flex flex-shrink-0 cursor-pointer flex-col items-center rounded-xl px-2 transition-all ${
                activeCategory === cat.categoryId ? 'text-[#0B3D2E]' : 'text-gray-500'
              }`}
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-1.5 transition-all ${
                activeCategory === cat.categoryId 
                  ? 'bg-[#0B3D2E] text-white shadow-md scale-105' 
                  : 'bg-[#F2ECE4] text-gray-700 hover:bg-[#E6DCCF]'
              }`}>
                <CategoryIcon name={cat.name} className="w-5 h-5" />
              </div>
              <span className={`text-[11px] font-semibold text-center whitespace-nowrap ${
                activeCategory === cat.categoryId ? 'text-[#0B3D2E] font-bold' : 'text-gray-600'
              }`}>
                {cat.name}
              </span>
              {activeCategory === cat.categoryId && (
                <div className="h-1 w-6 bg-[#0B3D2E] mt-1 rounded-full"></div>
              )}
            </button>
          ))}
        </div>

        {/* Popular / Bestsellers Section */}
        {popularItems.length > 0 && activeCategory === 'cat_all' && !searchQuery && (
          <div className="mb-7">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-base font-serif font-bold text-gray-900 flex items-center">
                <Flame className="w-4 h-4 text-orange-500 mr-1.5" />
                Popular &amp; Bestsellers
              </h3>
              <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full">
                {popularItems.length} items
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              {popularItems.map(item => (
                <MenuItemCard 
                  key={item.itemId} 
                  item={item} 
                  isFavorite={favorites[item.itemId]} 
                  onFavorite={() => toggleFavorite(item.itemId)} 
                  onSelect={() => setSelectedItemDetail(item)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Main List Section */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-base font-serif font-bold text-gray-900 flex items-center">
              <Leaf className="mr-1.5 h-4 w-4 text-green-700" />
              {searchQuery 
                ? `Results for "${searchQuery}"` 
                : (activeCategory !== 'cat_all' 
                    ? categories.find(c => c.categoryId === activeCategory)?.name || 'Items' 
                    : (terminology.isFood ? 'All dishes' : 'All offerings'))}
            </h3>
            <span className="text-xs text-gray-500">
              {(activeCategory !== 'cat_all' || searchQuery ? filteredItems : otherItems).length} available
            </span>
          </div>
          
          {(activeCategory !== 'cat_all' || searchQuery ? filteredItems : otherItems).length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 px-5 py-10 text-center">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                <Search className="h-4 w-4" aria-hidden="true" />
              </div>
              <p className="text-sm font-semibold text-slate-800">{items.length === 0 ? 'No catalogue items added yet' : 'No matching items'}</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">
                {items.length === 0 ? 'The business has not published any items for this catalogue yet.' : 'Try another search query or clear filter.'}
              </p>
              {(searchQuery || activeCategory !== 'cat_all') && (
                <button 
                  type="button" 
                  onClick={() => { setSearchQuery(''); setActiveCategory('cat_all'); }} 
                  className="funnel-focus-ring mt-4 rounded-full px-4 py-1.5 text-xs font-semibold text-[#0B3D2E] bg-emerald-50 hover:bg-emerald-100"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3.5">
              {(activeCategory !== 'cat_all' || searchQuery ? filteredItems : otherItems).map(item => (
                <MenuItemCard 
                  key={item.itemId} 
                  item={item} 
                  isFavorite={favorites[item.itemId]} 
                  onFavorite={() => toggleFavorite(item.itemId)} 
                  onSelect={() => setSelectedItemDetail(item)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Floating Bottom Quick Action Bar on Mobile */}
      <div className="fixed bottom-4 left-4 right-4 z-40 max-w-md mx-auto">
        <div className="bg-[#0B3D2E] text-white rounded-2xl p-3 shadow-2xl backdrop-blur-lg flex items-center justify-between border border-emerald-700/50">
          <div className="flex items-center gap-2.5 min-w-0 pr-2">
            <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
              <Smartphone className="w-4 h-4 text-emerald-300" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold leading-tight truncate">
                {business.name} App
              </p>
              <p className="text-[10px] text-emerald-200/80 truncate">
                {saved ? 'Saved on home screen' : 'Instant 1-tap home screen access'}
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={handleSaveMenu}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-bold shrink-0 transition-transform active:scale-95 cursor-pointer ${
              saved 
                ? 'bg-emerald-500 text-white' 
                : 'bg-white text-[#0B3D2E] hover:bg-emerald-50'
            }`}
          >
            {saved ? (
              <span className="flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Saved
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <Download className="w-3.5 h-3.5" /> Save Menu
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* ── Homescreen Install Modal / Bottom Sheet ── */}
      {showHomescreenModal && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
          onClick={() => setShowHomescreenModal(false)}
        >
          <div 
            className="w-full max-w-md bg-white rounded-t-[32px] sm:rounded-[32px] p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0B3D2E] to-[#12543e] text-white flex items-center justify-center shadow-md font-serif text-2xl font-bold shrink-0">
                  {business.logo && business.logo !== '/placeholder.png' ? (
                    <img src={business.logo} alt={business.name} className="w-full h-full object-cover rounded-2xl" />
                  ) : (
                    business.name.charAt(0)
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-[#0B3D2E] bg-green-50 px-2 py-0.5 rounded-full">
                      Mobile App
                    </span>
                  </div>
                  <h3 className="font-bold text-gray-900 text-base leading-tight mt-0.5">
                    {business.name}
                  </h3>
                  <p className="text-xs text-gray-500">
                    Save to Home Screen like an app
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowHomescreenModal(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Benefit Highlights */}
            <div className="bg-amber-50/60 border border-amber-200/60 rounded-2xl p-3.5 mb-5 text-xs text-amber-900 flex items-center gap-2.5">
              <Sparkles className="w-5 h-5 text-amber-600 shrink-0" />
              <span>
                Enjoy full-screen browsing anytime without re-scanning QR codes or downloading large apps from App Store!
              </span>
            </div>

            {/* If native deferred prompt is available */}
            {deferredPrompt && (
              <div className="mb-5">
                <Button 
                  onClick={handleSaveMenu}
                  className="w-full h-12 bg-[#0B3D2E] hover:bg-[#12543e] text-white rounded-2xl font-bold text-sm shadow-lg flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Tap to Install App Now
                </Button>
                <p className="text-center text-[11px] text-gray-400 mt-2">or follow manual steps below</p>
              </div>
            )}

            {/* Step-by-Step Instructions */}
            <div className="space-y-4 mb-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                How to save on your mobile device:
              </h4>

              {/* iPhone / Safari Steps */}
              <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100 space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-900">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px]">🍎</span>
                  iPhone / Safari:
                </div>
                <div className="grid grid-cols-1 gap-2 text-xs text-gray-600 pl-7">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900">1.</span>
                    <span>Tap the <strong>Share</strong> button <Share2 className="inline w-3.5 h-3.5 text-blue-600 mx-0.5" /> at the bottom of Safari</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900">2.</span>
                    <span>Scroll down and tap <strong>Add to Home Screen</strong> <PlusSquare className="inline w-3.5 h-3.5 text-gray-700 mx-0.5" /></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900">3.</span>
                    <span>Tap <strong>Add</strong> in the top-right corner</span>
                  </div>
                </div>
              </div>

              {/* Android / Chrome Steps */}
              <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100 space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-900">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px]">🤖</span>
                  Android / Chrome:
                </div>
                <div className="grid grid-cols-1 gap-2 text-xs text-gray-600 pl-7">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900">1.</span>
                    <span>Tap the <strong>menu icon (⋮)</strong> in the top-right</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900">2.</span>
                    <span>Select <strong>Install app</strong> or <strong>Add to Home screen</strong></span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2.5">
              <Button 
                variant="outline" 
                onClick={() => setShowHomescreenModal(false)}
                className="flex-1 rounded-2xl h-11 text-xs font-semibold text-gray-600"
              >
                Close
              </Button>
              <Button 
                onClick={handleConfirmSaved}
                className="flex-1 rounded-2xl h-11 bg-[#0B3D2E] hover:bg-[#12543e] text-white text-xs font-bold shadow-md"
              >
                <Check className="w-4 h-4 mr-1.5 text-emerald-400" />
                Done! Mark as Saved
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Item Detail Modal ── */}
      {selectedItemDetail && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedItemDetail(null)}
        >
          <div 
            className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-100"
            onClick={e => e.stopPropagation()}
          >
            <div className="relative h-48 w-full bg-slate-100">
              <img 
                src={selectedItemDetail.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&h=400&fit=crop'} 
                alt={selectedItemDetail.name} 
                className="w-full h-full object-cover" 
              />
              <button 
                onClick={() => setSelectedItemDetail(null)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center backdrop-blur-xs"
              >
                <X className="w-4 h-4" />
              </button>
              {selectedItemDetail.isBestseller && (
                <div className="absolute bottom-3 left-3 bg-[#D4AF37] text-white text-xs font-bold px-2.5 py-1 rounded-lg flex items-center shadow-md">
                  <Star className="w-3.5 h-3.5 mr-1 fill-white" /> Bestseller
                </div>
              )}
            </div>
            <div className="p-5">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-serif font-bold text-gray-900 text-lg leading-tight">
                  {selectedItemDetail.name}
                </h3>
                <span className="font-bold text-[#0B3D2E] text-lg shrink-0 ml-2">
                  ₹{selectedItemDetail.price}
                </span>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed mb-5">
                {selectedItemDetail.description || 'Prepared fresh with top quality ingredients.'}
              </p>
              <Button 
                onClick={() => setSelectedItemDetail(null)}
                className="w-full rounded-2xl bg-[#0B3D2E] text-white text-xs font-bold h-11"
              >
                Back to Catalogue
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

function MenuItemCard({ 
  item, 
  isFavorite, 
  onFavorite, 
  onSelect 
}: { 
  item: MenuItem, 
  isFavorite: boolean, 
  onFavorite: () => void,
  onSelect: () => void
}) {
  return (
    <Card 
      onClick={onSelect}
      className="overflow-hidden border border-slate-100 shadow-xs rounded-2xl flex flex-col bg-white h-full group cursor-pointer hover:shadow-md transition-all active:scale-[0.98]"
    >
      <div className="relative h-28 w-full bg-gray-100">
        <img 
          src={item.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop'} 
          alt={item.name} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
        />
        <button 
          type="button"
          aria-label={isFavorite ? `Remove ${item.name} from saved items` : `Save ${item.name}`}
          aria-pressed={isFavorite}
          className={`funnel-focus-ring absolute right-2 top-2 rounded-full p-1.5 backdrop-blur-md shadow-xs transition-colors cursor-pointer ${
            isFavorite ? 'bg-white text-red-500' : 'bg-black/25 text-white hover:bg-black/40'
          }`}
          onClick={(e) => { e.stopPropagation(); onFavorite(); }}
        >
          <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-current' : ''}`} />
        </button>
        {item.isBestseller && (
          <div className="absolute top-2 left-2 bg-[#D4AF37] text-white text-[9px] font-bold px-2 py-0.5 rounded-md flex items-center shadow-xs">
            <Star className="w-2.5 h-2.5 mr-1 fill-white" /> Bestseller
          </div>
        )}
      </div>
      <div className="flex flex-grow flex-col p-3">
        <h4 className="font-bold text-xs text-gray-900 leading-tight mb-1 line-clamp-1">{item.name}</h4>
        <div className="flex items-center gap-1 mb-1">
          <span className="font-bold text-[#0B3D2E] text-xs">₹{item.price}</span>
        </div>
        <p className="text-[10px] text-gray-500 line-clamp-2 leading-relaxed mt-auto">
          {item.description || 'Delicious offering prepared with care.'}
        </p>
      </div>
    </Card>
  );
}

function CategoryIcon({ name, className }: { name: string, className?: string }) {
  const lower = name.toLowerCase();
  if (lower.includes('starter') || lower.includes('appetizer')) return <Leaf className={className} />;
  if (lower.includes('main') || lower.includes('dish') || lower.includes('meal')) return <UtensilsCrossed className={className} />;
  if (lower.includes('drink') || lower.includes('beverage') || lower.includes('coffee')) return <Sparkles className={className} />;
  if (lower.includes('dessert') || lower.includes('sweet')) return <Star className={className} />;
  return <div className={`w-2.5 h-2.5 rounded-full bg-current ${className}`}></div>;
}
