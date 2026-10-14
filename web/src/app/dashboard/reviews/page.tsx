'use client';

import { useState, useEffect } from 'react';
import { Search, Star, Bot, CheckCircle, Clock, MoreVertical, ExternalLink, Edit2, Copy, Smile, MessageSquare, AlertCircle, RefreshCw } from 'lucide-react';
import { reviewService, replyEngine, businessService, googleBusinessProfileService } from '@/services';
import { GoogleConnectionBadge, GoogleBadgeStatus } from '@/components/GoogleConnectionBadge';
import { Review, Business } from '@/types';
import { cn } from '@/lib/utils';
import {
  PortalCard,
  PortalErrorState,
  PortalLoadingState,
  PortalStatCard,
} from '@/components/client-portal/PortalUI';

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [selected, setSelected] = useState<Review | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [search, setSearch] = useState('');
  const [replyText, setReplyText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [googleStatus, setGoogleStatus] = useState<GoogleBadgeStatus>('not_connected');
  const [lastSyncedAt, setLastSyncedAt] = useState<string | undefined>(undefined);
  const [replyMode, setReplyMode] = useState<'suggestion' | 'custom'>('suggestion');
  const [activeBiz, setActiveBiz] = useState<Business | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
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

        const [data, connInfo] = await Promise.all([
          reviewService.getReviews(bizId),
          googleBusinessProfileService.getConnectionStatus(biz),
        ]);

        setReviews(data);
        if (data.length > 0) {
          setSelected(data[0]);
          if (data[0].replyText) setReplyText(data[0].replyText);
        }

        if (connInfo.status === 'connected') {
          setGoogleStatus('connected');
          setLastSyncedAt(connInfo.lastSyncedAt);
        } else if (connInfo.status === 'reconnect_required') {
          setGoogleStatus('requires_auth');
        } else {
          // Query status diagnostics
          try {
            const accountsData = await googleBusinessProfileService.getAccountsAndStatus({ businessId: bizId });
            if (accountsData.integrationStatus === 'access_pending') {
              setGoogleStatus('access_pending');
            } else if (accountsData.accounts.length > 0) {
              setGoogleStatus('connected');
            } else {
              setGoogleStatus('not_connected');
            }
          } catch {
            setGoogleStatus('not_connected');
          }
        }
      } catch (err) {
        console.error('Failed to load reviews:', err);
        setLoadError('Reviews are temporarily unavailable.');
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [loadAttempt]);

  const handleSyncGoogle = async () => {
    if (!activeBiz) return;
    setIsSyncing(true);
    setActionNotice(null);
    try {
      const bizId = activeBiz.businessId || activeBiz.id || '';
      const result = await googleBusinessProfileService.syncReviews(bizId);

      const now = new Date().toISOString();
      setLastSyncedAt(now);

      if (result.success) {
        setGoogleStatus('connected');
        const freshReviews = await reviewService.getReviews(bizId);
        setReviews(freshReviews);
        if (freshReviews.length > 0) {
          const matchSelected = selected ? freshReviews.find(r => r.reviewId === selected.reviewId) : freshReviews[0];
          setSelected(matchSelected || freshReviews[0]);
          if (matchSelected?.replyText) setReplyText(matchSelected.replyText);
        }
        setActionNotice(result.message || `${result.syncedCount} reviews synchronized from Google My Business! ✨`);
      } else if (result.status === 'access_pending') {
        setGoogleStatus('access_pending');
        setActionNotice('Google API access approval is pending on Google Cloud project pixora-funnel-511104. Merchant profile is connected.');
      } else if (result.status === 'requires_auth') {
        setGoogleStatus('requires_auth');
        setActionNotice('Please connect your Google Business Profile in Settings to enable live review sync.');
      } else {
        setActionNotice(result.message || 'Could not synchronize reviews from Google.');
      }
    } catch (err: any) {
      setActionNotice(err?.message || 'Error occurred during review synchronization.');
    } finally {
      setIsSyncing(false);
      setTimeout(() => setActionNotice(null), 6000);
    }
  };

  const handleGenerate = async () => {
    if (!selected) return;
    setIsGenerating(true);
    try {
      const reply = await replyEngine.generateReplySuggestion(selected, activeBiz?.name || 'our business');
      setReplyText(reply);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePost = async () => {
    if (!selected || !activeBiz || isPosting) return;
    const bizId = activeBiz.businessId || activeBiz.id || '';
    const textToPost = replyText || 'Thank you for your valuable feedback!';
    setIsPosting(true);
    setActionNotice(null);

    try {
      const result = await googleBusinessProfileService.postReply({
        businessId: bizId,
        googleReviewId: selected.reviewId,
        replyText: textToPost,
        source: 'manual',
        mode: 'publish',
      });

      if (result.status === 'posted') {
        const updatedReview: Review = {
          ...selected,
          replyStatus: 'replied',
          replyText: textToPost,
        };
        setReviews(prev => prev.map(r => r.reviewId === selected.reviewId ? updatedReview : r));
        setSelected(updatedReview);
        setActionNotice('Reply published to Google Maps live! 🎉');
      } else if (result.status === 'access_pending') {
        const draftReview: Review = {
          ...selected,
          replyStatus: 'draft',
          replyText: textToPost,
        };
        setReviews(prev => prev.map(r => r.reviewId === selected.reviewId ? draftReview : r));
        setSelected(draftReview);
        setActionNotice('Reply saved locally as a draft. Google My Business API access approval is pending on project pixora-funnel-511104.');
      } else if (result.status === 'requires_auth') {
        setActionNotice('Google authorization required to publish live. Link profile in Settings.');
      } else {
        setActionNotice(result.message || 'Could not publish reply.');
      }
    } catch (err: any) {
      setActionNotice(err?.message || 'Error while posting review reply.');
    } finally {
      setIsPosting(false);
      setTimeout(() => setActionNotice(null), 6000);
    }
  };

  const handleSaveDraft = async () => {
    if (!selected || !activeBiz || !replyText.trim()) return;
    const bizId = activeBiz.businessId || activeBiz.id || '';
    try {
      await googleBusinessProfileService.postReply({
        businessId: bizId,
        googleReviewId: selected.reviewId,
        replyText: replyText.trim(),
        source: 'manual',
        mode: 'draft',
      });
      const draftReview: Review = {
        ...selected,
        replyStatus: 'draft',
        replyText: replyText.trim(),
      };
      setReviews(prev => prev.map(r => r.reviewId === selected.reviewId ? draftReview : r));
      setSelected(draftReview);
      setActionNotice('Reply saved as draft! ✍️');
      setTimeout(() => setActionNotice(null), 4000);
    } catch (err: any) {
      setActionNotice('Failed to save draft.');
    }
  };

  const repliedCount = reviews.filter(r => r.replyStatus === 'replied' || r.replyStatus === 'auto_replied').length;
  const draftCount = reviews.filter(r => r.replyStatus === 'draft').length;
  const pendingCount = reviews.filter(r => r.replyStatus === 'pending').length;
  const negativeCount = reviews.filter(r => r.sentiment === 'negative' || r.rating <= 2).length;

  const tabs = [
    `All Reviews (${reviews.length})`,
    `Replied (${repliedCount})`,
    `Drafts (${draftCount})`,
    `Pending (${pendingCount})`,
    `Negative (${negativeCount})`
  ];

  const filteredReviews = reviews.filter(r => {
    const matchSearch = r.reviewerName.toLowerCase().includes(search.toLowerCase()) || r.text.toLowerCase().includes(search.toLowerCase());
    if (activeTab === 1) return (r.replyStatus === 'replied' || r.replyStatus === 'auto_replied') && matchSearch;
    if (activeTab === 2) return r.replyStatus === 'draft' && matchSearch;
    if (activeTab === 3) return r.replyStatus === 'pending' && matchSearch;
    if (activeTab === 4) return (r.sentiment === 'negative' || r.rating <= 2) && matchSearch;
    return matchSearch;
  });

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '0.0';

  const responseRate = reviews.length > 0
    ? `${Math.round((repliedCount / reviews.length) * 100)}%`
    : '0%';

  if (isLoading) {
    return <PortalLoadingState label="Loading customer reviews" />;
  }

  if (loadError) {
    return <PortalErrorState description={loadError} onRetry={() => setLoadAttempt((attempt) => attempt + 1)} />;
  }

  return (
    <div className="flex flex-col gap-5 pb-10">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h1 className="text-lg font-bold text-gray-900 tracking-tight">Customer Reviews</h1>
            <GoogleConnectionBadge
              status={googleStatus}
              lastSyncedAt={lastSyncedAt}
              compact
            />
          </div>
          <p className="text-xs text-gray-500">Manage, analyze, and reply to Google reviews for your business</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <GoogleConnectionBadge
            status={googleStatus}
            locationName={activeBiz?.name}
            lastSyncedAt={lastSyncedAt}
            showSyncButton
            onSync={handleSyncGoogle}
            isSyncing={isSyncing}
          />
        </div>
      </div>

      {/* Action Notice */}
      {actionNotice && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between">
          <span>{actionNotice}</span>
          <button onClick={() => setActionNotice(null)} className="text-emerald-600 hover:text-emerald-800">Dismiss</button>
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          icon={<Star className="w-5 h-5 fill-amber-400 text-amber-400" />} 
          bg="bg-amber-50" 
          value={reviews.length.toString()} 
          title="Total Reviews" 
          sub="Verified Google reviews" 
        />
        <StatCard 
          icon={<SmileIcon />} 
          bg="bg-blue-50" 
          value={avgRating} 
          title="Average Rating" 
          sub={reviews.length > 0 ? "Out of 5 stars" : "No ratings yet"} 
        />
        <StatCard 
          icon={<MessageIcon />} 
          bg="bg-blue-50" 
          value={repliedCount.toString()} 
          title="Responded" 
          sub={`${responseRate} response rate`} 
        />
        <StatCard 
          icon={<UsersIcon />} 
          bg="bg-rose-50" 
          value={pendingCount.toString()} 
          title="Awaiting Response" 
          sub="Pending owner reply" 
        />
      </div>

      {/* Main 2-col grid */}
      <div className="flex flex-col lg:flex-row gap-5 flex-1 min-h-0">
        {/* Review List */}
        <PortalCard className="flex min-w-0 flex-1 flex-col overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-gray-100 px-5 pt-4 overflow-x-auto no-scrollbar">
            {tabs.map((tab, i) => (
              <button
                key={i}
                onClick={() => setActiveTab(i)}
                className={cn(
                  'text-sm font-semibold pb-3 mr-6 border-b-2 transition-colors whitespace-nowrap cursor-pointer',
                  activeTab === i ? 'border-[blue-600] text-[blue-600]' : 'border-transparent text-gray-400 hover:text-gray-600'
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3 px-5 py-3 border-b border-gray-100">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-1 focus:ring-[blue-600] focus:border-[blue-600]"
                placeholder="Search reviews, names or keywords..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Review Rows */}
          <div className="overflow-y-auto flex-1 custom-scrollbar min-h-[300px]">
            {filteredReviews.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mb-3">
                  <Star className="w-8 h-8 text-gray-300" />
                </div>
                <h4 className="text-sm font-bold text-gray-900 mb-1">
                  {reviews.length === 0 ? 'No Google reviews yet' : 'No matching reviews'}
                </h4>
                <p className="text-xs text-gray-500 max-w-sm mb-4">
                  {reviews.length === 0 
                    ? 'When customers scan your QR code or submit reviews on Google Maps, they will appear here in real time.'
                    : 'Try clearing your search query or switching tabs.'}
                </p>
                {reviews.length === 0 && activeBiz && (
                  <a
                    href={`/f/${activeBiz.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[blue-600] text-white text-xs font-semibold hover:bg-blue-700 transition-colors"
                  >
                    <span>Test Your Review Funnel</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            ) : (
              filteredReviews.map(review => (
                <div
                  key={review.reviewId}
                  className={cn(
                    'flex items-start gap-3 px-5 py-3 border-b border-gray-50 cursor-pointer transition-colors',
                    selected?.reviewId === review.reviewId ? 'bg-blue-50 border-l-2 border-l-[blue-600]' : 'hover:bg-gray-50'
                  )}
                  onClick={() => { setSelected(review); setReplyText(review.replyText || ''); }}
                >
                  <img 
                    src={review.reviewerImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(review.reviewerName)}&background=0B3D2E&color=fff`} 
                    alt={review.reviewerName}
                    className="w-9 h-9 rounded-full object-cover flex-shrink-0" 
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className="font-semibold text-sm text-gray-900">{review.reviewerName}</span>
                      <div className="flex">
                        {[...Array(5)].map((_,i) => (
                          <Star key={i} className={cn('w-3 h-3', i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200')} />
                        ))}
                      </div>
                      <span className="text-[11px] text-gray-400">
                        {review.date ? new Date(review.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Recent'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{review.text || 'Rating only, no written review.'}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 mt-1">
                    <GoogleBadge />
                    <SentimentBadge sentiment={review.sentiment} />
                    <ReplyStatusBadge status={review.replyStatus} />
                    <button className="text-xs font-semibold text-gray-600 border border-gray-200 px-3 py-1 rounded-lg hover:border-[blue-600] hover:text-[blue-600] transition-colors">
                      View →
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </PortalCard>

        {/* Detail Panel */}
        {selected && (
          <PortalCard className="flex w-full flex-shrink-0 flex-col overflow-hidden lg:w-80">
            {/* Reviewer Header */}
            <div className="p-4 border-b border-gray-100">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <img 
                    src={selected.reviewerImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(selected.reviewerName)}&background=0B3D2E&color=fff`} 
                    alt={selected.reviewerName}
                    className="w-10 h-10 rounded-full" 
                  />
                  <div>
                    <p className="font-semibold text-sm text-gray-900">{selected.reviewerName}</p>
                    <p className="text-[11px] text-gray-400">
                      {selected.date ? new Date(selected.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Verified Review'}
                    </p>
                  </div>
                </div>
                {activeBiz?.googleReviewUrl && (
                  <a 
                    href={activeBiz.googleReviewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-semibold text-[blue-600] flex items-center gap-1 hover:underline"
                  >
                    View on Google <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
              <div className="flex gap-1 mb-2">
                {[...Array(5)].map((_,i) => (
                  <Star key={i} className={cn('w-4 h-4', i < selected.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200')} />
                ))}
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">{selected.text || 'Customer left a star rating without text.'}</p>
              {selected.tags && selected.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {selected.tags.map(tag => (
                    <span key={tag} className="text-[10px] font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">{tag}</span>
                  ))}
                </div>
              )}
            </div>

            {/* AI Reply Suggestion */}
            <div className="p-4 border-b border-gray-100">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-semibold text-gray-800 flex items-center gap-1.5">
                  <span className="text-[blue-600]">✨</span> Reply Assistant
                  {activeBiz?.planStatus !== 'active' && (
                    <span className="text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded ml-1">
                      Trial (Manual Only)
                    </span>
                  )}
                </span>
                <button 
                  onClick={() => setReplyMode('custom')}
                  className="text-[11px] text-gray-500 hover:text-gray-700 flex items-center gap-0.5 cursor-pointer"
                >
                  <Edit2 className="w-2.5 h-2.5" /> Customise
                </button>
              </div>

              {activeBiz?.planStatus !== 'active' && (
                <div className="mb-2 text-[11px] text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-200 flex items-center justify-between">
                  <span>Auto Reply is off for trial accounts.</span>
                  <a href="/dashboard/auto-reply" className="text-blue-600 font-bold hover:underline">
                    View Plans →
                  </a>
                </div>
              )}

              {replyText ? (
                <div className="bg-blue-50 border border-green-100 rounded-xl p-3 text-xs text-gray-700 leading-relaxed mb-3">
                  {replyText}
                </div>
              ) : (
                <div className="bg-gray-50 rounded-xl p-3 mb-3 flex flex-col items-center justify-center min-h-[80px] gap-1.5">
                  {isGenerating ? (
                    <div className="flex gap-1">
                      {[0,1,2].map(i => (
                        <div key={i} className="w-1.5 h-1.5 bg-[blue-600] rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                      ))}
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={handleGenerate}
                        className="text-xs font-semibold text-[blue-600] bg-white border border-[blue-600] px-4 py-2 rounded-xl hover:bg-[blue-600] hover:text-white transition-colors cursor-pointer"
                      >
                        Generate Reply Suggestion ✨
                      </button>
                    </>
                  )}
                </div>
              )}

              {replyText && (selected.replyStatus === 'pending' || selected.replyStatus === 'draft') && (
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveDraft}
                    disabled={isPosting}
                    className="flex-1 text-slate-700 bg-slate-100 hover:bg-slate-200 text-xs font-semibold py-2.5 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Save Draft
                  </button>
                  <button
                    onClick={handlePost}
                    disabled={isPosting}
                    className="flex-1 text-white text-xs font-semibold py-2.5 rounded-xl transition-colors hover:opacity-90 cursor-pointer bg-blue-600 disabled:opacity-50"
                  >
                    {isPosting ? 'Posting...' : 'Post Reply ✈'}
                  </button>
                </div>
              )}
            </div>

            {/* Custom Reply Box */}
            <div className="p-4 flex-1 flex flex-col">
              <div className="flex gap-3 mb-3 border-b border-gray-100 pb-2">
                {['Reply Suggestion', 'Custom Reply'].map((tab, i) => (
                  <button
                    key={i}
                    onClick={() => setReplyMode(i === 0 ? 'suggestion' : 'custom')}
                    className={cn('text-xs font-semibold pb-1 border-b-2 transition-colors cursor-pointer', (i === 0 ? replyMode === 'suggestion' : replyMode === 'custom') ? 'border-[blue-600] text-[blue-600]' : 'border-transparent text-gray-400')}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              <textarea
                className="flex-1 w-full text-sm text-gray-700 border border-gray-200 rounded-xl p-3 resize-none outline-none focus:ring-1 focus:ring-[blue-600] min-h-[80px] bg-gray-50"
                placeholder="Write your custom reply..."
                value={replyMode === 'custom' ? replyText : ''}
                onChange={e => setReplyText(e.target.value)}
              />
              <div className="flex justify-between items-center mt-2 mb-3">
                <div className="flex gap-2">
                  <button onClick={() => setReplyText(prev => prev + ' 😊')} className="p-1.5 text-gray-400 hover:text-gray-600 cursor-pointer"><Smile className="w-4 h-4" /></button>
                  <button onClick={() => { if (replyText) navigator.clipboard.writeText(replyText); }} className="p-1.5 text-gray-400 hover:text-gray-600 cursor-pointer"><Copy className="w-4 h-4" /></button>
                </div>
                <span className="text-[10px] text-gray-400">{replyText.length}/500</span>
              </div>
              {(selected.replyStatus === 'pending' || selected.replyStatus === 'draft') ? (
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveDraft}
                    disabled={isPosting || !replyText.trim()}
                    className="flex-1 text-slate-700 bg-slate-100 hover:bg-slate-200 text-xs font-semibold py-2.5 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Save Draft
                  </button>
                  <button
                    onClick={handlePost}
                    disabled={!replyText.trim() || isPosting}
                    className="flex-1 text-white text-xs font-semibold py-2.5 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 bg-blue-600 hover:bg-blue-700"
                  >
                    {isPosting ? 'Posting...' : 'Post to Google ✈'}
                  </button>
                </div>
              ) : (
                <div className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold py-2.5 rounded-xl text-center flex items-center justify-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Reply published on Google</span>
                </div>
              )}
            </div>

            {/* Review Details */}
            <div className="p-4 bg-gray-50 rounded-b-2xl border-t border-gray-100">
              <h4 className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" />
                Review Details
              </h4>
              {[
                { label: 'Reviewer', value: selected.reviewerName },
                { label: 'Date', value: selected.date ? new Date(selected.date).toLocaleDateString('en-IN') : 'Recent' },
                { label: 'Rating', value: `${'★'.repeat(selected.rating)}${'☆'.repeat(5 - selected.rating)}` },
                { label: 'Source', value: 'Google Maps' },
                { label: 'Status', value: selected.replyStatus.toUpperCase() },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center py-1 text-xs">
                  <span className="text-gray-400 font-medium">{label}</span>
                  <span className="text-gray-700 font-semibold max-w-[150px] truncate text-right">{value}</span>
                </div>
              ))}
            </div>
          </PortalCard>
        )}
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────
function StatCard({ icon, bg, value, title, sub }: any) {
  return <PortalStatCard icon={icon} iconBackground={bg} value={value} title={title} description={sub} />;
}

function GoogleBadge() {
  return (
    <div className="w-5 h-5 flex-shrink-0">
      <svg viewBox="0 0 24 24" width="20" height="20">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.31-1.03 2.41-2.16 3.16v2.62h3.49c2.04-1.89 3.22-4.67 3.22-7.79z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.49-2.62c-.98.66-2.23 1.05-3.79 1.05-2.91 0-5.38-1.97-6.26-4.62H2.12v2.71C3.94 20.48 7.68 23 12 23z" fill="#34A853"/>
        <path d="M5.74 14.15c-.22-.66-.35-1.36-.35-2.15s.13-1.49.35-2.15V7.14H2.12C1.4 8.59 1 10.25 1 12s.4 3.41 1.12 4.86l3.62-2.71z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.07.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.68 1 3.94 3.52 2.12 7.14l3.62 2.71c.88-2.65 3.35-4.47 6.26-4.47z" fill="#EA4335"/>
      </svg>
    </div>
  );
}

function SentimentBadge({ sentiment }: { sentiment?: string }) {
  const map: Record<string, string> = {
    positive: 'bg-green-100 text-green-700',
    neutral: 'bg-amber-100 text-amber-700',
    negative: 'bg-red-100 text-red-700',
  };
  const val = sentiment || 'positive';
  return (
    <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full capitalize', map[val] || 'bg-gray-100 text-gray-500')}>
      {val === 'positive' ? '✓ ' : val === 'negative' ? '✗ ' : '• '}{val.charAt(0).toUpperCase() + val.slice(1)}
    </span>
  );
}

function ReplyStatusBadge({ status }: { status: string }) {
  if (status === 'replied') return <span className="text-[10px] font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full flex items-center gap-0.5"><CheckCircle className="w-2.5 h-2.5" /> Replied</span>;
  if (status === 'auto_replied') return <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full flex items-center gap-0.5"><Bot className="w-2.5 h-2.5" /> Auto Replied</span>;
  if (status === 'draft') return <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" /> Draft</span>;
  return <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" /> Pending</span>;
}

const SmileIcon = () => <svg viewBox="0 0 24 24" className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M8 13s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>;
const MessageIcon = () => <svg viewBox="0 0 24 24" className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
const UsersIcon = () => <svg viewBox="0 0 24 24" className="w-5 h-5 text-rose-400" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const Check = ({ className }: { className?: string }) => <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>;
