'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Headphones,
  MessageSquare,
  PhoneCall,
  Mail,
  LifeBuoy,
  Send,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  ShieldCheck,
  FileText,
  Sparkles,
  Search,
  Check,
  Smartphone,
  QrCode,
  Star,
  RefreshCw,
  HelpCircle,
  PhoneForwarded,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { businessService, authService, supportService } from '@/services';
import { SupportTicket, CallbackRequest } from '@/services/supportService';
import { Business } from '@/types';

const FAQS = [
  {
    q: 'How does the NFC Review Card work with customer phones?',
    a: 'NFC (Near Field Communication) works instantly when customers tap their phone against your Pixora card. On iPhones (iPhone XR & newer) and modern Android phones with NFC enabled, no app or scanner is needed—a notification automatically pops up opening your branded review funnel in 1 second.',
  },
  {
    q: 'How does Pixora protect my Google rating from negative reviews?',
    a: 'Our smart funnel separates reviews before they reach Google. Customers rating 4 or 5 stars are routed directly to your public Google Business Profile with 1 click. Customers rating 1 to 3 stars are directed to a private feedback form sent only to your owner dashboard, preventing public negative reviews on Google Maps.',
  },
  {
    q: 'How do I activate the AI Auto-Reply system?',
    a: 'AI Auto-Replies are activated with our ₹2,599 (1-Year Software) or ₹2,999 (First 100 Accounts Lifetime Free Access + NFC Card) plans. Once activated, the AI automatically drafts polite, SEO-optimized responses to incoming Google reviews in your brand tone, boosting your local search ranking.',
  },
  {
    q: 'Can I print custom QR table stands for multiple dining tables or counters?',
    a: 'Yes! Navigate to the "QR Codes" tab in your sidebar. You can generate print-ready PDF/PNG table stands with your brand logo, customized instructions, and table numbers ready for high-resolution printing.',
  },
  {
    q: 'How do I switch or update my Google Business Profile location?',
    a: 'Go to Settings > Business Profile. You can update your Google Place ID, Google Maps Review URL, address, contact numbers, and operating hours anytime.',
  },
  {
    q: 'How long does physical NFC card doorstep delivery take?',
    a: 'Physical NFC cards are custom programmed and dispatched via express courier within 24-48 business hours. Tracking details will be shared on WhatsApp, and delivery typically takes 3-5 business days across India.',
  },
];

