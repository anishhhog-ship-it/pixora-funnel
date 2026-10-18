'use client';

import React, { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import confetti from 'canvas-confetti';
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  Copy,
  Check,
  ArrowRight,
  Sparkles,
  Smartphone,
  Lock,
  X,
  XCircle,
  RotateCcw,
  RefreshCw,
  ExternalLink,
  MessageCircle,
  AlertCircle,
  AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { paymentGatewayService, PaymentOrder } from '@/services/paymentGatewayService';
import { DEFAULT_PRICING_PLAN_SLUG, getPricingPlan } from '@/config/pricing';

interface PaymentGatewayModalProps {
  isOpen: boolean;
  onClose: () => void;
  planId?: string;
  planName?: string;
  /** Legacy compatibility only; checkout amount is always returned by the server. */
  amount?: number;
  businessId?: string;
  businessName?: string;
  onSuccess?: () => void;
}

export default function PaymentGatewayModal({
  isOpen,
  onClose,
  planId = DEFAULT_PRICING_PLAN_SLUG,
  planName = 'Lifetime Software',
  businessId = 'active',
  businessName = 'Your Business',
  onSuccess,
}: PaymentGatewayModalProps) {
  const [order, setOrder] = useState<PaymentOrder | null>(null);
  const [isLoadingOrder, setIsLoadingOrder] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [copiedAmount, setCopiedAmount] = useState(false);
  const [utrInput, setUtrInput] = useState('');
  const [isSubmittingUtr, setIsSubmittingUtr] = useState(false);
  const [utrError, setUtrError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes

  // Admin approval flow state
  const [isPendingApproval, setIsPendingApproval] = useState(false);
  const [submittedUtr, setSubmittedUtr] = useState('');
  const [copiedSubmittedUtr, setCopiedSubmittedUtr] = useState(false);
  const [isRejected, setIsRejected] = useState(false);
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);

  // Cancel & Failed flow state
  const [showCancelPrompt, setShowCancelPrompt] = useState(false);
  const [isFailed, setIsFailed] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize or reset order when modal open/closed
  useEffect(() => {
    if (!isOpen) {
      if (timerRef.current) clearInterval(timerRef.current);
      if (pollRef.current) clearInterval(pollRef.current);
      setIsSuccess(false);
      setShowCancelPrompt(false);
      setIsFailed(false);
      setIsPendingApproval(false);
      setIsRejected(false);
      setRejectionReason(null);
      setOrder(null);
      setUtrInput('');
      setSubmittedUtr('');
      setUtrError(null);
      return;
    }

    setIsLoadingOrder(true);
    setTimeLeft(600);
    setIsFailed(false);
    setShowCancelPrompt(false);

    // Call API / local service to create order
    fetch('/api/payments/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        businessId,
        businessName,
        planId,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.order) {
          setOrder(data.order);
          if (data.order.status === 'PENDING_APPROVAL') {
            setIsPendingApproval(true);
            if (data.order.utrNumber) setSubmittedUtr(data.order.utrNumber);
          }
        } else {
          // Fallback to local service
          const localOrder = paymentGatewayService.createOrder({
            businessId,
            businessName,
            planId,
          });
          setOrder(localOrder);
          if (localOrder.status === 'PENDING_APPROVAL') {
            setIsPendingApproval(true);
            if (localOrder.utrNumber) setSubmittedUtr(localOrder.utrNumber);
          }
        }
      })
      .catch(() => {
        const localOrder = paymentGatewayService.createOrder({
          businessId,
          businessName,
          planId,
        });
        setOrder(localOrder);
        if (localOrder.status === 'PENDING_APPROVAL') {
          setIsPendingApproval(true);
          if (localOrder.utrNumber) setSubmittedUtr(localOrder.utrNumber);
        }
      })
      .finally(() => {
        setIsLoadingOrder(false);
      });

    // 10-minute countdown timer
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [isOpen, planId, planName, businessId, businessName]);

  // Real-time status polling every 3s
  useEffect(() => {
    if (!isOpen || !order || isSuccess || isFailed) return;

    pollRef.current = setInterval(() => {
      // 1. Check server API
      fetch(`/api/payments/status?orderId=${order.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.status === 'PAID') {
            triggerSuccessAnimation(data.order?.message || 'Payment Approved by Admin! Dashboard Activated!');
          } else if (data.status === 'REJECTED') {
            setIsRejected(true);
            setRejectionReason(data.order?.rejectionReason || 'Payment rejected: UTR could not be verified.');
          } else if (data.status === 'PENDING_APPROVAL') {
            setIsPendingApproval(true);
            if (data.order?.utrNumber) setSubmittedUtr(data.order.utrNumber);
          }
        })
        .catch(() => null);

      // 2. Check local service
      const localOrd = paymentGatewayService.getOrder(order.id);
      if (localOrd && localOrd.status === 'PAID') {
        triggerSuccessAnimation('Payment Approved by Admin! Dashboard Activated!');
      } else if (localOrd && localOrd.status === 'REJECTED') {
        setIsRejected(true);
        setRejectionReason(localOrd.rejectionReason || 'Payment rejected: UTR could not be verified.');
      } else if (localOrd && localOrd.status === 'PENDING_APPROVAL') {
        setIsPendingApproval(true);
        if (localOrd.utrNumber) setSubmittedUtr(localOrd.utrNumber);
      }
    }, 3000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [isOpen, order, isSuccess, isFailed]);

  const triggerSuccessAnimation = async (msg: string) => {
    setIsSuccess(true);
    setIsPendingApproval(false);
    setIsRejected(false);
    setIsFailed(false);
    setShowCancelPrompt(false);
    setSuccessMessage(msg);
    if (pollRef.current) clearInterval(pollRef.current);
    if (timerRef.current) clearInterval(timerRef.current);

    // Complete order locally for immediate client sync
    if (order) {
      await paymentGatewayService.completeOrder(order.id, 'ADMIN_MANUAL', 'Approved by Admin');
    }

    // Launch celebratory confetti
    try {
      confetti({
        particleCount: 90,
        spread: 75,
        origin: { y: 0.6 },
        colors: ['#22c55e', '#3b82f6', '#f59e0b', '#8b5cf6'],
      });
    } catch {}

    // Auto trigger success callback and close after celebration
    setTimeout(() => {
      if (onSuccess) onSuccess();
      onClose();
    }, 2500);
  };

  const handleCopy = (text: string, type: 'upi' | 'amount') => {
    navigator.clipboard.writeText(text);
    if (type === 'upi') {
      setCopiedUpi(true);
      setTimeout(() => setCopiedUpi(false), 2000);
    } else {
      setCopiedAmount(true);
      setTimeout(() => setCopiedAmount(false), 2000);
    }
  };

  // ── Cancel Flow Handlers ──
  const handleInitiateCancel = () => {
    if (isSuccess) {
      onClose();
      return;
    }
    if (isFailed) {
      onClose();
      return;
    }
    // Show the confirmation popup
    setShowCancelPrompt(true);
  };

  const handleConfirmCancel = () => {
    // User tapped "Yes, Cancel Payment" -> Show Transaction Failed popup
    setShowCancelPrompt(false);
    setIsFailed(true);
    if (pollRef.current) clearInterval(pollRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const handleResumePayment = () => {
    // User tapped "No, Continue Payment" -> Return to QR payment screen
    setShowCancelPrompt(false);
  };

  const handleRetryPayment = () => {
    // Reset back from failed state to payment session
    setIsFailed(false);
    setShowCancelPrompt(false);
    setUtrError(null);
    setUtrInput('');
    setTimeLeft(600);
  };

  const handleSubmitUtr = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;
    const clean = utrInput.replace(/\D/g, '').trim();
    if (clean.length < 10) {
      setUtrError('Please enter a valid 12-digit UPI Reference / UTR Number.');
      return;
    }

    setIsSubmittingUtr(true);
    setUtrError(null);

    try {
      // 1. Post to verify endpoint
      const res = await fetch('/api/payments/verify-utr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          utr: clean,
          planId: order.planId,
          businessId: order.businessId,
          businessName: order.businessName,
        }),
      });
      const data = await res.json();

      // 2. Also register in local service
      await paymentGatewayService.submitUtr(order.id, clean);

      setSubmittedUtr(clean);
      setIsPendingApproval(true);
      setIsRejected(false);
      setRejectionReason(null);
    } catch (err: any) {
      // Local fallback
      await paymentGatewayService.submitUtr(order.id, clean);
      setSubmittedUtr(clean);
      setIsPendingApproval(true);
      setIsRejected(false);
      setRejectionReason(null);
    } finally {
      setIsSubmittingUtr(false);
    }
  };

  if (!isOpen) return null;

  const config = paymentGatewayService.getConfig();
  const upiId = order?.upiUri ? new URL(order.upiUri.replace('upi://pay?', 'https://d/?')).searchParams.get('pa') || config.upiId : config.upiId;
  const checkoutPlan = getPricingPlan(order?.planId || planId);
  const checkoutPlanName = order?.planName || checkoutPlan?.name || 'Loading plan…';
  const checkoutAmount = order?.amount ?? null;
  const checkoutAmountLabel = checkoutAmount == null ? '—' : `₹${checkoutAmount.toLocaleString('en-IN')}`;
  const checkoutValidity = 'Lifetime access';
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-3 sm:p-4 backdrop-blur-md animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="gateway-title"
    >
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl border border-slate-200 flex flex-col max-h-[95vh]">
        {/* Top Gateway Trust Bar */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 px-5 py-4 text-white flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center shadow-inner">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-extrabold tracking-tight">Pixora Secure Gateway</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-1.5 py-0.5 rounded border border-emerald-500/30 flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" /> 256-Bit SSL
                </span>
              </div>
              <p className="text-[11px] text-slate-400">NPCI Official UPI 2.0 Direct Checkout</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleInitiateCancel}
            className="rounded-full p-1.5 text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close or cancel payment"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cancel Confirmation Popup Modal (Overlaid inside modal container) */}
        {showCancelPrompt && (
          <div className="absolute inset-0 z-40 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
            <div className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 text-center space-y-4 animate-scaleIn">
              <div className="w-14 h-14 mx-auto rounded-full bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center shadow-inner">
                <AlertTriangle className="w-7 h-7 stroke-[2.2]" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-lg font-extrabold text-slate-900">Cancel Payment?</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Are you sure you want to cancel? If you have already transferred money via PhonePe, GPay, or Paytm, enter your <strong>12-digit UTR number</strong> to activate your dashboard.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 text-[11px] text-amber-800 text-left flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>If you cancel now, your order will be marked as failed and your license will not activate.</span>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleResumePayment}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition shadow-sm cursor-pointer"
                >
                  No, Continue Payment
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCancel}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition cursor-pointer"
                >
                  Yes, Cancel Payment
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Content Body */}
        <div className="overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* 1. Transaction Failed / Cancelled Screen */}
          {isFailed ? (
            <div className="py-6 text-center space-y-4 animate-scaleIn">
              <div className="w-20 h-20 mx-auto rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shadow-lg border-4 border-rose-50">
                <XCircle className="w-12 h-12 stroke-[2.2]" />
              </div>

              <div className="space-y-1.5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-800 text-xs font-bold border border-rose-200">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                  TRANSACTION CANCELLED / FAILED
                </span>
                <h3 className="text-2xl font-extrabold text-slate-900">Payment Failed</h3>
                <p className="text-xs text-slate-600 max-w-sm mx-auto">
                  The payment session was cancelled before completing the UPI Reference (UTR) verification.
                </p>
              </div>

              {/* Order Details Receipt Box */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-left space-y-2 max-w-sm mx-auto">
                <div className="flex justify-between items-center text-slate-500">
                  <span>Order Ref:</span>
                  <strong className="text-slate-800 font-mono">{order?.id || 'PX-ORD-SESSION'}</strong>
                </div>
                <div className="flex justify-between items-center text-slate-500">
                  <span>Payable Amount:</span>
                  <strong className="text-slate-900 font-bold">{checkoutAmountLabel}</strong>
                </div>
                <div className="flex justify-between items-center text-slate-500">
                  <span>Status:</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 bg-rose-100 px-2 py-0.5 rounded">
                    FAILED / NOT ACTIVATED
                  </span>
                </div>
              </div>

              {/* Refund Notice Guarantee */}
              <div className="p-3.5 rounded-xl bg-blue-50/80 border border-blue-200/90 text-left text-[11px] text-blue-900 space-y-1 max-w-sm mx-auto">
                <p className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-700 shrink-0" />
                  Bank Deduction Notice:
                </p>
                <p className="text-blue-800 text-[10px] leading-relaxed">
                  If any money was debited from your bank account or UPI app, it will be automatically refunded by your bank within 24-48 business hours. If you already completed the transfer, tap <strong>Retry Payment</strong> to submit your 12-digit UTR.
                </p>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-2.5 max-w-sm mx-auto pt-2">
                <button
                  type="button"
                  onClick={handleRetryPayment}
                  className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Retry Payment</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
                >
                  Close &amp; Exit
                </button>
              </div>
            </div>
          ) : isSuccess ? (
            /* 2. Success Screen State */
            <div className="py-8 text-center space-y-4 animate-scaleIn">
              <div className="w-20 h-20 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-lg border-4 border-emerald-50">
                <CheckCircle2 className="w-12 h-12 stroke-[2.5]" />
              </div>
              <div className="space-y-1.5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  PAYMENT VERIFIED & APPROVED
                </span>
                <h3 className="text-2xl font-extrabold text-slate-900">Dashboard Activated!</h3>
                <p className="text-sm text-slate-600 max-w-sm mx-auto">
                  {successMessage || 'Your lifetime software suite and 24/7 AI Auto-Replies are now live.'}
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 inline-block">
                Order ID: <strong className="text-slate-900">{order?.id}</strong> · Validity: <strong className="text-emerald-700">{checkoutValidity}</strong>
              </div>
            </div>
          ) : isPendingApproval ? (
            /* 2.5. Awaiting Admin Approval Screen */
            <div className="py-4 text-center space-y-4 animate-scaleIn">
              {/* Pulsing Animated Radar Icon */}
              <div className="relative mx-auto w-20 h-20 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-amber-400/20 animate-ping opacity-75" />
                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-600 text-white flex items-center justify-center shadow-lg shadow-amber-500/25 relative z-10 border-4 border-amber-50">
                  <Clock className="w-10 h-10 stroke-[2.2] animate-pulse" />
                </div>
              </div>

              {/* Status Header */}
              <div className="space-y-1.5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                  AWAITING ADMIN APPROVAL
                </span>
                <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  Verification in Progress
                </h3>
                <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                  Your UPI Reference (UTR) has been submitted to the Admin Panel. The dashboard will automatically unlock with <strong>{checkoutValidity}</strong> as soon as the admin verifies your payment.
                </p>
              </div>

              {/* Rejection Alert (If Rejected by Admin) */}
              {isRejected && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-left space-y-2 max-w-sm mx-auto">
                  <div className="flex items-center gap-2 text-rose-800 font-bold text-xs">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Admin Rejection Notice</span>
                  </div>
                  <p className="text-xs text-rose-700">
                    {rejectionReason || 'UTR not verified in bank statement. Please verify your reference number.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setIsPendingApproval(false);
                      setIsRejected(false);
                      setUtrInput(submittedUtr);
                    }}
                    className="w-full py-2.5 px-3 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Re-enter / Correct UTR Number</span>
                  </button>
                </div>
              )}

              {/* Verification Proof Summary Box */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-left space-y-2.5 max-w-sm mx-auto">
                <div className="flex justify-between items-center text-slate-500">
                  <span>Order Ref:</span>
                  <strong className="text-slate-900 font-mono text-[11px]">{order?.id}</strong>
                </div>

                <div className="flex justify-between items-center text-slate-500 pt-1 border-t border-slate-200/60">
                  <span>Submitted UTR:</span>
                  <div className="flex items-center gap-1.5">
                    <strong className="text-emerald-700 font-mono font-bold tracking-wider text-[12px]">
                      {submittedUtr || order?.utrNumber || 'Submitted'}
                    </strong>
                    {submittedUtr && (
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(submittedUtr);
                          setCopiedSubmittedUtr(true);
                          setTimeout(() => setCopiedSubmittedUtr(false), 2000);
                        }}
                        className="p-1 text-slate-400 hover:text-slate-700 rounded transition cursor-pointer"
                        title="Copy UTR"
                      >
                        {copiedSubmittedUtr ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center text-slate-500 pt-1 border-t border-slate-200/60">
                  <span>Payable Amount:</span>
                  <strong className="text-slate-900 font-bold">{checkoutAmountLabel}</strong>
                </div>

                <div className="flex justify-between items-center text-slate-500 pt-1 border-t border-slate-200/60">
                  <span>License Duration:</span>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {checkoutValidity}
                  </span>
                </div>
              </div>

              {/* Live Polling Indicator */}
              <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200/80 text-[11px] text-blue-900 max-w-sm mx-auto flex items-center justify-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                <span>Auto-syncing every 3s... Will unlock instantly once approved.</span>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 max-w-sm mx-auto pt-1">
                {!isRejected && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsPendingApproval(false);
                      setUtrInput(submittedUtr);
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>Edit or Change UTR Number</span>
                  </button>
                )}

                <a
                  href={`https://wa.me/919257378047?text=${encodeURIComponent(
                    `Hi Admin! I have made a payment of ${checkoutAmountLabel} for Order ${order?.id || ''} (${businessName}). My UTR is ${submittedUtr}. Please approve and activate my dashboard.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-xs"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Send Payment Screenshot on WhatsApp</span>
                </a>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2 text-xs text-slate-400 hover:text-slate-600 transition cursor-pointer"
                >
                  Minimize &amp; Check Later (Syncs Automatically)
                </button>
              </div>
            </div>
          ) : (
            /* 3. Regular Payment Checkout Screen */
            <>
              {/* Order Summary Strip */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50/90 to-indigo-50/70 border border-blue-200/80 flex items-center justify-between gap-3 shadow-2xs">
                <div>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded">
                      Commercial License
                    </span>
                    <span className="text-[11px] font-bold text-emerald-700">✓ {checkoutValidity}</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">{checkoutPlanName}</h4>
                  <p className="text-xs text-slate-500">For: <strong className="text-slate-700">{businessName}</strong></p>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Total Payable</div>
                  <div className="text-2xl font-black text-slate-900 tracking-tight">{checkoutAmountLabel}</div>
                  <div className="text-[10px] font-semibold text-emerald-700">Zero Gateway Surcharge</div>
                </div>
              </div>

              {/* Dynamic QR Code & Scanner Reconstruction */}
              <div className="flex flex-col items-center justify-center p-5 rounded-2xl bg-white border-2 border-slate-200 shadow-sm relative">
                {/* Timer badge */}
                <div className="absolute top-3 right-3 flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200/80">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>Expires in {formattedTime}</span>
                </div>

                <div className="text-center mb-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Scan &amp; Pay via Any UPI App</p>
                </div>

                {/* QR Container */}
                <div className="p-3 bg-white rounded-2xl shadow-md border-2 border-slate-100 relative group">
                  {order?.upiUri ? (
                    <QRCodeSVG
                      value={order.upiUri}
                      size={180}
                      level="H"
                      includeMargin={true}
                      className="rounded-lg"
                    />
                  ) : (
                    <div className="w-[180px] h-[180px] flex items-center justify-center bg-slate-50 rounded-lg">
                      <RefreshCw className="w-6 h-6 text-slate-400 animate-spin" />
                    </div>
                  )}

                  {/* Center UPI Badge overlay */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2 py-0.5 rounded-md shadow-md border border-slate-200 text-[10px] font-extrabold text-blue-700 pointer-events-none">
                    UPI
                  </div>
                </div>

                <div className="mt-3 text-center">
                  <span className="text-xs font-extrabold text-slate-900 bg-slate-100 px-3 py-1 rounded-full border border-slate-200 inline-block">
                    Exact Amount: {checkoutAmountLabel}
                  </span>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Amount &amp; order note auto-filled upon scanning.
                  </p>
                </div>

                {/* Supported Apps Strip */}
                <div className="mt-4 pt-3 border-t border-slate-100 w-full flex items-center justify-center gap-3 text-[11px] font-semibold text-slate-500 flex-wrap">
                  <span className="flex items-center gap-1 text-slate-700">📱 PhonePe</span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-slate-700">Google Pay</span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-slate-700">Paytm</span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-slate-700">BHIM</span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-slate-700">Cred</span>
                </div>
              </div>

              {/* Mobile Direct UPI Intent Buttons */}
              {order?.upiUri && (
                <div className="sm:hidden space-y-2">
                  <p className="text-xs font-bold text-slate-700">Or Tap to Open Your UPI App:</p>
                  <a
                    href={order.upiUri}
                    className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all"
                  >
                    <Smartphone className="w-4 h-4 text-white" />
                    <span>Pay with PhonePe / GPay / Paytm App</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}

              {/* Copyable Details */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 text-xs space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">UPI ID / VPA</span>
                    <strong className="text-slate-900 font-mono text-[13px]">{upiId}</strong>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(upiId, 'upi')}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 font-semibold hover:bg-slate-100 transition shadow-2xs cursor-pointer"
                  >
                    {copiedUpi ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedUpi ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200/60">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Payee Name</span>
                    <strong className="text-slate-800">{config.payeeName}</strong>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Order Ref</span>
                    <strong className="text-slate-800 font-mono">{order?.id}</strong>
                  </div>
                </div>
              </div>

              {/* UTR Verification Input */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white border-2 border-emerald-600/40 shadow-xs space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs">
                    ✓
                  </div>
                  <div>
                    <h5 className="text-xs sm:text-sm font-bold text-slate-900">
                      Completed Payment? Enter UPI Ref / UTR
                    </h5>
                    <p className="text-[11px] text-slate-500">
                      Find the 12-digit number in PhonePe/GPay transaction details to activate immediately.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSubmitUtr} className="space-y-2.5">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={utrInput}
                      onChange={(e) => {
                        setUtrInput(e.target.value);
                        setUtrError(null);
                      }}
                      placeholder="ENTER 12-DIGIT UTR (e.g. 429381920391)"
                      maxLength={16}
                      className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold tracking-wider text-slate-900 uppercase placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                    />

                    <button
                      type="submit"
                      disabled={isSubmittingUtr || !utrInput.trim()}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                    >
                      {isSubmittingUtr ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Verifying...</span>
                        </>
                      ) : (
                        <>
                          <span>Verify &amp; Activate</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </div>

                  {utrError && (
                    <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[11px] flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{utrError}</span>
                    </div>
                  )}
                </form>
              </div>

              {/* Secondary WhatsApp Help Link & Cancel Link */}
              <div className="pt-1 text-center space-y-2">
                <div>
                  <a
                    href={`https://wa.me/919257378047?text=${encodeURIComponent(
                      `Hi Pixora Support! I am making a payment for Order ${order?.id || ''} (${checkoutPlanName}) for ${businessName}. Please assist.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-emerald-700 transition font-medium"
                  >
                    <MessageCircle className="w-3 h-3 text-emerald-600" />
                    <span>Need help with payment? Chat with WhatsApp Support</span>
                  </a>
                </div>

                <div>
                  <button
                    type="button"
                    onClick={handleInitiateCancel}
                    className="text-[11px] text-slate-400 hover:text-rose-600 transition font-medium underline-offset-2 hover:underline cursor-pointer"
                  >
                    Cancel Payment
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
