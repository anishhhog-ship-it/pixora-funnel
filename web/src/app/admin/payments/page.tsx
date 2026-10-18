'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  CreditCard,
  QrCode,
  Upload,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  Smartphone,
  ShieldCheck,
  Zap,
  Save,
  ArrowRight,
  ExternalLink,
  DollarSign,
  BellRing,
  Search,
  Filter,
  Download,
  X,
  Clock,
  AlertTriangle,
  ChevronRight,
  UserCheck,
  RotateCcw,
  Plus,
  Trash2,
  Power,
  SlidersHorizontal,
} from 'lucide-react';
import { decodeQrFromImageFile, constructUpiUri } from '@/lib/qrDecoder';
import { paymentGatewayService, PaymentGatewayConfig, PaymentOrder } from '@/services/paymentGatewayService';
import { supabase } from '@/lib/supabase/client';

export interface UpiAccount {
  id: string;
  upiId: string;
  payeeName: string;
  label: string;
  isActive: boolean;
  isPrimary: boolean;
  qrImageUrl?: string;
  dailyLimitInr?: number;
  createdAt?: string;
  updatedAt?: string;
}

export default function AdminPaymentsPage() {
  const [config, setConfig] = useState<PaymentGatewayConfig>(paymentGatewayService.getConfig());
  const [orders, setOrders] = useState<PaymentOrder[]>([]);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Multi-account UPI Management State
  const [upiAccounts, setUpiAccounts] = useState<UpiAccount[]>([]);
  const [isSwitchingUpiId, setIsSwitchingUpiId] = useState<string | null>(null);
  const [isTogglingUpiId, setIsTogglingUpiId] = useState<string | null>(null);
  const [showAddUpiModal, setShowAddUpiModal] = useState(false);
  const [newUpiData, setNewUpiData] = useState({
    upiId: '',
    payeeName: 'Pixora Automations',
    label: '',
    dailyLimitInr: 100000,
  });
  const [isAddingUpi, setIsAddingUpi] = useState(false);

  // Active Tab: 'queue' | 'transactions' | 'scanner' | 'listener'
  const [activeTab, setActiveTab] = useState<'queue' | 'transactions' | 'scanner' | 'listener'>('queue');

  // Search & Filter for Transactions
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING_APPROVAL' | 'PAID' | 'REJECTED' | 'PENDING'>('ALL');

  // Action feedback toast
  const [actionNotice, setActionNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Rejection Modal State
  const [rejectingOrder, setRejectingOrder] = useState<PaymentOrder | null>(null);
  const [rejectionReason, setRejectionReason] = useState('Invalid UPI Reference / Payment not credited');
  const [customReason, setCustomReason] = useState('');
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  // QR Decoder state
  const [isDecodingQr, setIsDecodingQr] = useState(false);
  const [decodeFeedback, setDecodeFeedback] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Webhook Test Simulator state
  const [simText, setSimText] = useState('Received ₹2,599.00 from Rajesh Kumar via UPI Ref: 429381920391');
  const [simSender, setSimSender] = useState('com.phonepe.app');
  const [isSimulating, setIsSimulating] = useState(false);
  const [simResult, setSimResult] = useState<any | null>(null);

  // Copy states
  const [copiedUtrId, setCopiedUtrId] = useState<string | null>(null);
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);

  const adminHeaders = async (): Promise<Record<string, string>> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Your admin session has expired.');
    return { Authorization: `Bearer ${session.access_token}` };
  };

  useEffect(() => {
    // Load config and accounts from API
    loadConfig();

    // Initial load of orders
    loadOrders();
    const interval = setInterval(loadOrders, 4000);
    return () => clearInterval(interval);
  }, []);

  const loadConfig = async () => {
    fetch('/api/payments/config', { headers: await adminHeaders() })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          if (data.config) setConfig(data.config);
          if (Array.isArray(data.accounts)) setUpiAccounts(data.accounts);
        }
      })
    .catch(() => null);
  };

  const loadOrders = async () => {
    fetch('/api/payments/transactions', { headers: await adminHeaders() })
      .then((res) => res.json())
      .then((data) => {
        const localList = paymentGatewayService.getAllOrders();
        if (data.success && Array.isArray(data.orders)) {
          // Merge server orders and local orders to ensure zero drops
          const map = new Map<string, PaymentOrder>();
          data.orders.forEach((o: PaymentOrder) => map.set(o.id, o));
          localList.forEach((o) => {
            if (!map.has(o.id)) map.set(o.id, o);
            else {
              // Server has precedence, but keep local UTR if server missing it
              const srv = map.get(o.id)!;
              if (!srv.utrNumber && o.utrNumber) srv.utrNumber = o.utrNumber;
            }
          });
          const merged = Array.from(map.values()).sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          setOrders(merged);
        } else {
          setOrders(localList);
        }
      })
      .catch(() => {
        setOrders(paymentGatewayService.getAllOrders());
      });
  };

  // Notification helper
  const showNotice = (type: 'success' | 'error', message: string) => {
    setActionNotice({ type, message });
    setTimeout(() => setActionNotice(null), 4500);
  };

  // ── UPI Accounts Management ──
  const handleSwitchUpi = async (id: string) => {
    setIsSwitchingUpiId(id);
    try {
      const res = await fetch('/api/payments/config', {
        method: 'POST',
        headers: { ...(await adminHeaders()), 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'switch', id }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.config) {
          setConfig(data.config);
          paymentGatewayService.updateConfig(data.config);
        }
        if (Array.isArray(data.accounts)) {
          setUpiAccounts(data.accounts);
        }
        showNotice('success', `✓ Switched active gateway to ${data.config?.upiId || 'selected account'}! Live orders and QR codes updated.`);
      } else {
        showNotice('error', data.error || 'Failed to switch active UPI account');
      }
    } catch (err: any) {
      showNotice('error', 'Error switching UPI account: ' + err.message);
    } finally {
      setIsSwitchingUpiId(null);
    }
  };

  const handleToggleUpiActive = async (id: string, currentlyActive: boolean) => {
    setIsTogglingUpiId(id);
    try {
      const res = await fetch('/api/payments/config', {
        method: 'POST',
        headers: { ...(await adminHeaders()), 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle_active', id }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.config) {
          setConfig(data.config);
          paymentGatewayService.updateConfig(data.config);
        }
        if (Array.isArray(data.accounts)) {
          setUpiAccounts(data.accounts);
        }
        showNotice('success', currentlyActive ? 'UPI account disabled' : 'UPI account activated');
      } else {
        showNotice('error', data.error || 'Failed to update account status');
      }
    } catch (err: any) {
      showNotice('error', 'Error toggling account: ' + err.message);
    } finally {
      setIsTogglingUpiId(null);
    }
  };

  const handleAddUpiAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUpiData.upiId.trim().includes('@')) {
      showNotice('error', 'Please enter a valid UPI address (must include @, e.g. business@ybl)');
      return;
    }
    setIsAddingUpi(true);
    try {
      const res = await fetch('/api/payments/config', {
        method: 'POST',
        headers: { ...(await adminHeaders()), 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add', account: newUpiData }),
      });
      const data = await res.json();
      if (data.success) {
        if (Array.isArray(data.accounts)) {
          setUpiAccounts(data.accounts);
        }
        setShowAddUpiModal(false);
        setNewUpiData({
          upiId: '',
          payeeName: config.payeeName || 'Pixora Automations',
          label: '',
          dailyLimitInr: 100000,
        });
        showNotice('success', `✓ Added new UPI account: ${newUpiData.upiId}`);
      } else {
        showNotice('error', data.error || 'Failed to add UPI ID');
      }
    } catch (err: any) {
      showNotice('error', 'Error adding account: ' + err.message);
    } finally {
      setIsAddingUpi(false);
    }
  };

  const handleDeleteUpiAccount = async (id: string, upiId: string) => {
    if (!window.confirm(`Are you sure you want to remove ${upiId}?`)) return;
    try {
      const res = await fetch('/api/payments/config', {
        method: 'POST',
        headers: { ...(await adminHeaders()), 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.config) {
          setConfig(data.config);
          paymentGatewayService.updateConfig(data.config);
        }
        if (Array.isArray(data.accounts)) {
          setUpiAccounts(data.accounts);
        }
        showNotice('success', `✓ Deleted UPI ID ${upiId}`);
      } else {
        showNotice('error', data.error || 'Failed to delete UPI ID');
      }
    } catch (err: any) {
      showNotice('error', 'Error deleting account: ' + err.message);
    }
  };

  // Copy UTR helper
  const handleCopyUtr = (utr: string, id: string) => {
    navigator.clipboard.writeText(utr);
    setCopiedUtrId(id);
    setTimeout(() => setCopiedUtrId(null), 2000);
  };

  // ── Approval Handler ──
  const handleApproveOrder = async (orderId: string, businessId: string, businessName: string) => {
    setIsSubmittingAction(true);
    try {
      // 1. Call API endpoint
      const res = await fetch('/api/payments/approve', {
        method: 'POST',
        headers: { ...(await adminHeaders()), 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, businessId, businessName }),
      });
      const data = await res.json();

      // 2. Update local service
      await paymentGatewayService.approveOrder(orderId);

      loadOrders();
       showNotice('success', `✓ Order ${orderId} approved! ${businessName} dashboard activated with lifetime access.`);
    } catch (err: any) {
      showNotice('error', err.message || 'Unable to approve order.');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // ── Rejection Handler ──
  const handleConfirmReject = async () => {
    if (!rejectingOrder) return;
    setIsSubmittingAction(true);

    const finalReason = customReason.trim() || rejectionReason;

    try {
      // 1. Call API endpoint
      await fetch('/api/payments/reject', {
        method: 'POST',
        headers: { ...(await adminHeaders()), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: rejectingOrder.id,
          reason: finalReason,
          businessId: rejectingOrder.businessId,
          businessName: rejectingOrder.businessName,
        }),
      });

      // 2. Update local service
      await paymentGatewayService.rejectOrder(rejectingOrder.id, finalReason);

      loadOrders();
      showNotice('error', `Order ${rejectingOrder.id} rejected.`);
      setRejectingOrder(null);
      setCustomReason('');
    } catch (err: any) {
      showNotice('error', err.message || 'Unable to reject order.');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // ── QR Scanner Image Upload ──
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsDecodingQr(true);
    setDecodeFeedback(null);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const dataUrl = reader.result as string;
        const decoded = await decodeQrFromImageFile(file);
        if (decoded && decoded.isUpi && decoded.upiId) {
          const updated: PaymentGatewayConfig = {
            ...config,
            upiId: decoded.upiId,
            payeeName: decoded.payeeName || config.payeeName || 'Pixora Automations',
            qrImageUrl: dataUrl,
          };
          setConfig(updated);
          setDecodeFeedback(`✓ QR Decoded Successfully! Extracted UPI ID: ${decoded.upiId}`);
        } else if (decoded && decoded.raw) {
          const updated: PaymentGatewayConfig = {
            ...config,
            qrImageUrl: dataUrl,
          };
          setConfig(updated);
          setDecodeFeedback(`✓ QR scanned: ${decoded.raw.slice(0, 40)}... (Please verify UPI ID below)`);
        } else {
          const updated: PaymentGatewayConfig = {
            ...config,
            qrImageUrl: dataUrl,
          };
          setConfig(updated);
          setDecodeFeedback('Image uploaded! Could not auto-detect standard UPI tag; please confirm UPI ID below.');
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setDecodeFeedback('Could not read image: ' + err.message);
    } finally {
      setIsDecodingQr(false);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingConfig(true);
    setSaveSuccess(null);
    setSaveError(null);

    try {
      const res = await fetch('/api/payments/config', {
        method: 'POST',
        headers: { ...(await adminHeaders()), 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      paymentGatewayService.updateConfig(config);
      setSaveSuccess('✓ Payment Gateway settings and scanner saved successfully!');
      setTimeout(() => setSaveSuccess(null), 3500);
    } catch (err: any) {
      setSaveError(err.message || 'Unable to save payment settings.');
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleSimulateNotification = async () => {
    setIsSimulating(true);
    setSimResult(null);

    try {
      const res = await fetch('/api/payments/bank-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: simText,
          sender: simSender,
        }),
      });
      const data = await res.json();
      setSimResult(data);
      loadOrders();
    } catch (err: any) {
      setSimResult({ success: false, error: err.message });
    } finally {
      setIsSimulating(false);
    }
  };

  // Export CSV
  const handleExportCsv = () => {
    if (orders.length === 0) return;
    const headers = ['Order ID', 'Business Name', 'Business ID', 'Plan', 'Amount (INR)', 'UTR / Ref No', 'Status', 'Verification', 'Created At'];
    const rows = orders.map((o) => [
      o.id,
      `"${o.businessName.replace(/"/g, '""')}"`,
      o.businessId,
      `"${o.planName.replace(/"/g, '""')}"`,
      o.amount,
      o.utrNumber || '',
      o.status,
      o.verificationMethod || '',
      o.createdAt,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `pixora_payments_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ── Computed Metrics & Filtered Data ──
  const pendingOrders = useMemo(() => {
    return orders.filter((o) => o.status === 'PENDING_APPROVAL');
  }, [orders]);

  const paidOrders = useMemo(() => {
    return orders.filter((o) => o.status === 'PAID');
  }, [orders]);

  const rejectedOrders = useMemo(() => {
    return orders.filter((o) => o.status === 'REJECTED');
  }, [orders]);

  const totalRevenue = useMemo(() => {
    return paidOrders.reduce((sum, o) => sum + (o.amount || 2599), 0);
  }, [paidOrders]);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      // Status filter
      if (statusFilter !== 'ALL' && o.status !== statusFilter) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesId = o.id.toLowerCase().includes(q);
        const matchesBiz = o.businessName.toLowerCase().includes(q);
        const matchesUtr = (o.utrNumber || '').toLowerCase().includes(q);
        return matchesId || matchesBiz || matchesUtr;
      }
      return true;
    });
  }, [orders, statusFilter, searchQuery]);

  const sampleUpiUri = constructUpiUri({
    upiId: config.upiId,
    payeeName: config.payeeName,
    amount: 2599,
    orderId: 'PX-SAMPLE-1001',
     note: 'Pixora Lifetime Plan',
  });

  const webhookUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/api/payments/bank-notification`
    : 'https://funnel.pixoraautomations.com/api/payments/bank-notification';

  return (
    <div className="w-full max-w-[1600px] mx-auto space-y-6 pb-16">
      {/* Toast Notification */}
      {actionNotice && (
        <div
          className={`fixed top-5 right-5 z-50 p-4 rounded-2xl shadow-2xl border flex items-center gap-3 transition-all animate-bounceIn ${
            actionNotice.type === 'success'
              ? 'bg-emerald-950 text-white border-emerald-500/40'
              : 'bg-rose-950 text-white border-rose-500/40'
          }`}
        >
          {actionNotice.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <span className="text-xs font-bold">{actionNotice.message}</span>
          <button
            type="button"
            onClick={() => setActionNotice(null)}
            className="text-slate-400 hover:text-white ml-2 p-1 rounded-full cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold uppercase tracking-wider mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>Admin Payment Control &amp; Approvals Module</span>
          </div>
          <h1 className="text-[28px] font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            Payment Approvals &amp; Gateway
          </h1>
          <p className="text-[14px] text-slate-500 mt-1 max-w-2xl">
             Review customer UPI transactions, verify submitted UTR numbers, and activate lifetime business licenses with 1-click approvals.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/80 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={() => setActiveTab('queue')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'queue' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>Pending Approvals</span>
            </div>
            {pendingOrders.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500 text-white animate-pulse">
                {pendingOrders.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('transactions')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'transactions' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
            <span>All Transactions ({orders.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('scanner')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'scanner' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <QrCode className="w-3.5 h-3.5 text-blue-600" />
            <span>Scanner &amp; VPA</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('listener')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'listener' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 text-purple-600" />
            <span>PhonePe Webhook</span>
          </button>
        </div>
      </div>

      {/* KPI METRICS OVERVIEW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Pending Approvals */}
        <div
          onClick={() => setActiveTab('queue')}
          className={`p-5 rounded-3xl border transition cursor-pointer shadow-xs ${
            pendingOrders.length > 0
              ? 'bg-amber-50/70 border-amber-300 hover:bg-amber-50'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Approvals</span>
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                pendingOrders.length > 0 ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20' : 'bg-slate-100 text-slate-400'
              }`}
            >
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{pendingOrders.length}</span>
            <span className="text-xs text-slate-500">requests</span>
          </div>
          <div className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-amber-800">
            {pendingOrders.length > 0 ? (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping mr-1" />
                <span>Action needed · Review UTRs</span>
              </>
            ) : (
              <span className="text-emerald-700 flex items-center gap-1">
                <Check className="w-3 h-3" /> All caught up
              </span>
            )}
          </div>
        </div>

        {/* Metric 2: Total Approved Revenue */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Approved Revenue</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">₹{totalRevenue.toLocaleString('en-IN')}</span>
          </div>
          <div className="mt-2 text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
             <span>{paidOrders.length} Approved Lifetime Licenses</span>
          </div>
        </div>

        {/* Metric 3: Active Business Licenses */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Activated Businesses</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{paidOrders.length}</span>
            <span className="text-xs text-slate-500">active</span>
          </div>
          <div className="mt-2 text-[11px] font-semibold text-blue-700">
             <span>Lifetime Full Software Suite</span>
          </div>
        </div>

        {/* Metric 4: Active Gateway UPI VPA */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Gateway VPA</span>
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <QrCode className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-lg font-mono font-extrabold text-slate-900 block truncate" title={config.upiId}>
                {config.upiId}
              </span>
            </div>
            <div className="mt-1 text-[11px] font-semibold text-slate-500 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="truncate">Payee: {config.payeeName}</span>
            </div>
          </div>
          {upiAccounts.filter((a) => a.isActive).length > 1 && (
            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase shrink-0">Switch:</span>
              <select
                value={upiAccounts.find((a) => a.isPrimary)?.id || ''}
                onChange={(e) => {
                  if (e.target.value) handleSwitchUpi(e.target.value);
                }}
                disabled={isSwitchingUpiId !== null}
                className="text-[11px] font-bold text-purple-700 bg-purple-50 border border-purple-200/80 rounded-lg px-2 py-1 outline-none cursor-pointer hover:bg-purple-100 transition max-w-[170px] truncate"
                title="Switch Primary Gateway UPI ID"
              >
                {upiAccounts.filter((a) => a.isActive).map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.label ? `${acc.label} (${acc.upiId})` : acc.upiId}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* ── TAB 1: PENDING APPROVALS QUEUE ── */}
      {activeTab === 'queue' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900">Pending Approvals Queue</h3>
                {pendingOrders.length > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-amber-100 text-amber-800 border border-amber-200">
                    {pendingOrders.length} Pending
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                 Review customer UTR reference numbers against your bank statement. Approving an order immediately unlocks their lifetime dashboard.
              </p>
            </div>

            <button
              type="button"
              onClick={loadOrders}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Queue</span>
            </button>
          </div>

          {pendingOrders.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-xs space-y-3">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shadow-inner">
                <CheckCircle2 className="w-8 h-8 stroke-[2.2]" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">All Caught Up! No Pending Approvals</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                When customers scan your QR code on their dashboard and submit their 12-digit UTR from PhonePe, Google Pay, or Paytm, their approval requests appear here in real-time.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('transactions')}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                >
                  <span>View All Past Transactions</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {pendingOrders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white rounded-3xl border-2 border-amber-300 p-6 shadow-sm hover:shadow-md transition-all flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6"
                >
                  {/* Left: Order & Business Info */}
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-extrabold bg-slate-900 text-white px-2.5 py-1 rounded-lg">
                        {order.id}
                      </span>
                      <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                        Pending Admin Review
                      </span>
                      <span className="text-xs text-slate-400 font-medium">
                        Submitted:{' '}
                        {new Date(order.submittedAt || order.createdAt).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit',
                          day: 'numeric',
                          month: 'short',
                        })}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                        {order.businessName}
                      </h4>
                      <p className="text-xs text-slate-500">
                        Business ID: <code className="text-slate-700 font-mono">{order.businessId}</code> · Plan:{' '}
                        <strong className="text-slate-800">{order.planName}</strong> (₹{order.amount.toLocaleString('en-IN')})
                      </p>
                    </div>

                    <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                      <Check className="w-3 h-3" />
                       <span>Unlocks Lifetime Full Commercial Suite Upon Approval</span>
                    </div>
                  </div>

                  {/* Middle: Submitted UTR Display with 1-Click Copy */}
                  <div className="bg-slate-950 text-white p-4 rounded-2xl border border-slate-800 space-y-1.5 shrink-0 min-w-[280px]">
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      <span>Submitted UTR / Ref No</span>
                      <span className="text-amber-400">Verify in Bank</span>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <span className="font-mono text-base font-black tracking-wider text-emerald-400">
                        {order.utrNumber || 'PENDING'}
                      </span>
                      {order.utrNumber && (
                        <button
                          type="button"
                          onClick={() => handleCopyUtr(order.utrNumber!, order.id)}
                          className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                        >
                          {copiedUtrId === order.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-300">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    <p className="text-[10px] text-slate-400">
                      Expected Amount: <strong>₹{order.amount.toLocaleString('en-IN')}</strong>
                    </p>
                  </div>

                  {/* Right: Approve & Reject Actions */}
                  <div className="flex flex-col sm:flex-row items-stretch lg:items-center gap-2.5 shrink-0 w-full lg:w-auto">
                    <button
                      type="button"
                      disabled={isSubmittingAction}
                      onClick={() => handleApproveOrder(order.id, order.businessId, order.businessName)}
                      className="py-3 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] disabled:opacity-50 text-white font-extrabold text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Check className="w-4 h-4 stroke-[3]" />
                       <span>Approve &amp; Activate (Lifetime)</span>
                    </button>

                    <button
                      type="button"
                      disabled={isSubmittingAction}
                      onClick={() => {
                        setRejectingOrder(order);
                        setCustomReason('');
                        setRejectionReason('Invalid UPI Reference / Payment not credited');
                      }}
                      className="py-3 px-4 rounded-2xl bg-white hover:bg-rose-50 border border-rose-300 text-rose-700 hover:border-rose-400 font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <X className="w-4 h-4" />
                      <span>Reject</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: ALL TRANSACTIONS & RECONCILIATION ── */}
      {activeTab === 'transactions' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Header & Controls */}
          <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">All Transactions &amp; Checkouts</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Complete audit history of customer payments, UTRs, and approval timestamps
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleExportCsv}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>

              <button
                type="button"
                onClick={loadOrders}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="p-4 bg-slate-50/70 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by Order ID, Business, or UTR..."
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Status Filter Pills */}
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setStatusFilter('ALL')}
                className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                  statusFilter === 'ALL' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({orders.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('PENDING_APPROVAL')}
                className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                  statusFilter === 'PENDING_APPROVAL' ? 'bg-amber-500 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Pending ({pendingOrders.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('PAID')}
                className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                  statusFilter === 'PAID' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Approved ({paidOrders.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('REJECTED')}
                className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                  statusFilter === 'REJECTED' ? 'bg-rose-600 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Rejected ({rejectedOrders.length})
              </button>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="overflow-x-auto min-h-[350px]">
            {filteredOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-2">
                <CreditCard className="w-10 h-10 stroke-[1.5]" />
                <p className="text-sm font-semibold text-slate-600">No transactions match your search.</p>
                <p className="text-xs text-slate-400">Try adjusting your filters or search term.</p>
              </div>
            ) : (
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100 text-[11px]">
                  <tr>
                    <th className="px-6 py-4">Order ID</th>
                    <th className="px-6 py-4">Business</th>
                    <th className="px-6 py-4">Plan / Validity</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Submitted UTR</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Verification</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredOrders.map((o) => (
                    <tr key={o.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-slate-900">{o.id}</td>
                      <td className="px-6 py-4">
                        <strong className="text-slate-800 block">{o.businessName}</strong>
                        <span className="text-[10px] text-slate-400 font-mono">{o.businessId}</span>
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        <span>{o.planName}</span>
                       <span className="block text-[10px] text-emerald-700 font-semibold">Lifetime Validity</span>
                      </td>
                      <td className="px-6 py-4 font-extrabold text-slate-900 text-sm">
                        ₹{o.amount.toLocaleString('en-IN')}
                      </td>
                      <td className="px-6 py-4">
                        {o.utrNumber ? (
                          <div className="flex items-center gap-1.5 font-mono font-bold text-slate-800">
                            <span>{o.utrNumber}</span>
                            <button
                              type="button"
                              onClick={() => handleCopyUtr(o.utrNumber!, o.id)}
                              className="text-slate-400 hover:text-slate-700 p-0.5 rounded cursor-pointer"
                              title="Copy UTR"
                            >
                              {copiedUtrId === o.id ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Not submitted</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1 ${
                            o.status === 'PAID'
                              ? 'bg-emerald-100 text-emerald-800'
                              : o.status === 'PENDING_APPROVAL'
                              ? 'bg-amber-100 text-amber-800'
                              : o.status === 'REJECTED'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {o.status === 'PAID' && <Check className="w-3 h-3" />}
                          {o.status === 'PENDING_APPROVAL' && <Clock className="w-3 h-3" />}
                          {o.status === 'REJECTED' && <X className="w-3 h-3" />}
                          {o.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500 text-[11px]">
                        {o.verificationMethod || (o.status === 'PAID' ? 'ADMIN_APPROVED' : '-')}
                        {o.rejectionReason && (
                          <span className="block text-[10px] text-rose-600 truncate max-w-[150px]" title={o.rejectionReason}>
                            Reason: {o.rejectionReason}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-400 text-[11px]">
                        {new Date(o.createdAt).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit',
                          day: 'numeric',
                          month: 'short',
                        })}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {o.status === 'PENDING_APPROVAL' ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleApproveOrder(o.id, o.businessId, o.businessName)}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-xs cursor-pointer transition flex items-center gap-1"
                            >
                              <Check className="w-3 h-3" />
                              <span>Approve</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setRejectingOrder(o);
                                setCustomReason('');
                                setRejectionReason('Invalid UPI Reference / Payment not credited');
                              }}
                              className="px-2 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-[11px] cursor-pointer transition"
                            >
                              Reject
                            </button>
                          </div>
                        ) : o.status === 'PAID' ? (
                          <span className="text-emerald-700 font-bold text-[11px] inline-flex items-center gap-1">
                            <Check className="w-3 h-3 stroke-[3]" /> Active (2 Yrs)
                          </span>
                        ) : o.status === 'REJECTED' ? (
                          <button
                            type="button"
                            onClick={() => handleApproveOrder(o.id, o.businessId, o.businessName)}
                            className="px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] cursor-pointer"
                            title="Re-approve order"
                          >
                            Re-approve
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleApproveOrder(o.id, o.businessId, o.businessName)}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-black text-white font-bold text-[11px] cursor-pointer"
                          >
                            Approve
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 3: SCANNER & VPA CONFIGURATION ── */}
      {activeTab === 'scanner' && (
        <div className="space-y-6">
          {/* UPI Accounts Management & Switcher Card */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-purple-50 text-purple-700 text-[11px] font-bold uppercase tracking-wider mb-1">
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Multi-VPA Routing Controller</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <span>Manage UPI IDs, Status &amp; Gateway Switching</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 max-w-3xl">
                  Configure multiple company UPI accounts, toggle active/disabled states to control transaction flow, and 1-click switch which primary VPA receives customer checkout payments and generates dynamic QR codes.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setNewUpiData({
                    upiId: '',
                    payeeName: config.payeeName || 'Pixora Automations',
                    label: '',
                    dailyLimitInr: 100000,
                  });
                  setShowAddUpiModal(true);
                }}
                className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-sm transition cursor-pointer flex items-center gap-1.5 shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Add New UPI ID</span>
              </button>
            </div>

            {/* List / Grid of Accounts */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {upiAccounts.map((acc) => {
                const isCurrentLive = acc.isPrimary;
                return (
                  <div
                    key={acc.id}
                    className={`p-5 rounded-2xl border transition-all flex flex-col justify-between gap-4 relative overflow-hidden ${
                      isCurrentLive
                        ? 'bg-gradient-to-br from-emerald-50/70 via-white to-blue-50/40 border-emerald-400 shadow-md ring-2 ring-emerald-400/20'
                        : acc.isActive
                        ? 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                        : 'bg-slate-50/80 border-slate-200/80 opacity-75'
                    }`}
                  >
                    {/* Top status badges */}
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        {isCurrentLive ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-600 text-white text-[10px] font-extrabold uppercase tracking-wider shadow-xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                            <span>PRIMARY GATEWAY (LIVE)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">
                            <span>STANDBY</span>
                          </span>
                        )}

                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${
                            acc.isActive
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              acc.isActive ? 'bg-emerald-600' : 'bg-slate-500'
                            }`}
                          />
                          <span>{acc.isActive ? 'Active' : 'Disabled'}</span>
                        </span>
                      </div>

                      {/* Label & Payee */}
                      <div className="space-y-0.5">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-extrabold text-slate-900 truncate">
                            {acc.label || 'UPI Account'}
                          </h4>
                          {!acc.isPrimary && (
                            <button
                              type="button"
                              onClick={() => handleDeleteUpiAccount(acc.id, acc.upiId)}
                              className="text-slate-400 hover:text-rose-600 p-1 rounded-lg transition"
                              title="Delete this UPI ID"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 truncate">Payee: {acc.payeeName}</p>
                      </div>

                      {/* VPA Address */}
                      <div className="mt-3 p-2.5 rounded-xl bg-slate-100/80 border border-slate-200/60 flex items-center justify-between gap-2">
                        <span className="font-mono font-bold text-xs text-slate-900 select-all truncate">
                          {acc.upiId}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(acc.upiId);
                            showNotice('success', `Copied ${acc.upiId}`);
                          }}
                          className="text-slate-500 hover:text-slate-800 p-1 rounded transition"
                          title="Copy UPI ID"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {acc.dailyLimitInr ? (
                        <div className="mt-2 text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                          <span>Limit: ₹{acc.dailyLimitInr.toLocaleString('en-IN')}/day</span>
                        </div>
                      ) : null}
                    </div>

                    {/* Actions: Switch to this ID & Active/Disable toggle */}
                    <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                      {isCurrentLive ? (
                        <div className="flex-1 py-2 px-3 rounded-xl bg-emerald-100/80 text-emerald-800 font-extrabold text-[11px] flex items-center justify-center gap-1.5">
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>Routing All Payments</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          disabled={!acc.isActive || isSwitchingUpiId !== null}
                          onClick={() => handleSwitchUpi(acc.id)}
                          className={`flex-1 py-2 px-3 rounded-xl font-bold text-[11px] transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer ${
                            !acc.isActive
                              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                              : 'bg-slate-900 hover:bg-black text-white hover:shadow'
                          }`}
                          title={!acc.isActive ? 'Enable account first before switching' : 'Switch active gateway to this UPI ID'}
                        >
                          {isSwitchingUpiId === acc.id ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>Switching...</span>
                            </>
                          ) : (
                            <>
                              <Zap className="w-3.5 h-3.5 text-amber-400" />
                              <span>Switch to this ID</span>
                            </>
                          )}
                        </button>
                      )}

                      {/* Active/Disable Toggle Button */}
                      <button
                        type="button"
                        disabled={isTogglingUpiId !== null || (isCurrentLive && acc.isActive)}
                        onClick={() => handleToggleUpiActive(acc.id, acc.isActive)}
                        className={`py-2 px-3 rounded-xl font-bold text-[11px] border transition cursor-pointer flex items-center gap-1 ${
                          isCurrentLive && acc.isActive
                            ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                            : acc.isActive
                            ? 'bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-700 border-slate-200 hover:border-rose-300'
                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200 font-extrabold'
                        }`}
                        title={
                          isCurrentLive && acc.isActive
                            ? 'Primary gateway cannot be disabled. Switch to another UPI first.'
                            : acc.isActive
                            ? 'Disable this UPI ID'
                            : 'Activate this UPI ID'
                        }
                      >
                        <Power className="w-3.5 h-3.5" />
                        <span>{acc.isActive ? 'Disable' : 'Enable'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Form: VPA & Image Upload */}
          <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Upload className="w-5 h-5 text-blue-600" />
                <span>Upload QR Scanner Image &amp; Details</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Upload your PhonePe, Google Pay, Paytm, or Bank QR stand photo. Our decoder reads the UPI ID and reconstructs high-res vector QRs for guests.
              </p>
            </div>

            {/* Scanner Image Dropzone */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-700 block">
                UPI Scanner Image (PNG, JPG, WebP)
              </label>

              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50/20 rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 group"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />

                {config.qrImageUrl ? (
                  <div className="space-y-2">
                    <img
                      src={config.qrImageUrl}
                      alt="Uploaded Scanner Preview"
                      className="max-h-36 mx-auto rounded-lg shadow-sm border border-slate-200 object-contain"
                    />
                    <span className="text-xs text-blue-600 font-semibold group-hover:underline block">
                      Click to replace scanner image
                    </span>
                  </div>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <QrCode className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        Click or drag to upload QR Scanner image
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Supports photo of shop stand, QR sticker, or screenshot
                      </p>
                    </div>
                  </>
                )}
              </div>

              {isDecodingQr && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-700 text-xs font-semibold flex items-center gap-2 animate-pulse">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Decoding QR code and extracting UPI VPA address...</span>
                </div>
              )}

              {decodeFeedback && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{decodeFeedback}</span>
                </div>
              )}
            </div>

            {/* VPA and Settings Form */}
            <form onSubmit={handleSaveConfig} className="space-y-4 pt-2 border-t border-slate-100">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    UPI VPA Address (ID) *
                  </label>
                  <input
                    type="text"
                    required
                    value={config.upiId}
                    onChange={(e) => setConfig({ ...config, upiId: e.target.value })}
                    placeholder="e.g. 9257378047@ybl"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 outline-none"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    PhonePe, Paytm, BHIM, or Google Pay VPA
                  </span>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Payee / Business Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={config.payeeName}
                    onChange={(e) => setConfig({ ...config, payeeName: e.target.value })}
                    placeholder="e.g. Pixora Automations"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 outline-none"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Displays in recipient UPI app upon scanning
                  </span>
                </div>
              </div>

              {/* Feedback messages */}
              {saveSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{saveSuccess}</span>
                </div>
              )}

              {saveError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{saveError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSavingConfig}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs transition cursor-pointer shadow-md flex items-center justify-center gap-2"
              >
                {isSavingConfig ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Saving Settings...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save &amp; Apply Gateway Configuration</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right Preview: Live Reconstructed Vector QR */}
          <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 to-indigo-950 rounded-3xl p-6 sm:p-7 text-white shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400 block">
                  LIVE CUSTOMER PREVIEW
                </span>
                <h4 className="text-base font-extrabold">Reconstructed Dynamic QR</h4>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                 Lifetime ₹2,599
              </span>
            </div>

            {/* QR Card Mock */}
            <div className="bg-white p-5 rounded-2xl shadow-2xl text-center space-y-3 max-w-[260px] mx-auto text-slate-900">
              <div className="flex items-center justify-center gap-1.5 text-blue-600 font-extrabold text-xs">
                <ShieldCheck className="w-4 h-4" />
                <span>NPCI Official UPI QR</span>
              </div>

              <div className="p-2 bg-slate-50 rounded-xl border border-slate-200 inline-block shadow-inner">
                <QRCodeSVG
                  value={sampleUpiUri}
                  size={190}
                  level="H"
                  includeMargin={true}
                  className="rounded-lg"
                />
              </div>

              <div className="space-y-0.5">
                <p className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">{config.payeeName}</p>
                <p className="text-[10px] font-mono text-slate-500">{config.upiId}</p>
                <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-[10px] font-extrabold text-slate-800">
                   Exact Amount: ₹2,599
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-xs space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                <Check className="w-4 h-4" />
                <span>Zero Third-Party Gateway Fees</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                 Money credits directly to your bank account with zero 2% Razorpay/Cashfree cut. Customer enters their 12-digit UTR, you approve here, and their lifetime dashboard activates!
              </p>
            </div>
          </div>
        </div>
        </div>
      )}

      {/* ── TAB 4: PHONEPE / BANK NOTIFICATION LISTENER ── */}
      {activeTab === 'listener' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-purple-600" />
                <span>Phone Notification Webhook Settings</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Configure your Android notification forwarder app (e.g. MacroDroid, Tasker, or Notification Listener) to forward incoming UPI payment alerts.
              </p>
            </div>

            {/* Webhook Endpoint */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">
                Your Webhook URL:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={webhookUrl}
                  className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-800 outline-none select-all"
                />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(webhookUrl);
                    setCopiedWebhook(true);
                    setTimeout(() => setCopiedWebhook(false), 2000);
                  }}
                  className="px-3.5 py-2.5 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedWebhook ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedWebhook ? 'Copied' : 'Copy URL'}</span>
                </button>
              </div>
            </div>

            {/* Webhook Secret */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">
                Webhook Secret (Auth Header):
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={config.webhookSecret}
                  className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-800 outline-none select-all"
                />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(config.webhookSecret);
                    setCopiedSecret(true);
                    setTimeout(() => setCopiedSecret(false), 2000);
                  }}
                  className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedSecret ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedSecret ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Setup Guide */}
            <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200/80 text-xs text-purple-950 space-y-2">
              <p className="font-bold flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-purple-700" />
                <span>3-Minute Android Setup Instructions:</span>
              </p>
              <ol className="list-decimal list-inside space-y-1 text-[11px] text-purple-900">
                <li>Install <strong>MacroDroid</strong> or <strong>Tasker</strong> on your merchant phone.</li>
                <li>Add Trigger: <em>Notification Received</em> → Select <strong>PhonePe Business</strong> or <strong>SMS</strong>.</li>
                <li>Add Action: <em>HTTP Request (POST)</em> → Paste the Webhook URL above.</li>
                <li>Body format: <code>&#123; &quot;message&quot;: &quot;[notification_text]&quot; &#125;</code></li>
              </ol>
            </div>
          </div>

          {/* Right: Webhook Notification Simulator */}
          <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <BellRing className="w-4 h-4 text-purple-600" />
                <span>Test Notification Simulator</span>
              </h4>
              <p className="text-xs text-slate-500">
                Simulate a bank SMS or PhonePe alert to verify regex pattern matching.
              </p>
            </div>

            {/* Presets */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">Preset Test Messages:</label>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setSimText('Received ₹2,599.00 from Rajesh Kumar via UPI Ref: 429381920391');
                    setSimSender('com.phonepe.app');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-semibold transition"
                >
                  PhonePe ₹2,599
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSimText('Dear SBI User, your A/c credited by Rs 2599.00 on 14Oct26 by UPI/429381920391/Rajesh');
                    setSimSender('SBIUPI');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-semibold transition"
                >
                  SBI Bank SMS ₹2,599
                </button>
              </div>
            </div>

            {/* Simulator Input Form */}
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Simulated Notification / SMS Body:
                </label>
                <textarea
                  rows={3}
                  value={simText}
                  onChange={(e) => setSimText(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:border-purple-600 focus:ring-2 focus:ring-purple-500/20 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Sender Package / App:
                </label>
                <input
                  type="text"
                  value={simSender}
                  onChange={(e) => setSimSender(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 outline-none"
                />
              </div>

              <button
                type="button"
                onClick={handleSimulateNotification}
                disabled={isSimulating || !simText.trim()}
                className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold text-xs transition cursor-pointer shadow-md flex items-center justify-center gap-2"
              >
                {isSimulating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <BellRing className="w-4 h-4" />}
                <span>Send Simulated Phone Notification</span>
              </button>
            </div>

            {/* Simulation Response Output */}
            {simResult && (
              <div className="p-4 rounded-2xl bg-slate-950 text-white font-mono text-xs space-y-2 border border-slate-800">
                <div className="flex items-center justify-between text-emerald-400 font-bold">
                  <span>Server Webhook Response:</span>
                  <span>{simResult.success ? '200 OK' : 'ERROR'}</span>
                </div>
                <pre className="overflow-x-auto text-[11px] text-slate-300 max-h-48 scrollbar-hide">
                  {JSON.stringify(simResult, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── REJECTION MODAL ── */}
      {rejectingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4 animate-scaleIn">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-rose-600 font-bold text-base">
                <AlertTriangle className="w-5 h-5 stroke-[2.2]" />
                <span>Reject Payment Reference</span>
              </div>
              <button
                type="button"
                onClick={() => setRejectingOrder(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <div>
                Order: <strong className="font-mono text-slate-900">{rejectingOrder.id}</strong>
              </div>
              <div>
                Business: <strong className="text-slate-900">{rejectingOrder.businessName}</strong>
              </div>
              <div>
                Submitted UTR: <strong className="font-mono text-slate-900">{rejectingOrder.utrNumber || 'N/A'}</strong>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">Select Reason for Rejection:</label>
              <div className="space-y-1.5">
                {[
                  'Invalid UPI Reference / Payment not credited',
                  'Amount mismatch (Expected ₹2,599)',
                  'Duplicate UTR reference already used',
                  'Other reason...',
                ].map((reason) => (
                  <label
                    key={reason}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs cursor-pointer transition ${
                      rejectionReason === reason
                        ? 'bg-rose-50 border-rose-300 text-rose-900 font-bold'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="rejectionReason"
                      value={reason}
                      checked={rejectionReason === reason}
                      onChange={() => setRejectionReason(reason)}
                      className="text-rose-600 focus:ring-rose-500"
                    />
                    <span>{reason}</span>
                  </label>
                ))}
              </div>

              {rejectionReason === 'Other reason...' && (
                <div className="pt-1">
                  <input
                    type="text"
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    placeholder="Enter custom reason for customer..."
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 outline-none focus:bg-white focus:border-rose-500"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setRejectingOrder(null)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmittingAction}
                onClick={handleConfirmReject}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-xs transition cursor-pointer shadow-sm"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ADD UPI ACCOUNT MODAL ── */}
      {showAddUpiModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Add New UPI ID</h3>
                  <p className="text-[11px] text-slate-500">Configure another bank VPA for payment routing</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddUpiModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddUpiAccount} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  UPI VPA Address *
                </label>
                <input
                  type="text"
                  required
                  value={newUpiData.upiId}
                  onChange={(e) => setNewUpiData({ ...newUpiData, upiId: e.target.value.trim() })}
                  placeholder="e.g. yourbusiness@okaxis, 9876543210@paytm"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:border-purple-600 focus:ring-2 focus:ring-purple-500/20 outline-none"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Must be a valid VPA with @ symbol (e.g. 9257378047@ybl)
                </span>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Account Label / Nickname *
                </label>
                <input
                  type="text"
                  required
                  value={newUpiData.label}
                  onChange={(e) => setNewUpiData({ ...newUpiData, label: e.target.value })}
                  placeholder="e.g. HDFC Current Account, Backup PhonePe"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-purple-600 focus:ring-2 focus:ring-purple-500/20 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Payee Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newUpiData.payeeName}
                    onChange={(e) => setNewUpiData({ ...newUpiData, payeeName: e.target.value })}
                    placeholder="e.g. Pixora Automations"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-purple-600 focus:ring-2 focus:ring-purple-500/20 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Daily Limit (₹ INR)
                  </label>
                  <input
                    type="number"
                    value={newUpiData.dailyLimitInr}
                    onChange={(e) => setNewUpiData({ ...newUpiData, dailyLimitInr: Number(e.target.value) || 100000 })}
                    placeholder="100000"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-purple-600 focus:ring-2 focus:ring-purple-500/20 outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddUpiModal(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAddingUpi}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold text-xs transition cursor-pointer shadow-sm flex items-center justify-center gap-1.5"
                >
                  {isAddingUpi ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Adding...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>Save UPI ID</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
