'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
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
  Trash2, 
  Camera, 
  Check, 
  ExternalLink,
  Sparkles,
  FolderPlus,
  Loader2,
  Upload,
  X,
  Image as ImageIcon
} from 'lucide-react';
import { menuService, businessService, getCatalogTerminology } from '@/services';
import { MenuItem, MenuCategory, Business } from '@/types';
import {
  PortalCard,
  PortalErrorState,
  PortalLoadingState,
  PortalPageHeader,
} from '@/components/client-portal/PortalUI';

// High-quality Unsplash image presets by business theme
const IMAGE_PRESETS = [
  { label: 'Food 🍲', url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&h=400&fit=crop' },
  { label: 'Coffee ☕', url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&h=400&fit=crop' },
  { label: 'Dessert 🍰', url: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&h=400&fit=crop' },
  { label: 'Drinks 🍹', url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&h=400&fit=crop' },
  { label: 'Salon / Spa ✂️', url: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&h=400&fit=crop' },
  { label: 'Retail / Product 🛍️', url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&h=400&fit=crop' },
  { label: 'Fitness / Health 🏋️', url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600&h=400&fit=crop' },
];

/**
 * Optimizes and compresses an uploaded image file via canvas.
 * Reduces raw mobile photos (5-15MB) to ~80-150KB for fast saving and loading.
 */
function compressImageFile(file: File, maxWidth = 1000, quality = 0.85): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (!dataUrl) {
        resolve('');
        return;
      }
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(dataUrl);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        } catch {
          resolve(dataUrl);
        }
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    };
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
}

export default function MenuManagementPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeBiz, setActiveBiz] = useState<Business | null>(null);
  
  // Right panel edit state
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);

  // New Category inline creation state
  const [showAddCatInput, setShowAddCatInput] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [isAddingCat, setIsAddingCat] = useState(false);

  // Direct Product Photo Upload State & Ref
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Ref to edit card for smooth scrolling on mobile
  const editPanelRef = useRef<HTMLDivElement>(null);

  // Dynamic Terminology based on business category (Menu for food/dining, Catalogue for others)
  const terminology = getCatalogTerminology(activeBiz?.category);
  const CatalogIcon = terminology.isFood ? UtensilsCrossed : BookOpen;

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      setLoadError(null);
      try {
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
      } catch (err) {
        console.error('Failed to load menu data:', err);
        setLoadError(`Could not load your ${terminology.isFood ? 'menu' : 'catalogue'} right now.`);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [loadAttempt]);

  const filteredItems = items.filter(item => {
    const matchCat = selectedCategory === 'all' || item.categoryId === selectedCategory;
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleStartAddNew = async () => {
    const bizId = activeBiz?.businessId || await businessService.getActiveBusinessId();
    const nonAllCat = categories.find(c => c.categoryId !== 'cat_all');
    const defaultCat = nonAllCat?.categoryId || 'cat_all';

    const newItem: MenuItem = {
      itemId: `item_${Date.now()}`,
      businessId: bizId,
      categoryId: defaultCat,
      name: '',
      description: '',
      price: 0,
      image: '',
      isLive: true,
      isBestseller: false,
    };
    setEditingItem(newItem);
    setIsAddingNew(true);

    // Smooth scroll on mobile if edit panel is below
    setTimeout(() => {
      editPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleCreateCategory = async () => {
    if (!newCatName.trim()) return;
    setIsAddingCat(true);
    try {
      const bizId = activeBiz?.businessId || await businessService.getActiveBusinessId();
      const created = await menuService.addCategory(bizId, newCatName.trim());
      setCategories(prev => [...prev, created]);
      if (editingItem) {
        setEditingItem({ ...editingItem, categoryId: created.categoryId });
      }
      setNewCatName('');
      setShowAddCatInput(false);
      setToastMsg({ type: 'success', text: `Category "${created.name}" created!` });
      setTimeout(() => setToastMsg(null), 3000);
    } catch (err) {
      setToastMsg({ type: 'error', text: 'Failed to create category.' });
      setTimeout(() => setToastMsg(null), 3000);
    } finally {
      setIsAddingCat(false);
    }
  };

  const handleSave = async () => {
    if (!editingItem || !editingItem.name.trim()) {
      setToastMsg({ type: 'error', text: `Please enter a ${terminology.itemLabel.toLowerCase()} name.` });
      setTimeout(() => setToastMsg(null), 3000);
      return;
    }

    setIsSaving(true);
    try {
      const bizId = activeBiz?.businessId || await businessService.getActiveBusinessId();
      const itemToSave = {
        ...editingItem,
        businessId: bizId,
      };

      if (isAddingNew) {
        const added = await menuService.addItem(itemToSave);
        setItems(prev => [added, ...prev.filter(i => i.itemId !== added.itemId)]);
        setEditingItem(added);
        setIsAddingNew(false);
        setToastMsg({ type: 'success', text: `${terminology.itemLabel} added to live ${terminology.isFood ? 'menu' : 'catalogue'}! 🎉` });
      } else {
        const updated = await menuService.updateItem(itemToSave);
        setItems(prev => prev.map(i => i.itemId === updated.itemId ? updated : i));
        setEditingItem(updated);
        setToastMsg({ type: 'success', text: `${terminology.itemLabel} updated successfully! ✅` });
      }
    } catch (err) {
      console.error('Error saving item:', err);
      setToastMsg({ type: 'error', text: 'Error saving item. Please try again.' });
    } finally {
      setIsSaving(false);
      setTimeout(() => setToastMsg(null), 3500);
    }
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm(terminology.deleteConfirmText)) return;
    try {
      const bizId = activeBiz?.businessId || await businessService.getActiveBusinessId();
      await menuService.deleteItem(itemId, bizId);
      const remaining = items.filter(i => i.itemId !== itemId);
      setItems(remaining);
      setEditingItem(remaining.length > 0 ? remaining[0] : null);
      setIsAddingNew(false);
      setToastMsg({ type: 'success', text: `${terminology.itemLabel} removed from ${terminology.isFood ? 'menu' : 'catalogue'}.` });
      setTimeout(() => setToastMsg(null), 3000);
    } catch (err) {
      setToastMsg({ type: 'error', text: 'Could not delete item.' });
    }
  };

  if (isLoading) {
    return <PortalLoadingState label={`Loading ${terminology.isFood ? 'menu' : 'catalogue'}`} />;
  }

  if (loadError) {
    return <PortalErrorState description={loadError} onRetry={() => setLoadAttempt((attempt) => attempt + 1)} />;
  }

  const liveFunnelUrl = `/f/${activeBiz?.slug || 'your-business'}/menu`;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      
      {/* Toast Alert */}
      {toastMsg && (
        <div className={`p-3.5 rounded-2xl border text-xs font-semibold flex items-center justify-between ${
          toastMsg.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <span>{toastMsg.text}</span>
          <button onClick={() => setToastMsg(null)} className="ml-3 hover:underline">Dismiss</button>
        </div>
      )}

      {/* Header */}
      <PortalPageHeader
        eyebrow="Content workspace"
        title={terminology.pageTitle}
        description={terminology.pageSubtitle}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <Link 
              href={liveFunnelUrl} 
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
            >
              <ExternalLink className="mr-1.5 h-3.5 w-3.5 text-[#0B3D2E]" />
              Live Customer View
            </Link>
            <StatCard icon={<CatalogIcon className="h-4 w-4 text-amber-500" />} value={items.length} label={terminology.totalItemsLabel} />
            <Button
              onClick={handleStartAddNew}
              className="flex cursor-pointer items-center rounded-xl bg-[#0B3D2E] px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-[#12543e]"
            >
              <Plus className="mr-1.5 h-4 w-4" /> {terminology.addItemLabel}
            </Button>
          </div>
        }
      />

      {items.length === 0 && !isAddingNew ? (
        /* Zero Items Empty State (Only when NOT actively adding an item) */
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
              className="py-3 px-6 bg-[#0B3D2E] hover:bg-[#12543e] text-white rounded-xl text-sm font-bold shadow-md cursor-pointer transition-all hover:scale-105"
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
              <button 
                onClick={() => setShowAddCatInput(!showAddCatInput)}
                className="text-[11px] font-semibold text-[#0B3D2E] hover:underline flex items-center gap-1"
              >
                <FolderPlus className="w-3.5 h-3.5" /> + Category
              </button>
            </div>

            {/* Quick Inline Category Creator */}
            {showAddCatInput && (
              <div className="p-3 bg-white rounded-2xl border border-emerald-100 shadow-sm space-y-2 mb-2 animate-in fade-in duration-200">
                <p className="text-[11px] font-semibold text-slate-700">Add New Category</p>
                <div className="flex gap-1.5">
                  <Input 
                    value={newCatName}
                    onChange={e => setNewCatName(e.target.value)}
                    placeholder="e.g. Starters, Salon..."
                    className="h-8 text-xs rounded-lg"
                    onKeyDown={e => { if (e.key === 'Enter') handleCreateCategory(); }}
                  />
                  <Button 
                    size="sm" 
                    onClick={handleCreateCategory} 
                    disabled={isAddingCat || !newCatName.trim()}
                    className="h-8 bg-[#0B3D2E] hover:bg-[#12543e] text-white px-2.5 text-xs rounded-lg"
                  >
                    {isAddingCat ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Add'}
                  </Button>
                </div>
              </div>
            )}

            <PortalCard className="rounded-2xl p-2 shadow-sm">
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
            </PortalCard>
          </div>

          {/* Middle Column: Item List */}
          <PortalCard className="flex min-h-[450px] flex-col p-4 lg:col-span-5">
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
              <Button
                size="sm"
                onClick={handleStartAddNew}
                className="h-10 px-3 bg-[#0B3D2E] hover:bg-[#12543e] text-white rounded-xl text-xs font-semibold shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4 mr-1" /> Add
              </Button>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
              {filteredItems.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  {items.length === 0 
                    ? 'No items yet. Fill out the form on the right to publish your first offering!' 
                    : 'No items match your filter.'}
                </div>
              ) : (
                filteredItems.map(item => (
                  <div 
                    key={item.itemId} 
                    className={`flex gap-3 p-3 rounded-2xl border-2 transition-all cursor-pointer ${
                      editingItem?.itemId === item.itemId && !isAddingNew 
                        ? 'border-[#0B3D2E] bg-green-50/50 shadow-sm' 
                        : 'border-transparent bg-gray-50 hover:bg-gray-100'
                    }`}
                    onClick={() => { 
                      setEditingItem(item); 
                      setIsAddingNew(false);
                      if (window.innerWidth < 1024) {
                        editPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                    }}
                  >
                    {item.image ? (
                      <img 
                        src={item.image} 
                        alt={item.name} 
                        className="w-16 h-16 rounded-xl object-cover shrink-0" 
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-slate-100 border border-slate-200 flex flex-col items-center justify-center shrink-0 text-slate-400">
                        <ImageIcon className="w-5 h-5" />
                        <span className="text-[8px] font-medium mt-0.5">No photo</span>
                      </div>
                    )}
                    <div className="flex-1 flex flex-col justify-center min-w-0">
                      <div className="flex justify-between items-start mb-0.5">
                        <h4 className="font-bold text-gray-900 text-sm truncate">{item.name}</h4>
                        <span className="font-bold text-[#0B3D2E] text-sm shrink-0 ml-2">₹{item.price}</span>
                      </div>
                      <div className="flex gap-1 mb-1">
                        {item.isBestseller && (
                          <Badge className="text-[9px] bg-amber-100 text-amber-800 hover:bg-amber-100 py-0 h-4">
                            {terminology.bestsellerBadge}
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-[9px] text-gray-500 border-gray-200 py-0 h-4 bg-white truncate">
                          {categories.find(c => c.categoryId === item.categoryId)?.name || 'General'}
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
                ))
              )}
            </div>
          </PortalCard>

          {/* Right Column: Edit Panel */}
          <div className="lg:col-span-4" ref={editPanelRef}>
            {editingItem ? (
              <Card className="border border-slate-100 shadow-sm rounded-3xl p-6 flex flex-col">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="font-bold text-gray-900 font-serif text-lg leading-tight">
                      {isAddingNew ? terminology.addItemLabel : terminology.editItemLabel}
                    </h3>
                    <p className="text-[11px] text-gray-500">
                      {isAddingNew ? 'Enter details to display on your live mobile menu' : 'Make edits and tap save changes'}
                    </p>
                  </div>
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
                  {/* Name */}
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

                  {/* Description */}
                  <div>
                    <label className="text-xs font-semibold text-gray-700 mb-1 block">Description</label>
                    <Textarea 
                      value={editingItem.description} 
                      onChange={e => setEditingItem({...editingItem, description: e.target.value})}
                      placeholder={terminology.itemDescPlaceholder}
                      className="rounded-xl border-gray-200 bg-gray-50 focus-visible:ring-[#0B3D2E] min-h-[65px]"
                    />
                  </div>

                  {/* Price & Category */}
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
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-xs font-semibold text-gray-700 block">Category</label>
                        <button
                          type="button"
                          onClick={() => setShowAddCatInput(true)}
                          className="text-[10px] text-[#0B3D2E] font-semibold hover:underline"
                        >
                          + New
                        </button>
                      </div>
                      <select 
                        value={editingItem.categoryId}
                        onChange={e => setEditingItem({...editingItem, categoryId: e.target.value})}
                        className="w-full h-10 rounded-xl border border-gray-200 bg-gray-50 px-3 text-xs outline-none focus:ring-1 focus:ring-[#0B3D2E]"
                      >
                        <option value="cat_all">General / Uncategorized</option>
                        {categories.filter(c => c.categoryId !== 'cat_all').map(c => (
                          <option key={c.categoryId} value={c.categoryId}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Direct Photo Upload Section (No paste link) */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                        <span>{terminology.itemLabel} Photo</span>
                        <span className="text-[10px] text-gray-400 font-normal">(Upload directly)</span>
                      </label>
                      {editingItem.image && (
                        <button
                          type="button"
                          onClick={() => setEditingItem({ ...editingItem, image: '' })}
                          className="text-[11px] text-red-500 hover:text-red-700 font-medium flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>

                    {/* Hidden Native File Input */}
                    <input 
                      ref={photoInputRef}
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file || !editingItem) return;
                        setIsUploadingImage(true);
                        try {
                          const dataUrl = await compressImageFile(file);
                          if (dataUrl) {
                            setEditingItem({
                              ...editingItem,
                              image: dataUrl,
                            });
                            setToastMsg({ type: 'success', text: 'Photo uploaded successfully! 📸' });
                            setTimeout(() => setToastMsg(null), 3000);
                          }
                        } catch (err) {
                          console.error('Failed to process image:', err);
                          setToastMsg({ type: 'error', text: 'Failed to upload photo.' });
                        } finally {
                          setIsUploadingImage(false);
                          if (e.target) e.target.value = '';
                        }
                      }}
                      className="hidden"
                      id="product-photo-upload"
                    />

                    {/* Image Preview & Upload Controls */}
                    {editingItem.image ? (
                      <div className="space-y-2">
                        <div className="relative w-full h-36 rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 shadow-xs group">
                          <img 
                            src={editingItem.image} 
                            alt="Product Preview" 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              (e.target as any).src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&h=400&fit=crop';
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                          
                          <span className="absolute bottom-2 left-2.5 inline-flex items-center gap-1 bg-black/60 backdrop-blur-md text-white text-[10px] font-medium px-2 py-0.5 rounded-full border border-white/20">
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span>Photo Uploaded</span>
                          </span>

                          <button
                            type="button"
                            onClick={() => photoInputRef.current?.click()}
                            disabled={isUploadingImage}
                            className="absolute bottom-2 right-2 inline-flex items-center gap-1 bg-white hover:bg-slate-100 text-slate-800 text-[10px] font-bold px-2.5 py-1 rounded-xl shadow-md transition-all cursor-pointer hover:scale-105 disabled:opacity-60"
                          >
                            <Camera className="w-3 h-3 text-[#0B3D2E]" />
                            <span>{isUploadingImage ? 'Uploading...' : 'Change Photo'}</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Click or Drag-and-Drop Upload Area */
                      <div
                        onClick={() => photoInputRef.current?.click()}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={async (e) => {
                          e.preventDefault();
                          const file = e.dataTransfer.files?.[0];
                          if (!file || !editingItem) return;
                          setIsUploadingImage(true);
                          try {
                            const dataUrl = await compressImageFile(file);
                            if (dataUrl) {
                              setEditingItem({
                                ...editingItem,
                                image: dataUrl,
                              });
                              setToastMsg({ type: 'success', text: 'Photo uploaded! 📸' });
                              setTimeout(() => setToastMsg(null), 3000);
                            }
                          } catch (err) {
                            console.error('Failed to process dropped image:', err);
                          } finally {
                            setIsUploadingImage(false);
                          }
                        }}
                        className={`w-full p-5 rounded-2xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-2 group ${
                          isUploadingImage 
                            ? 'border-emerald-500 bg-emerald-50/40' 
                            : 'border-slate-300 hover:border-[#0B3D2E] bg-slate-50/80 hover:bg-emerald-50/20'
                        }`}
                      >
                        {isUploadingImage ? (
                          <div className="py-2 flex flex-col items-center gap-1.5">
                            <Loader2 className="w-6 h-6 text-[#0B3D2E] animate-spin" />
                            <p className="text-xs font-semibold text-slate-700">Optimizing &amp; uploading photo...</p>
                          </div>
                        ) : (
                          <>
                            <div className="w-11 h-11 rounded-2xl bg-white shadow-xs border border-slate-200 flex items-center justify-center text-[#0B3D2E] group-hover:scale-110 transition-transform">
                              <Upload className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-800 group-hover:text-[#0B3D2E] transition-colors">
                                Upload Product Photo
                              </p>
                              <p className="text-[10px] text-slate-500 mt-0.5">
                                Tap to choose from your device or take a photo
                              </p>
                            </div>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-200/60 text-[9px] font-medium text-slate-600">
                              PNG, JPG, WebP supported
                            </span>
                          </>
                        )}
                      </div>
                    )}

                    {/* Quick Preset Chips (Optional fallback) */}
                    <div className="mt-3">
                      <p className="text-[10px] text-gray-500 mb-1.5 font-medium">Or choose a preset photo (optional):</p>
                      <div className="flex flex-wrap gap-1.5">
                        {IMAGE_PRESETS.map((p, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setEditingItem({ ...editingItem, image: p.url })}
                            className="px-2 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[10px] text-slate-700 font-medium transition-colors cursor-pointer"
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {/* Toggles */}
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

                  {/* Actions */}
                  <div className="flex gap-2 pt-3">
                    <Button 
                      variant="outline" 
                      className="flex-1 rounded-xl h-11 text-xs text-gray-700 border-gray-200 cursor-pointer"
                      onClick={() => { 
                        setIsAddingNew(false); 
                        if (items.length > 0) setEditingItem(items[0]);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button 
                      disabled={isSaving}
                      className="flex-1 rounded-xl h-11 bg-[#0B3D2E] text-white hover:bg-[#082e22] text-xs font-semibold cursor-pointer shadow-sm"
                      onClick={handleSave}
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Saving...
                        </>
                      ) : (
                        isAddingNew ? terminology.createItemButton : 'Save Changes'
                      )}
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
                <p className="text-xs text-gray-500 max-w-[200px] mb-4">{terminology.selectToEditSubtitle}</p>
                <Button
                  onClick={handleStartAddNew}
                  className="rounded-xl bg-[#0B3D2E] text-white text-xs font-semibold cursor-pointer"
                >
                  <Plus className="w-4 h-4 mr-1.5" /> {terminology.addItemLabel}
                </Button>
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