export default function ClientSupportPage() {
  const searchParams = useSearchParams();
  const queryBiz = searchParams.get('business');

  const [activeBusiness, setActiveBusiness] = useState<Business | null>(null);
  const [activeTab, setActiveTab] = useState<'ticket' | 'my-tickets' | 'callback'>('ticket');
  
  // Ticket form state
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState<'nfc_card' | 'google_review' | 'qr_stand' | 'auto_reply' | 'billing' | 'general'>('general');
  const [priority, setPriority] = useState<'Normal' | 'High Priority' | 'Urgent'>('Normal');
  const [description, setDescription] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);
  const [ticketSuccess, setTicketSuccess] = useState<SupportTicket | null>(null);

  // Tickets list
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);
  const [ticketSearch, setTicketSearch] = useState('');

  // Callback form state
  const [callbackName, setCallbackName] = useState('');
  const [callbackPhone, setCallbackPhone] = useState('');
  const [callbackSlot, setCallbackSlot] = useState('Within 15 minutes');
  const [callbackQuery, setCallbackQuery] = useState('');
  const [isSubmittingCallback, setIsSubmittingCallback] = useState(false);
  const [callbackSuccess, setCallbackSuccess] = useState<CallbackRequest | null>(null);

  // FAQ accordion state
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  useEffect(() => {
    async function initBiz() {
      const biz = await businessService.getActiveBusiness();
      setActiveBusiness(biz);
      if (biz?.phone) {
        setContactPhone(biz.phone);
        setCallbackPhone(biz.phone);
      }
      if (biz?.name) {
        setCallbackName(biz.name);
      }
      loadTickets(biz?.id);
    }
    initBiz();
  }, []);

  const loadTickets = async (bizId?: string) => {
    setIsLoadingTickets(true);
    try {
      const list = await supportService.getTickets(bizId);
      setTickets(list);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingTickets(false);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) return;

    setIsSubmittingTicket(true);
    try {
      const fullDesc = contactPhone 
        ? `${description}\n\n[Contact Phone: ${contactPhone}]`
        : description;

      const created = await supportService.createTicket({
        businessId: activeBusiness?.id,
        subject,
        description: fullDesc,
        category,
        priority,
      });

      setTicketSuccess(created);
      setSubject('');
      setDescription('');
      await loadTickets(activeBusiness?.id);
    } catch (err) {
      console.error('Failed to submit ticket:', err);
    } finally {
      setIsSubmittingTicket(false);
    }
  };

  const handleRequestCallback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!callbackPhone.trim()) return;

    setIsSubmittingCallback(true);
    try {
      const res = await supportService.requestCallback({
        businessId: activeBusiness?.id,
        name: callbackName || activeBusiness?.name || 'Valued Client',
        phone: callbackPhone,
        preferredTime: callbackSlot,
        query: callbackQuery,
      });

      setCallbackSuccess(res);
      setCallbackQuery('');
    } catch (err) {
      console.error('Failed to request callback:', err);
    } finally {
      setIsSubmittingCallback(false);
    }
  };

  const filteredTickets = tickets.filter(t => 
    t.subject.toLowerCase().includes(ticketSearch.toLowerCase()) ||
    t.description.toLowerCase().includes(ticketSearch.toLowerCase()) ||
    t.id.toLowerCase().includes(ticketSearch.toLowerCase())
  );

  const businessName = activeBusiness?.name || 'Your Business';
  const whatsappHelpUrl = `https://wa.me/919257378047?text=${encodeURIComponent(
    `Hello Pixora Support Team! I need assistance with my client account for "${businessName}" (Slug: ${activeBusiness?.slug || ''}).`
  )}`;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fadeIn pb-12">
      {/* Top Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 p-6 sm:p-8 text-white shadow-xl border border-slate-700/60">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Priority Support Online · Avg reply &lt; 5 mins</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Client Support &amp; Helpdesk
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-xl leading-relaxed">
              Have questions about your NFC cards, Google reviews, AI auto-replies, or QR table stands? 
              Our team is ready to assist you 24/7.
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap gap-3 shrink-0">
            <a
              href={whatsappHelpUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs sm:text-sm shadow-lg hover:shadow-emerald-500/20 transition-all hover:scale-105 cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
              <span>WhatsApp Chat</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-80" />
            </a>
            <a
              href="tel:+919257378047"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs sm:text-sm transition-all"
            >
              <PhoneCall className="w-4 h-4 text-blue-300" />
              <span>Call Helpline</span>
            </a>
          </div>
        </div>
      </div>

      {/* 3 Direct Contact Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: WhatsApp Priority */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-emerald-300 transition-all group">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-bold text-slate-900 text-sm">WhatsApp Priority</h3>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              Fastest
            </span>
          </div>
          <p className="text-xs text-slate-500 mb-4 leading-relaxed">
            Direct chat with your dedicated account manager for setup &amp; hardware queries.
          </p>
          <a
            href={whatsappHelpUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1.5"
          >
            <span>+91 92573 78047</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Card 2: Phone Hotline */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-blue-300 transition-all group">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <PhoneCall className="w-5 h-5" />
          </div>
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-bold text-slate-900 text-sm">Phone Hotline</h3>
            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              9 AM - 9 PM
            </span>
          </div>
          <p className="text-xs text-slate-500 mb-4 leading-relaxed">
            Speak directly with technical support for onboarding &amp; Google sync issues.
          </p>
          <a
            href="tel:+919257378047"
            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1.5"
          >
            <span>Call +91 92573 78047</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Card 3: Official Email */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-purple-300 transition-all group">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Mail className="w-5 h-5" />
          </div>
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-bold text-slate-900 text-sm">Email Support</h3>
            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              2h SLA
            </span>
          </div>
          <p className="text-xs text-slate-500 mb-4 leading-relaxed">
            Send screenshots, invoice requests, or custom QR branding specifications.
          </p>
          <a
            href="mailto:support@pixoraautomations.com"
            className="text-xs font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1.5 truncate"
          >
            <span>support@pixoraautomations.com</span>
            <ArrowRight className="w-3.5 h-3.5 shrink-0" />
          </a>
        </div>
      </div>

      {/* Main Support Workspace: Ticket & Callback System */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        {/* Navigation Tabs */}
        <div className="border-b border-slate-200 px-6 pt-4 flex items-center gap-2 sm:gap-4 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('ticket')}
            className={cn(
              'pb-3.5 px-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap',
              activeTab === 'ticket'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            )}
          >
            <Send className="w-4 h-4" />
            <span>Submit a Support Ticket</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('my-tickets')}
            className={cn(
              'pb-3.5 px-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap',
              activeTab === 'my-tickets'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            )}
          >
            <FileText className="w-4 h-4" />
            <span>My Support Tickets</span>
            {tickets.length > 0 && (
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-100 text-blue-700">
                {tickets.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('callback')}
            className={cn(
              'pb-3.5 px-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap',
              activeTab === 'callback'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            )}
          >
            <PhoneForwarded className="w-4 h-4" />
            <span>Request Instant Callback</span>
          </button>
        </div>

        {/* Tab 1: Submit Ticket */}
        {activeTab === 'ticket' && (
          <div className="p-6 sm:p-8">
            {ticketSuccess ? (
              <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-3">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-emerald-900">
                  Ticket #{ticketSuccess.id.replace('tkt_', 'TKT-')} Created Successfully!
                </h3>
                <p className="text-xs sm:text-sm text-emerald-700 max-w-md mx-auto">
                  Our technical support engineering team has received your ticket and is reviewing it. 
                  You will receive an update shortly in your tickets list and on WhatsApp.
                </p>
                <div className="pt-2 flex items-center justify-center gap-3">
                  <button
                    onClick={() => {
                      setTicketSuccess(null);
                      setActiveTab('my-tickets');
                    }}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition"
                  >
                    View My Tickets
                  </button>
                  <button
                    onClick={() => setTicketSuccess(null)}
                    className="px-4 py-2 bg-white border border-emerald-300 text-emerald-800 rounded-xl text-xs font-semibold hover:bg-emerald-50 transition"
                  >
                    Submit Another Query
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateTicket} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Category Selector */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Issue Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-800 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    >
                      <option value="nfc_card">💳 NFC Review Cards &amp; Tap Setup</option>
                      <option value="google_review">⭐ Google Review Routing &amp; Place Sync</option>
                      <option value="qr_stand">🔲 QR Table Stand Printing &amp; Design</option>
                      <option value="auto_reply">🤖 AI Auto Reply Configuration</option>
                      <option value="billing">💎 Billing, Plan &amp; Additional Outlets</option>
                      <option value="general">❓ General Inquiry / Technical Help</option>
                    </select>
                  </div>

                  {/* Priority Selector */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Priority Level
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['Normal', 'High Priority', 'Urgent'] as const).map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setPriority(p)}
                          className={cn(
                            'py-2.5 px-2 rounded-xl text-xs font-bold transition-all border text-center cursor-pointer',
                            priority === p
                              ? p === 'Urgent'
                                ? 'bg-red-50 border-red-500 text-red-700'
                                : p === 'High Priority'
                                ? 'bg-amber-50 border-amber-500 text-amber-700'
                                : 'bg-blue-50 border-blue-500 text-blue-700'
                              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                          )}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Subject / Summary
                  </label>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. Need assistance connecting Google Maps Place ID for auto replies"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs sm:text-sm placeholder-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Detailed Description
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Please explain the issue or request in detail. Mention any error messages or steps you have already tried..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs sm:text-sm placeholder-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 custom-scrollbar"
                  />
                </div>

                {/* Contact Phone for updates */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      WhatsApp / Contact Phone (For Live Updates)
                    </label>
                    <input
                      type="tel"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs sm:text-sm placeholder-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      type="submit"
                      disabled={isSubmittingTicket}
                      className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Send className="w-4 h-4" />
                      <span>{isSubmittingTicket ? 'Submitting Ticket...' : 'Create Support Ticket'}</span>
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Tab 2: My Tickets List */}
        {activeTab === 'my-tickets' && (
          <div className="p-6 sm:p-8 space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={ticketSearch}
                  onChange={(e) => setTicketSearch(e.target.value)}
                  placeholder="Search tickets..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <button
                type="button"
                onClick={() => loadTickets(activeBusiness?.id)}
                disabled={isLoadingTickets}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <RefreshCw className={cn('w-3.5 h-3.5', isLoadingTickets && 'animate-spin')} />
                <span>Refresh Status</span>
              </button>
            </div>

            {filteredTickets.length === 0 ? (
              <div className="text-center py-12 px-4 rounded-2xl bg-slate-50 border border-dashed border-slate-200">
                <LifeBuoy className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-700">No support tickets found</p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                  You have not raised any active tickets. If you need any assistance, submit a new ticket above.
                </p>
                <button
                  onClick={() => setActiveTab('ticket')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition"
                >
                  Create Your First Ticket
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTickets.map((t) => {
                  const statusColors = {
                    Open: 'bg-amber-50 text-amber-700 border-amber-200',
                    'Pending Reply': 'bg-blue-50 text-blue-700 border-blue-200',
                    Resolved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                  }[t.status] || 'bg-slate-100 text-slate-700 border-slate-200';

                  const priorityColors = {
                    Urgent: 'bg-red-50 text-red-600',
                    'High Priority': 'bg-amber-50 text-amber-600',
                    Normal: 'bg-slate-100 text-slate-600',
                  }[t.priority] || 'bg-slate-100 text-slate-600';

                  return (
                    <div
                      key={t.id}
                      className="p-5 rounded-2xl bg-slate-50/60 border border-slate-200 hover:border-blue-300 transition-all space-y-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-mono font-bold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-md">
                            #{t.id.replace('tkt_', 'TKT-').slice(0, 12)}
                          </span>
                          <span className={cn('text-[11px] font-bold px-2 py-0.5 rounded-full border', statusColors)}>
                            {t.status}
                          </span>
                          <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded', priorityColors)}>
                            {t.priority}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{new Date(t.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        </span>
                      </div>

                      <div>
                        <h4 className="text-sm font-bold text-slate-900">{t.subject}</h4>
                        <p className="text-xs text-slate-600 mt-1 whitespace-pre-wrap leading-relaxed">{t.description}</p>
                      </div>

                      {t.adminReply && (
                        <div className="p-3.5 rounded-xl bg-blue-50/80 border border-blue-100 text-xs space-y-1">
                          <div className="flex items-center gap-1.5 text-blue-800 font-bold">
                            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                            <span>Pixora Support Response:</span>
                          </div>
                          <p className="text-slate-700 leading-relaxed">{t.adminReply}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Request Callback */}
        {activeTab === 'callback' && (
          <div className="p-6 sm:p-8">
            {callbackSuccess ? (
              <div className="p-6 bg-blue-50 border border-blue-200 rounded-2xl text-center space-y-3">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto">
                  <PhoneForwarded className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-blue-950">Callback Scheduled!</h3>
                <p className="text-xs sm:text-sm text-blue-800 max-w-md mx-auto">
                  Our customer support lead will dial you at <strong>{callbackSuccess.phone}</strong> around <strong>{callbackSuccess.preferredTime}</strong>.
                </p>
                <button
                  onClick={() => setCallbackSuccess(null)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition"
                >
                  Schedule Another Callback
                </button>
              </div>
            ) : (
              <form onSubmit={handleRequestCallback} className="space-y-4 max-w-xl">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Your Name / Contact Person
                  </label>
                  <input
                    type="text"
                    required
                    value={callbackName}
                    onChange={(e) => setCallbackName(e.target.value)}
                    placeholder="e.g. Rajesh Kumar"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Phone Number for Call
                  </label>
                  <input
                    type="tel"
                    required
                    value={callbackPhone}
                    onChange={(e) => setCallbackPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Preferred Time Slot
                  </label>
                  <select
                    value={callbackSlot}
                    onChange={(e) => setCallbackSlot(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-800 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  >
                    <option value="Within 15 minutes">⚡ Urgent: Within 15 minutes</option>
                    <option value="Today: 2:00 PM - 5:00 PM">Today: 2:00 PM - 5:00 PM</option>
                    <option value="Today: 5:00 PM - 8:00 PM">Today: 5:00 PM - 8:00 PM</option>
                    <option value="Tomorrow Morning: 10:00 AM - 1:00 PM">Tomorrow Morning: 10:00 AM - 1:00 PM</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    What would you like assistance with?
                  </label>
                  <textarea
                    rows={3}
                    value={callbackQuery}
                    onChange={(e) => setCallbackQuery(e.target.value)}
                    placeholder="Briefly describe what you'd like our specialist to walk you through..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 custom-scrollbar"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingCallback}
                  className="py-2.5 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  <PhoneCall className="w-4 h-4" />
                  <span>{isSubmittingCallback ? 'Scheduling...' : 'Request Callback'}</span>
                </button>
              </form>
            )}
          </div>
        )}
      </div>

      {/* Frequently Asked Questions */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs">
        <div className="flex items-center gap-2 mb-6">
          <HelpCircle className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-bold text-slate-900">
            Frequently Asked Questions &amp; Setup Guide
          </h2>
        </div>

        <div className="divide-y divide-slate-100">
          {FAQS.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div key={idx} className="py-4">
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="w-full flex items-center justify-between text-left gap-4 cursor-pointer group"
                >
                  <span className="text-xs sm:text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                    {faq.q}
                  </span>
                  <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                    {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </div>
                </button>

                {isOpen && (
                  <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed pr-8 animate-fadeIn">
                    {faq.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
