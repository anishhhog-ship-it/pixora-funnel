'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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

  const terminology = getCatalogTerminology(business?.category);

  useEffect(() => {
    analyticsService.trackEvent('menu_view', { slug: businessSlug });
    
    businessService.getBusinessBySlug(businessSlug).then(async (biz) => {
      if (biz) {
        setBusiness(biz);
        const [cats, itms] = await Promise.all([
          menuService.getCategories(biz.businessId),
          menuService.getItems(biz.businessId)
        ]);
        setCategories(cats);
        setItems(itms);
      }
    });

    const isSaved = localStorage.getItem(`menu_saved_${businessSlug}`);
    if (isSaved) setSaved(true);
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

  if (!business) return null;

  const filteredItems = items.filter(item => {
    const matchesCategory = activeCategory === 'cat_all' || item.categoryId === activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch && item.isLive;
  });

  const popularItems = filteredItems.filter(i => i.isBestseller);
  const otherItems = filteredItems.filter(i => !i.isBestseller);

  return (
    <div className="bg-[#FDFBF7] min-h-screen w-full relative z-20 pb-12 -mt-8 pt-4 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
      
      <div className="px-5 pt-4 pb-6 sticky top-0 bg-[#FDFBF7]/90 backdrop-blur-md z-30 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => router.back()} className="p-2 -ml-2 rounded-full hover:bg-gray-100">
            <ChevronLeft className="w-6 h-6 text-gray-800" />
          </button>
          
          <Button 
            variant={saved ? "default" : "outline"} 
            size="sm" 
            className={`rounded-full shadow-sm ${saved ? 'bg-[#0B3D2E]' : 'border-[#0B3D2E] text-[#0B3D2E]'}`}
            onClick={handleSaveMenu}
          >
            <Bookmark className={`w-4 h-4 mr-2 ${saved ? 'fill-white' : ''}`} />
            {saved ? 'Saved' : terminology.saveButtonLabel}
          </Button>
        </div>

        <h2 className="text-4xl font-serif font-bold text-[#0B3D2E] mb-2 leading-tight">
          <span className="text-gray-900">Our</span> {terminology.publicPageHeading}
        </h2>
        <p className="text-sm text-gray-600 mb-5 max-w-[280px]">
          {business?.theme?.tagline || (terminology.isFood 
            ? 'A delightful selection of dishes made with the finest ingredients.' 
            : 'Explore our full collection of products, packages, and premium services.')}
        </p>

        <div className="relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input 
            placeholder={terminology.isFood ? "Search for dishes, cuisines or categories..." : "Search for products, services or categories..."} 
            className="pl-10 bg-white border-gray-200 rounded-2xl h-12 text-sm shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="px-5">
        {/* Horizontal Category Scroll */}
        <div className="flex overflow-x-auto gap-4 py-4 no-scrollbar mb-6 -mx-5 px-5">
          {categories.map((cat) => (
            <div 
              key={cat.categoryId} 
              className="flex flex-col items-center flex-shrink-0 cursor-pointer group"
              onClick={() => setActiveCategory(cat.categoryId)}
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
            </div>
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
              <button className="text-xs font-semibold text-[#0B3D2E] flex items-center">
                View All <span className="ml-1">→</span>
              </button>
            </div>
            <p className="text-xs text-gray-500 -mt-3 mb-4">Our most loved dishes by our customers</p>

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
                  <Leaf className="w-5 h-5 text-green-700 mr-2" />
                  {searchQuery ? 'Search Results' : categories.find(c => c.categoryId === activeCategory)?.name}
               </h3>
             </div>
          ) : (
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-serif font-bold text-gray-900 flex items-center">
                 <Leaf className="w-5 h-5 text-green-700 mr-2" />
                 All Dishes
              </h3>
            </div>
          )}
          
          {(activeCategory !== 'cat_all' || searchQuery ? filteredItems : otherItems).length === 0 ? (
            <p className="text-center text-gray-500 text-sm py-8">No dishes found.</p>
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
        <button 
          className={`absolute top-2 right-2 p-1.5 rounded-full backdrop-blur-md shadow-sm transition-colors ${isFavorite ? 'bg-white text-red-500' : 'bg-black/20 text-white hover:bg-black/40'}`}
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
      <div className="p-3 flex flex-col flex-grow">
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
