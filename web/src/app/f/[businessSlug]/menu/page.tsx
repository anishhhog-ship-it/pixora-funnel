'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Search, ChevronLeft, Bookmark, Heart, Flame, Leaf, Star, UtensilsCrossed } from 'lucide-react';
import { businessService, menuService, analyticsService, getCatalogTerminology } from '@/services';
import { Business, MenuCategory, MenuItem } from '@/types';

import { useParams } from 'next/navigation';

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

  const terminology = getCatalogTerminology(business?.category);

  useEffect(() => {
    analyticsService.trackEvent('menu_view', { slug: businessSlug });

    let isActive = true;
    Promise.resolve().then(() => {
      if (isActive) {
        setIsLoading(true);
        setLoadError(false);
      }
    });

    businessService.getBusinessBySlug(businessSlug)
      .then(async (biz) => {
        if (!biz) return;
        const [cats, itms] = await Promise.all([
          menuService.getCategories(biz.businessId),
          menuService.getItems(biz.businessId)
        ]);
        if (!isActive) return;
        setBusiness(biz);
        setCategories(cats);
        setItems(itms);
        const isSaved = localStorage.getItem(`menu_saved_${businessSlug}`);
        setSaved(Boolean(isSaved));
      })
      .catch(() => {
        if (isActive) setLoadError(true);
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [businessSlug]);

  const handleSaveMenu = () => {
    const newState = !saved;
    setSaved(newState);
    if (newState) {
      localStorage.setItem(`menu_saved_${businessSlug}`, 'true');
      analyticsService.trackEvent('menu_saved', { slug: businessSlug });
    } else {
      localStorage.removeItem(`menu_saved_${businessSlug}`);
    }
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

  const filteredItems = items.filter(item => {
    const matchesCategory = activeCategory === 'cat_all' || item.categoryId === activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           (item.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch && item.isLive;
  });

  const popularItems = filteredItems.filter(i => i.isBestseller);
  const otherItems = filteredItems.filter(i => !i.isBestseller);

  return (
    <div className="relative z-20 -mt-8 min-h-screen w-full rounded-t-3xl bg-[#FDFBF7] pb-12 pt-4 shadow-[0_-10px_40px_rgba(0,0,0,0.14)]">
      
      <div className="sticky top-0 z-30 border-b border-gray-100 bg-[#FDFBF7]/92 px-5 pb-6 pt-4 backdrop-blur-xl">
        <div className="flex items-center justify-between mb-4">
           <button type="button" onClick={() => router.back()} className="funnel-focus-ring -ml-2 rounded-full p-2 transition-colors hover:bg-gray-100" aria-label="Back to review page">
            <ChevronLeft className="w-6 h-6 text-gray-800" />
          </button>
          
          <Button 
            variant={saved ? "default" : "outline"} 
            size="sm" 
             className={`funnel-focus-ring rounded-full shadow-sm transition-all hover:-translate-y-0.5 ${saved ? 'bg-[#0B3D2E]' : 'border-[#0B3D2E] text-[#0B3D2E]'}`}
             aria-pressed={saved}
            onClick={handleSaveMenu}
          >
            <Bookmark className={`w-4 h-4 mr-2 ${saved ? 'fill-white' : ''}`} />
            {saved ? 'Saved' : terminology.saveButtonLabel}
          </Button>
        </div>

         <h2 className="mb-2 font-serif text-4xl font-bold leading-tight text-[#0B3D2E]">
           <span className="text-gray-900">Our</span> {terminology.publicPageHeading}
        </h2>
        <p className="text-sm text-gray-600 mb-5 max-w-[280px]">
          {business?.theme?.tagline || (terminology.isFood 
            ? 'A delightful selection of dishes made with the finest ingredients.' 
            : 'Explore our full collection of products, packages, and premium services.')}
        </p>

         <div className="relative">
           <label htmlFor="catalogue-search" className="sr-only">Search the catalogue</label>
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input 
            placeholder={terminology.isFood ? "Search for dishes, cuisines or categories..." : "Search for products, services or categories..."} 
             id="catalogue-search"
             className="funnel-focus-ring h-12 rounded-2xl border-gray-200 bg-white pl-10 text-sm shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

       <div className="px-5">
        {/* Horizontal Category Scroll */}
        <div className="flex overflow-x-auto gap-4 py-4 no-scrollbar mb-6 -mx-5 px-5">
          {categories.map((cat) => (
            <button
              key={cat.categoryId} 
              onClick={() => setActiveCategory(cat.categoryId)}
              type="button"
              aria-pressed={activeCategory === cat.categoryId}
              aria-label={`Show ${cat.name}`}
              className={`funnel-focus-ring group flex flex-shrink-0 cursor-pointer flex-col items-center rounded-xl px-1 ${activeCategory === cat.categoryId ? 'text-[#0B3D2E]' : 'text-gray-500'}`}
            >
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-2 transition-all ${
                activeCategory === cat.categoryId 
                  ? 'bg-[#0B3D2E] text-white shadow-md' 
                  : 'bg-[#F2ECE4] text-gray-600 group-hover:bg-[#E6DCCF]'
              }`}>
                {/* Mock icons based on category */}
                <CategoryIcon name={cat.name} className="w-6 h-6" />
              </div>
              <span className={`text-xs font-medium ${
                activeCategory === cat.categoryId ? 'text-[#0B3D2E]' : 'text-gray-500'
              }`}>
                {cat.name}
              </span>
              {activeCategory === cat.categoryId && (
                <div className="h-0.5 w-8 bg-[#0B3D2E] mt-1 rounded-full"></div>
              )}
            </button>
          ))}
        </div>

        {/* Popular Dishes Section */}
        {popularItems.length > 0 && activeCategory === 'cat_all' && !searchQuery && (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-serif font-bold text-gray-900 flex items-center">
                <Flame className="w-5 h-5 text-orange-500 mr-2" />
                Popular Dishes
              </h3>
               <button type="button" onClick={() => { setActiveCategory('cat_all'); setSearchQuery(''); }} className="funnel-focus-ring flex items-center rounded-md text-xs font-semibold text-[#0B3D2E]">
                 View All <span className="ml-1">→</span>
               </button>
            </div>
             <p className="-mt-3 mb-4 text-xs text-gray-500">Highlighted items from this public catalogue</p>

            <div className="grid grid-cols-2 gap-4">
              {popularItems.map(item => (
                <MenuItemCard key={item.itemId} item={item} isFavorite={favorites[item.itemId]} onFavorite={() => toggleFavorite(item.itemId)} />
              ))}
            </div>
          </div>
        )}

        {/* Selected Category or Search Results */}
        <div className="mb-8">
          {activeCategory !== 'cat_all' || searchQuery ? (
             <div className="flex justify-between items-center mb-4">
               <h3 className="text-lg font-serif font-bold text-gray-900 flex items-center">
                  <Leaf className="mr-2 h-5 w-5 text-green-700" />
                  {searchQuery ? 'Search Results' : categories.find(c => c.categoryId === activeCategory)?.name}
               </h3>
             </div>
          ) : (
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-serif font-bold text-gray-900 flex items-center">
                  <Leaf className="mr-2 h-5 w-5 text-green-700" />
                  {terminology.isFood ? 'All dishes' : 'All offerings'}
              </h3>
            </div>
          )}
          
           {(activeCategory !== 'cat_all' || searchQuery ? filteredItems : otherItems).length === 0 ? (
             <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 px-5 py-10 text-center">
               <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                 <Search className="h-4 w-4" aria-hidden="true" />
               </div>
               <p className="text-sm font-semibold text-slate-800">{items.length === 0 ? 'Nothing is listed yet' : 'No matching items'}</p>
               <p className="mt-1 text-xs leading-relaxed text-slate-500">
                 {items.length === 0 ? 'This business has not published any items for this page.' : 'Try another search or view all categories.'}
               </p>
               {(searchQuery || activeCategory !== 'cat_all') && (
                 <button type="button" onClick={() => { setSearchQuery(''); setActiveCategory('cat_all'); }} className="funnel-focus-ring mt-4 rounded-full px-3 py-1.5 text-xs font-semibold text-[#0B3D2E] hover:bg-emerald-50">Clear filters</button>
               )}
             </div>
           ) : (
            <div className="grid grid-cols-2 gap-4">
              {(activeCategory !== 'cat_all' || searchQuery ? filteredItems : otherItems).map(item => (
                <MenuItemCard key={item.itemId} item={item} isFavorite={favorites[item.itemId]} onFavorite={() => toggleFavorite(item.itemId)} />
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

function MenuItemCard({ item, isFavorite, onFavorite }: { item: MenuItem, isFavorite: boolean, onFavorite: () => void }) {
  return (
    <Card className="overflow-hidden border-0 shadow-sm rounded-2xl flex flex-col bg-white h-full group">
       <div className="relative h-32 w-full bg-gray-100">
         {item.image && (
          <Image src={item.image} alt={item.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
         )}
         {!item.image && (
           <div className="flex h-full items-center justify-center text-slate-300" aria-label="No image available">
             <UtensilsCrossed className="h-8 w-8" aria-hidden="true" />
           </div>
         )}
        <button 
          type="button"
          aria-label={isFavorite ? `Remove ${item.name} from saved items` : `Save ${item.name}`}
          aria-pressed={isFavorite}
          className={`funnel-focus-ring absolute right-2 top-2 rounded-full p-1.5 backdrop-blur-md shadow-sm transition-colors ${isFavorite ? 'bg-white text-red-500' : 'bg-black/20 text-white hover:bg-black/40'}`}
          onClick={(e) => { e.stopPropagation(); onFavorite(); }}
        >
          <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
        </button>
        {item.isBestseller && (
          <div className="absolute top-2 left-2 bg-[#D4AF37] text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center shadow-sm">
            <Star className="w-3 h-3 mr-1 fill-white" /> Bestseller
          </div>
        )}
      </div>
       <div className="flex flex-grow flex-col p-3">
        <h4 className="font-semibold text-sm text-gray-900 leading-tight mb-1">{item.name}</h4>
        <div className="flex items-center gap-1 mb-1.5">
          <span className="font-bold text-[#0B3D2E] text-sm">₹{item.price}</span>
        </div>
        <p className="text-[10px] text-gray-500 line-clamp-2 leading-relaxed mt-auto">
          {item.description}
        </p>
      </div>
    </Card>
  )
}

function CategoryIcon({ name, className }: { name: string, className?: string }) {
  // Simple icon mapper for mock
  if (name.includes('Starter')) return <Leaf className={className} />;
  if (name.includes('Main')) return <UtensilsCrossed className={className} />;
  return <div className={`w-3 h-3 rounded-full bg-current ${className}`}></div>;
}
