'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  UtensilsCrossed, 
  BookOpen, 
  Search, 
  Filter, 
  Plus, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  Camera, 
  Check, 
  ExternalLink 
} from 'lucide-react';
import { menuService, businessService, getCatalogTerminology } from '@/services';
import { MenuItem, MenuCategory, Business } from '@/types';

export default function MenuManagementPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeBiz, setActiveBiz] = useState<Business | null>(null);
  
  // Right panel edit state
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Dynamic Terminology based on business category (Menu for food/dining, Catalogue for others)
  const terminology = getCatalogTerminology(activeBiz?.category);
  const CatalogIcon = terminology.isFood ? UtensilsCrossed : BookOpen;

  useEffect(() => {
    async function loadData() {
      const biz = await businessService.getActiveBusiness();
      setActiveBiz(biz);
      const bizId = biz?.businessId || await businessService.getActiveBusinessId();

      const [fetchedItems, fetchedCats] = await Promise.all([
        menuService.getItems(bizId),
        menuService.getCategories(bizId)
      ]);
      setItems(fetchedItems);
      setCategories(fetchedCats);
      if (fetchedItems.length > 0) {
        setEditingItem(fetchedItems[0]);
      }
    }
    loadData();
  }, []);

  const filteredItems = items.filter(item => {
    const matchCat = selectedCategory === 'all' || item.categoryId === selectedCategory;
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleStartAddNew = async () => {
    const bizId = activeBiz?.businessId || await businessService.getActiveBusinessId();
    const defaultCat = categories.find(c => c.categoryId !== 'cat_all')?.categoryId || 'cat_general';
    const newItem: MenuItem = {
      itemId: `item_${Date.now()}`,
      businessId: bizId,
      categoryId: defaultCat,
      name: '',
      description: '',
      price: 0,
      isLive: true,
      isBestseller: false,
    };
    setEditingItem(newItem);
    setIsAddingNew(true);
  };

  const handleSave = async () => {
    if (!editingItem || !editingItem.name.trim()) {
      setToastMsg(`Please enter a ${terminology.itemLabel.toLowerCase()} name.`);
      setTimeout(() => setToastMsg(null), 3000);
      return;
    }

    if (isAddingNew) {
      const added = await menuService.addItem(editingItem);
      setItems(prev => [...prev, added]);
      setEditingItem(added);
      setIsAddingNew(false);
      setToastMsg(`${terminology.itemLabel} added to live ${terminology.isFood ? 'menu' : 'catalogue'}! 🎉`);
    } else {
      const updated = await menuService.updateItem(editingItem);
      setItems(items.map(i => i.itemId === updated.itemId ? updated : i));
      setToastMsg(`${terminology.itemLabel} updated successfully! ✅`);
    }
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm(terminology.deleteConfirmText)) return;
    await menuService.deleteItem(itemId);
    const remaining = items.filter(i => i.itemId !== itemId);
    setItems(remaining);
    setEditingItem(remaining.length > 0 ? remaining[0] : null);
    setIsAddingNew(false);
    setToastMsg(`${terminology.itemLabel} removed from ${terminology.isFood ? 'menu' : 'catalogue'}.`);
    setTimeout(() => setToastMsg(null), 3000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      
      {/* Toast Alert */}
      {toastMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between">
          <span>{toastMsg}</span>
          <button onClick={() => setToastMsg(null)} className="text-emerald-600 hover:text-emerald-800">Dismiss</button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-serif font-bold text-gray-900">{terminology.pageTitle}</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            {terminology.pageSubtitle}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <StatCard icon={<CatalogIcon className="w-4 h-4 text-amber-500" />} value={items.length} label={terminology.totalItemsLabel} />
          <Button 
            onClick={handleStartAddNew}
            className="py-2.5 px-4 bg-[#0B3D2E] hover:bg-[#12543e] text-white rounded-xl text-xs font-semibold flex items-center cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4 mr-1.5" /> {terminology.addItemLabel}
          </Button>
        </div>
      </div>

      {items.length === 0 ? (
        /* Zero Items Empty State */
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm max-w-2xl mx-auto space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-[#0B3D2E] flex items-center justify-center mx-auto">
            <CatalogIcon className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 font-serif">{terminology.emptyTitle}</h3>
          <p className="text-xs sm:text-sm text-gray-500 max-w-md mx-auto">
            {terminology.emptySubtitle}
          </p>
          <div className="pt-2">
            <Button 
              onClick={handleStartAddNew}
              className="py-3 px-6 bg-[#0B3D2E] hover:bg-[#12543e] text-white rounded-xl text-sm font-bold shadow-md cursor-pointer"
            >
              <Plus className="w-4 h-4 mr-2" /> {terminology.addFirstItemButton}
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Sidebar Categories */}
          <div className="lg:col-span-3 space-y-2">
            <div className="flex justify-between items-center mb-3 px-2">
              <h3 className="font-bold text-gray-900 text-sm">{terminology.categoriesLabel}</h3>
            </div>
            <div className="bg-white rounded-2xl p-2 shadow-sm border border-slate-100">
              <CategoryItem 
                active={selectedCategory === 'all'} 
                onClick={() => setSelectedCategory('all')} 
                icon={<CatalogIcon className="w-4 h-4" />} 
                name={terminology.allCategoryLabel} 
                count={items.length} 
              />
              {categories.filter(c => c.categoryId !== 'cat_all').map(cat => (
                <CategoryItem 
                  key={cat.categoryId}
                  active={selectedCategory === cat.categoryId} 
                  onClick={() => setSelectedCategory(cat.categoryId)} 
                  icon={<CatalogIcon className="w-4 h-4" />} 
                  name={cat.name} 
                  count={items.filter(i => i.categoryId === cat.categoryId).length} 
                />
              ))}
            </div>
          </div>

          {/* Middle Column: Item List */}
          <div className="lg:col-span-5 bg-white rounded-3xl shadow-sm p-4 flex flex-col min-h-[450px] border border-slate-100">
            <div className="flex gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input 
                  className="pl-9 h-10 bg-gray-50 border-gray-200 rounded-xl text-sm" 
                  placeholder={terminology.searchPlaceholder}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
              {filteredItems.map(item => (
                <div 
                  key={item.itemId} 
                  className={`flex gap-3 p-3 rounded-2xl border-2 transition-colors cursor-pointer ${editingItem?.itemId === item.itemId ? 'border-[#0B3D2E] bg-green-50/50' : 'border-transparent bg-gray-50 hover:bg-gray-100'}`}
                  onClick={() => { setEditingItem(item); setIsAddingNew(false); }}
                >
                  <img src={item.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&h=200&fit=crop'} alt={item.name} className="w-16 h-16 rounded-xl object-cover" />
                  <div className="flex-1 flex flex-col justify-center min-w-0">
                    <div className="flex justify-between items-start mb-0.5">
                      <h4 className="font-bold text-gray-900 text-sm truncate">{item.name}</h4>
                      <span className="font-bold text-[#0B3D2E] text-sm shrink-0 ml-2">₹{item.price}</span>
                    </div>
                    <div className="flex gap-1 mb-1">
                      {item.isBestseller && <Badge className="text-[9px] bg-amber-100 text-amber-800 hover:bg-amber-100 py-0 h-4">{terminology.bestsellerBadge}</Badge>}
                      <Badge variant="outline" className="text-[9px] text-gray-500 border-gray-200 py-0 h-4 bg-white truncate">
                        {categories.find(c => c.categoryId === item.categoryId)?.name || terminology.itemLabel}
                      </Badge>
                    </div>
                    <p className="text-[10px] text-gray-500 line-clamp-1">{item.description || 'No description added.'}</p>
                  </div>
                  <div className="flex flex-col items-center justify-between py-1 border-l border-gray-200 pl-2">
                    <div className={`w-7 h-3.5 rounded-full flex items-center p-0.5 ${item.isLive ? 'bg-green-500 justify-end' : 'bg-gray-300 justify-start'}`}>
                      <div className="w-2.5 h-2.5 bg-white rounded-full shadow-sm"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Edit Panel */}
          <div className="lg:col-span-4">
            {editingItem ? (
              <Card className="border border-slate-100 shadow-sm rounded-3xl p-6 flex flex-col">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-gray-900 font-serif text-lg">
                    {isAddingNew ? terminology.addItemLabel : terminology.editItemLabel}
                  </h3>
                  {!isAddingNew && (
                    <button 
                      onClick={() => handleDelete(editingItem.itemId)}
                      className="text-red-500 text-xs font-semibold flex items-center hover:bg-red-50 px-2 py-1 rounded-md transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-700 mb-1 block">
                      {terminology.itemLabel} Name <span className="text-red-500">*</span>
                    </label>
                    <Input 
                      value={editingItem.name} 
                      onChange={e => setEditingItem({...editingItem, name: e.target.value})}
                      placeholder={terminology.itemNamePlaceholder}
                      className="rounded-xl border-gray-200 bg-gray-50 focus-visible:ring-[#0B3D2E]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-700 mb-1 block">Description</label>
                    <Textarea 
                      value={editingItem.description} 
                      onChange={e => setEditingItem({...editingItem, description: e.target.value})}
                      placeholder={terminology.itemDescPlaceholder}
                      className="rounded-xl border-gray-200 bg-gray-50 focus-visible:ring-[#0B3D2E] min-h-[70px]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-700 mb-1 block">Price (₹) <span className="text-red-500">*</span></label>
                      <Input 
                        type="number"
                        value={editingItem.price} 
                        onChange={e => setEditingItem({...editingItem, price: parseInt(e.target.value) || 0})}
                        className="rounded-xl border-gray-200 bg-gray-50 focus-visible:ring-[#0B3D2E]"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-700 mb-1 block">Category</label>
                      <select 
                        value={editingItem.categoryId}
                        onChange={e => setEditingItem({...editingItem, categoryId: e.target.value})}
                        className="w-full h-10 rounded-xl border border-gray-200 bg-gray-50 px-3 text-xs outline-none focus:ring-1 focus:ring-[#0B3D2E]"
                      >
                        {categories.filter(c => c.categoryId !== 'cat_all').map(c => (
                          <option key={c.categoryId} value={c.categoryId}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div className="pt-3 space-y-3 border-t border-gray-100">
                    <ToggleRow 
                      label={terminology.liveToggleLabel} 
                      description={terminology.liveToggleDesc} 
                      checked={editingItem.isLive}
                      onChange={() => setEditingItem({...editingItem, isLive: !editingItem.isLive})}
                    />
                    <ToggleRow 
                      label={terminology.bestsellerLabel} 
                      description={terminology.bestsellerDesc} 
                      checked={editingItem.isBestseller}
                      onChange={() => setEditingItem({...editingItem, isBestseller: !editingItem.isBestseller})}
                    />
                  </div>

                  <div className="flex gap-2 pt-3">
                    <Button 
                      variant="outline" 
                      className="flex-1 rounded-xl h-11 text-xs text-gray-700 border-gray-200 cursor-pointer"
                      onClick={() => { setIsAddingNew(false); setEditingItem(items[0] || null); }}
                    >
                      Cancel
                    </Button>
                    <Button 
                      className="flex-1 rounded-xl h-11 bg-[#0B3D2E] text-white hover:bg-[#082e22] text-xs font-semibold cursor-pointer"
                      onClick={handleSave}
                    >
                      {isAddingNew ? terminology.createItemButton : 'Save Changes'}
                    </Button>
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="border border-slate-100 shadow-sm rounded-3xl p-6 h-full flex flex-col items-center justify-center text-center">
                <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                  <CatalogIcon className="w-6 h-6 text-gray-300" />
                </div>
                <h3 className="font-bold text-gray-900 text-sm mb-1">{terminology.selectToEditTitle}</h3>
                <p className="text-xs text-gray-500 max-w-[200px]">{terminology.selectToEditSubtitle}</p>
              </Card>
            )}
          </div>

        </div>
      )}
    </div>
  );
}

// Helpers
function StatCard({ icon, value, label }: any) {
  return (
    <div className="flex items-center gap-2.5 bg-gray-50 px-3.5 py-2 rounded-xl border border-gray-100">
      <div className="bg-white p-1.5 rounded-lg shadow-2xs">{icon}</div>
      <div>
        <div className="font-bold text-gray-900 text-sm leading-none">{value}</div>
        <div className="text-[9px] text-gray-500 uppercase tracking-wider mt-0.5">{label}</div>
      </div>
    </div>
  );
}

function CategoryItem({ active, onClick, icon, name, count }: any) {
  return (
    <div 
      className={`flex justify-between items-center px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${active ? 'bg-green-50 text-[#0B3D2E]' : 'hover:bg-gray-50 text-gray-600'}`}
      onClick={onClick}
    >
      <div className="flex items-center gap-2.5">
        <div className={`${active ? 'text-[#0B3D2E]' : 'text-gray-400'}`}>{icon}</div>
        <span className={`text-xs ${active ? 'font-bold' : 'font-medium'}`}>{name}</span>
      </div>
      <span className={`text-xs ${active ? 'font-bold' : 'text-gray-400'}`}>{count}</span>
    </div>
  );
}

function ToggleRow({ label, description, checked, onChange }: any) {
  return (
    <div className="flex justify-between items-center cursor-pointer" onClick={onChange}>
      <div>
        <h5 className="font-semibold text-xs text-gray-900">{label}</h5>
        <p className="text-[10px] text-gray-500">{description}</p>
      </div>
      <div className={`w-9 h-5 rounded-full flex items-center p-0.5 transition-colors ${checked ? 'bg-[#0B3D2E] justify-end' : 'bg-gray-300 justify-start'}`}>
        <div className="w-4 h-4 bg-white rounded-full shadow-sm"></div>
      </div>
    </div>
  );
}
