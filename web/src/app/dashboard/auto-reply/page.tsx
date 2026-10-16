'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { 
  Bot, 
  MessageSquare, 
  ShieldCheck, 
  Zap, 
  Settings2, 
  Check, 
  Sparkles, 
  Play, 
  FileText, 
  Tags, 
  Sliders, 
  History,
  CheckCircle2,
  Clock,
  AlertCircle,
  Lock,
  Crown,
  CreditCard,
  ArrowRight,
  X,
  Smartphone,
  Key,
  Timer
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { replyEngine, reviewService, businessService, replyService, googleBusinessProfileService } from '@/services';
import { GoogleConnectionBadge, GoogleBadgeStatus } from '@/components/GoogleConnectionBadge';
import { Review, Business } from '@/types';
import { PortalErrorState, PortalLoadingState } from '@/components/client-portal/PortalUI';

// Fixed 14-day beta launch window from the current release date. Keep this
// absolute so a browser refresh cannot reset or extend the countdown.
const AUTO_REPLY_BETA_LAUNCH_DATE = new Date('2026-10-30T12:00:00+05:30').getTime();

const TABS = ['Settings', 'Reply Templates', 'Review Categories', 'Smart Customisation', 'Activity Log'];
const TONES = ['Warm & Friendly', 'Professional', 'Short & Simple', 'Traditional'];
const LANGUAGES = ['English', 'Hindi', 'Hinglish', 'Other'];

export default function AutoReplyPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [isEnabled, setIsEnabled] = useState(false);
  const [googleStatus, setGoogleStatus] = useState<GoogleBadgeStatus>('not_connected');
  const [selectedTone, setSelectedTone] = useState(TONES[0]);
  const [selectedLang, setSelectedLang] = useState(LANGUAGES[0]);
  const [customInstructions, setCustomInstructions] = useState('Always thank the customer by their first name and express our passion for warm hospitality and authentic flavors.');
  const [testOutput, setTestOutput] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveMessage, setSaveMessage] = useState('Auto-reply configuration saved successfully!');
  const [activeBiz, setActiveBiz] = useState<Business | null>(null);
  const [recentReplies, setRecentReplies] = useState<Review[]>([]);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showGatewayModal, setShowGatewayModal] = useState(false);

  // ── Beta Countdown & Lock State ──
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isLocked: boolean;
  }>({
    days: 14,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isLocked: true,
  });
  const [betaEnrolled, setBetaEnrolled] = useState(false);
  const [showBetaLockedModal, setShowBetaLockedModal] = useState(false);

  const [gatewayPlan, setGatewayPlan] = useState({
    planId: 'plan_2year_software',
    planName: 'Standard 2-Year Plan',
    amount: 2599,
  });

  // License Key Activation State
  const [licenseKeyInput, setLicenseKeyInput] = useState('');
  const [licenseKeyError, setLicenseKeyError] = useState<string | null>(null);
  const [licenseKeySuccess, setLicenseKeySuccess] = useState<string | null>(null);
  const [isActivatingLicense, setIsActivatingLicense] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);

  // Determine whether current business is in trial / upgraded
  const isLocallyActive = typeof window !== 'undefined' && activeBiz && (
    localStorage.getItem(`pixora_plan_active_${activeBiz.id}`) === 'true' ||
    localStorage.getItem(`pixora_plan_active_${activeBiz.businessId}`) === 'true' ||
    localStorage.getItem(`pixora_plan_active_${activeBiz.slug}`) === 'true'
  );
  const isAccountUpgraded = activeBiz?.planStatus === 'active' || Boolean(isLocallyActive);
  const isTrial = !isAccountUpgraded;

  // Template state
  const [fiveStarTemplate, setFiveStarTemplate] = useState('Thank you so much for the 5-star love, {name}! We are thrilled you enjoyed {business}. Looking forward to serving you again soon! ✨');
  const [fourStarTemplate, setFourStarTemplate] = useState('Dear {name}, thank you for your wonderful review! We are delighted with your visit and always striving to make your next experience a full 5 stars.');
  const [threeStarTemplate, setThreeStarTemplate] = useState('Thank you for sharing your feedback, {name}. We appreciate your support and would love to know how we can make your next visit even better.');

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      setLoadError(null);
      try {
        const biz = await businessService.getActiveBusiness();
        setActiveBiz(biz);
        const bizId = biz?.businessId || await businessService.getActiveBusinessId();

        const isLoc = typeof window !== 'undefined' && biz && (
          localStorage.getItem(`pixora_plan_active_${biz.id}`) === 'true' ||
          localStorage.getItem(`pixora_plan_active_${biz.businessId}`) === 'true' ||
          localStorage.getItem(`pixora_plan_active_${biz.slug}`) === 'true'
        );
        const currentlyOnTrial = biz ? (biz.planStatus !== 'active' && !isLoc) : true;

        // Load saved settings if any
        const saved = localStorage.getItem(`pixora_autoreply_${bizId}`);
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            // If on trial, auto-reply MUST remain false
            if (currentlyOnTrial) {
              setIsEnabled(false);
            } else if (typeof parsed.isEnabled === 'boolean') {
              setIsEnabled(parsed.isEnabled);
            }
            if (parsed.tone) setSelectedTone(parsed.tone);
            if (parsed.lang) setSelectedLang(parsed.lang);
            if (parsed.instructions) setCustomInstructions(parsed.instructions);
            if (parsed.fiveStar) setFiveStarTemplate(parsed.fiveStar);
            if (parsed.fourStar) setFourStarTemplate(parsed.fourStar);
            if (parsed.threeStar) setThreeStarTemplate(parsed.threeStar);
          } catch (e) {}
        } else if (currentlyOnTrial) {
          setIsEnabled(false);
        }

        // Load real reviews that have replies and check connection status
        const [reviews, connInfo] = await Promise.all([
          reviewService.getReviews(bizId),
          googleBusinessProfileService.getConnectionStatus(biz),
        ]);
        const replied = reviews.filter(r => r.replyStatus === 'replied' || r.replyStatus === 'auto_replied');
        setRecentReplies(replied);

        if (connInfo.status === 'connected') {
          setGoogleStatus('connected');
        } else if (connInfo.status === 'reconnect_required') {
          setGoogleStatus('requires_auth');
        } else {
          setGoogleStatus(biz?.googlePlaceId ? 'connected' : 'not_connected');
        }
      } catch (err) {
        console.error('Failed to load auto-reply settings:', err);
        setLoadError('Auto Reply settings are temporarily unavailable.');
      } finally {
        setIsLoading(false);
      }
    }
    loadData();

    const handleActivated = () => {
      setActiveBiz(prev => prev ? { ...prev, planStatus: 'active' } : null);
      setShowUpgradeModal(false);
    };
    window.addEventListener('pixora:dashboard_activated', handleActivated);
    return () => window.removeEventListener('pixora:dashboard_activated', handleActivated);
  }, [loadAttempt]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setBetaEnrolled(localStorage.getItem('pixora_beta_enrolled') === 'true');
    }

    const updateCountdown = () => {
      const diff = AUTO_REPLY_BETA_LAUNCH_DATE - Date.now();
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isLocked: false });
      } else {
        setTimeLeft({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((diff / 1000 / 60) % 60),
          seconds: Math.floor((diff / 1000) % 60),
          isLocked: true,
        });
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleEnrollBeta = () => {
    setBetaEnrolled(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem('pixora_beta_enrolled', 'true');
    }
  };

  const handleToggle = () => {
    if (timeLeft.isLocked) {
      setShowBetaLockedModal(true);
      return;
    }
    if (isTrial) {
      setShowUpgradeModal(true);
      return;
    }
    setIsEnabled(!isEnabled);
  };

  const handleActivateLicense = async () => {
    const key = licenseKeyInput.trim().toUpperCase();
    if (!key) {
      setLicenseKeyError('Please enter your license key.');
      return;
    }
    const bizId = activeBiz?.businessId || activeBiz?.slug || await businessService.getActiveBusinessId();
    setIsActivatingLicense(true);
    setLicenseKeyError(null);
    setLicenseKeySuccess(null);

    try {
      const res = await businessService.activateDashboardWithLicenseKey(bizId, key);
      if (!res.success) {
        setLicenseKeyError(res.message);
        return;
      }
      setLicenseKeySuccess(res.message);
      if (activeBiz) {
        setActiveBiz({
          ...activeBiz,
          planStatus: 'active',
          trialExpiresAt: new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000).toISOString(),
        });
      }
      setIsEnabled(true);
      setTimeout(() => {
        setShowUpgradeModal(false);
        setLicenseKeyInput('');
        setLicenseKeySuccess(null);
      }, 1600);
    } catch (err: any) {
      setLicenseKeyError(err?.message || 'Activation failed. Please contact support.');
    } finally {
      setIsActivatingLicense(false);
    }
  };

  const handleTestReply = async () => {
    setIsTesting(true);
    try {
      const sampleReview: Review = {
        reviewId: 'sandbox_preview',
        businessId: activeBiz?.businessId || 'active',
        reviewerName: 'Customer',
        rating: 5,
        text: 'The food was delicious and hospitality was very warm!',
        date: new Date().toISOString(),
        source: 'google',
        status: 'published',
        sentiment: 'positive',
        replyStatus: 'pending',
        tags: ['Great Service', 'Delicious Food']
      };
      const reply = await replyEngine.generateReplySuggestion(sampleReview, activeBiz?.name || 'our business');
      setTestOutput(reply);
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async () => {
    const bizId = activeBiz?.businessId || await businessService.getActiveBusinessId();
    
    if (timeLeft.isLocked) {
      const config = {
        isEnabled: false,
        tone: selectedTone,
        lang: selectedLang,
        instructions: customInstructions,
        fiveStar: fiveStarTemplate,
        fourStar: fourStarTemplate,
        threeStar: threeStarTemplate,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(`pixora_autoreply_${bizId}`, JSON.stringify(config));
      setSaveMessage(`Preferences saved in Beta preview mode! Note: Live posting unlocks in ${timeLeft.days} days with our public Beta release.`);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4500);
      return;
    }

    // Auto-reply can ONLY be enabled on an active plan
    const actualEnabled = isTrial ? false : isEnabled;
    const config = {
      isEnabled: actualEnabled,
      tone: selectedTone,
      lang: selectedLang,
      instructions: customInstructions,
      fiveStar: fiveStarTemplate,
      fourStar: fourStarTemplate,
      threeStar: threeStarTemplate,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(`pixora_autoreply_${bizId}`, JSON.stringify(config));

    if (bizId && !bizId.startsWith('biz_')) {
      await replyService.updateRules({
        businessId: bizId,
        autoReplyEnabled: actualEnabled,
      });
    }
    
    if (isTrial) {
      setSaveMessage('Preferences saved! Note: Auto Reply remains OFF for trial accounts and will activate once an active plan is activated.');
    } else {
      setSaveMessage('Auto-reply configuration saved successfully!');
    }
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 4000);
  };

  const bizName = activeBiz?.name || 'My Business';

  if (isLoading) {
    return <PortalLoadingState label="Loading Auto Reply settings" />;
  }

  if (loadError) {
    return <PortalErrorState description={loadError} onRetry={() => setLoadAttempt((attempt) => attempt + 1)} />;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10 max-w-5xl mx-auto">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
              <Bot className="w-3.5 h-3.5 text-blue-600" />
              <span>AI Automated Reputation Manager</span>
            </div>
            {/* Prominent Beta Tag */}
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-xs animate-pulse">
              <Sparkles className="w-3 h-3 text-amber-300" />
              <span>Beta Version</span>
            </span>
            <GoogleConnectionBadge status={googleStatus} compact />
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Auto Reply System</h1>
            <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-700 text-xs font-bold border border-purple-200">
              Beta
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Configure automated, brand-aligned responses to incoming Google customer reviews.
          </p>
        </div>
        
        {/* Active Toggle Switch */}
        <div className="flex items-center gap-3 bg-slate-50 p-2 pr-4 rounded-2xl border border-slate-200">
          <button 
            type="button"
            onClick={handleToggle}
            className={`w-12 h-6 rounded-full relative transition-colors cursor-pointer ${
              timeLeft.isLocked ? 'bg-purple-200' : isEnabled && !isTrial ? 'bg-blue-600' : 'bg-slate-300'
            }`}
            title={timeLeft.isLocked ? 'Auto Reply is currently locked for 14-day Beta testing. Click for details.' : isTrial ? 'Auto Reply is turned off for trial accounts. Click to upgrade.' : undefined}
            aria-label={timeLeft.isLocked ? 'Auto Reply locked in Beta' : isTrial ? 'Auto Reply requires an active plan' : 'Toggle Auto Reply'}
            aria-pressed={isEnabled && !isTrial && !timeLeft.isLocked}
          >
            <div className={`w-4 h-4 rounded-full absolute top-1 shadow-sm transition-transform flex items-center justify-center ${
              timeLeft.isLocked ? 'left-1 bg-purple-600' : isEnabled && !isTrial ? 'right-1 bg-white' : 'left-1 bg-white'
            }`}>
              {timeLeft.isLocked && <Lock className="w-2.5 h-2.5 text-white" />}
            </div>
          </button>
          
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
              {timeLeft.isLocked ? (
                <>
                  <Lock className="w-3 h-3 text-purple-600" />
                  <span className="text-purple-700">Locked (Beta in {timeLeft.days}d)</span>
                </>
              ) : isTrial ? (
                <>
                  <Lock className="w-3 h-3 text-amber-600" />
                  <span>Turned Off (Trial)</span>
                </>
              ) : isEnabled ? (
                'Auto Reply Active'
              ) : (
                'System Paused'
              )}
            </span>
            <span className="text-[10px] text-purple-600 font-medium">
              {timeLeft.isLocked ? 'Public Beta Release Soon' : isTrial ? 'Active Plan Required' : 'Live Mode'}
            </span>
          </div>
        </div>
      </div>

      {/* ── 14-Day Beta Launch Countdown Hero Banner ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950 text-white p-6 sm:p-8 shadow-xl border border-indigo-900/60">
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 -mb-12 w-64 h-64 bg-blue-500/15 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-purple-500/30 to-indigo-500/30 border border-purple-400/30 text-purple-200 text-xs font-bold uppercase tracking-wider backdrop-blur-md">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Beta Version Launching in 14 Days</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 text-xs font-semibold">
                <Lock className="w-3 h-3" />
                <span>Feature Locked for Public Beta</span>
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
              AI Auto-Reply is Launching in <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-purple-200 to-pink-300">Beta Version</span>
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl">
              We are finalizing live Google API integration & brand-voice calibration. Public Beta goes live in <strong>{timeLeft.days} days</strong>. During this countdown, live posting is locked, but you can configure your reply tones, test prompts in the sandbox, and reserve priority access.
            </p>

            <div className="pt-1 flex items-center gap-3 flex-wrap">
              <button
                type="button"
                onClick={handleEnrollBeta}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm ${
                  betaEnrolled 
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                    : 'bg-white text-slate-950 hover:bg-slate-100 hover:shadow-md'
                }`}
              >
                {betaEnrolled ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>✓ Enrolled for Priority Beta Launch</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    <span>Get Priority Beta Access (Free)</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setShowBetaLockedModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
              >
                <span>Why is it locked?</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Real-time 4-Box Countdown Timer */}
          <div className="shrink-0 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-4 sm:p-5 flex flex-col items-center">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-purple-300 mb-3">
              <Clock className="w-4 h-4 text-amber-300 animate-pulse" />
              <span>Official Beta Countdown</span>
            </div>

            <div className="grid grid-cols-4 gap-2 sm:gap-3 text-center">
              {/* Days */}
              <div className="bg-slate-900/80 border border-purple-500/30 rounded-xl px-2.5 sm:px-3.5 py-2.5 sm:py-3 min-w-[58px] sm:min-w-[68px]">
                <div className="text-xl sm:text-2xl font-black text-amber-300 font-mono">
                  {String(timeLeft.days).padStart(2, '0')}
                </div>
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mt-0.5">Days</div>
              </div>

              {/* Hours */}
              <div className="bg-slate-900/80 border border-purple-500/30 rounded-xl px-2.5 sm:px-3.5 py-2.5 sm:py-3 min-w-[58px] sm:min-w-[68px]">
                <div className="text-xl sm:text-2xl font-black text-white font-mono">
                  {String(timeLeft.hours).padStart(2, '0')}
                </div>
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mt-0.5">Hours</div>
              </div>

              {/* Minutes */}
              <div className="bg-slate-900/80 border border-purple-500/30 rounded-xl px-2.5 sm:px-3.5 py-2.5 sm:py-3 min-w-[58px] sm:min-w-[68px]">
                <div className="text-xl sm:text-2xl font-black text-white font-mono">
                  {String(timeLeft.minutes).padStart(2, '0')}
                </div>
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mt-0.5">Mins</div>
              </div>

              {/* Seconds */}
              <div className="bg-slate-900/80 border border-purple-500/30 rounded-xl px-2.5 sm:px-3.5 py-2.5 sm:py-3 min-w-[58px] sm:min-w-[68px]">
                <div className="text-xl sm:text-2xl font-black text-purple-300 font-mono">
                  {String(timeLeft.seconds).padStart(2, '0')}
                </div>
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mt-0.5">Secs</div>
              </div>
            </div>

            <div className="mt-3 text-[11px] text-slate-400 text-center font-medium">
              Beta Go-Live: <span className="text-slate-200 font-semibold">Oct 29, 2026 · 12:00 PM IST</span>
            </div>
          </div>
        </div>
      </div>

      {/* Trial Account Warning & Upgrade Notice Banner */}
      {isTrial && (
        <div className="rounded-3xl bg-gradient-to-br from-amber-50 via-white to-orange-50/40 border-2 border-amber-300/80 p-6 sm:p-7 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100/90 text-amber-900 text-xs font-bold uppercase tracking-wider">
                <Lock className="w-3.5 h-3.5 text-amber-700" />
                <span>Auto Reply Off for Trial Accounts</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Automated Review Replies Activate with an Active Plan
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                During your free trial, you can test review suggestions in the sandbox below. However, <strong>live 24/7 automated posting</strong> to Google Reviews is exclusively activated for accounts on an active plan.
              </p>
            </div>

            <div className="shrink-0 flex flex-col sm:flex-row lg:flex-col gap-2.5">
              <button
                type="button"
                onClick={() => setShowUpgradeModal(true)}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all cursor-pointer whitespace-nowrap"
              >
                <Crown className="w-4 h-4 text-amber-300" />
                <span>View 2-Year Pricing Options</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <a
                href={`https://wa.me/919257378047?text=${encodeURIComponent(`Hi Pixora! I want to activate an Active Plan for ${bizName} to turn on the Auto Reply System.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition-all text-center"
              >
                <span>WhatsApp Admin (+91 92573 78047)</span>
              </a>
            </div>
          </div>

          {/* 2 Plan Quick-Cards inside Banner */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-5 border-t border-amber-200/60">
            {/* Plan 1: 2,599 Without NFC */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Plan Option 1</span>
                  <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">2 Years Only</span>
                </div>
                <div className="flex items-baseline gap-2 mb-1.5">
                  <span className="text-2xl font-extrabold text-slate-900">₹2,599</span>
                  <span className="text-xs text-slate-500 font-medium">/ 2 Years (Without NFC Card)</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed mb-3">
                  Full software suite for 1 location. Turns on the AI Auto Reply system for Google Reviews for 2 full years.
                </p>
                <div className="text-[11px] text-slate-700 space-y-1 mb-4">
                  <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Auto Reply System Activated</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>2 Years Software Validity</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <span className="w-3.5 text-center font-bold text-slate-400">✕</span>
                    <span>No physical NFC card (Software only)</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setGatewayPlan({
                    planId: 'plan_2year_software',
                    planName: 'Standard 2-Year Plan',
                    amount: 2599,
                  });
                  setShowGatewayModal(true);
                }}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold text-center transition-colors cursor-pointer"
              >
                Activate ₹2,599 Plan Online
              </button>
            </div>

            {/* Plan 2: 2,999 With NFC */}
            <div className="p-4 rounded-2xl bg-blue-50/70 border-2 border-blue-600 shadow-2xs flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-extrabold px-3 py-0.5 rounded-bl-xl uppercase tracking-wider">
                First 100 Accounts Offer
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">Plan Option 2 · Lifetime Free</span>
                </div>
                <div className="flex items-baseline gap-2 mb-1.5">
                  <span className="text-2xl font-extrabold text-blue-900">₹2,999</span>
                  <span className="text-xs text-blue-700 font-bold">/ Lifetime Free Access</span>
                </div>
                
                {/* Visual snippet with NFC card photo */}
                <div className="relative w-full h-24 mb-3 rounded-xl overflow-hidden border border-blue-200">
                  <Image
                    src="/products/nfc-review-card.jpg"
                    alt="NFC Review Card"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-2">
                    <span className="text-[10px] font-bold text-white flex items-center gap-1">
                      <Smartphone className="w-3 h-3 text-amber-300" />
                      <span>Custom NFC Smart Tap Review Card Included</span>
                    </span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-800 space-y-1 mb-4">
                  <div className="flex items-center gap-1.5 text-blue-900 font-bold">
                    <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>First 100 Accounts: Lifetime Free Access!</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Includes Physical NFC Review Card (Delivered)</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Auto Reply System Activated for Life</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Zero Annual Renewal Fees Forever</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setGatewayPlan({
                    planId: 'plan_pro_nfc_lifetime',
                    planName: 'Pro Plan + NFC Card (Lifetime Deal)',
                    amount: 2999,
                  });
                  setShowGatewayModal(true);
                }}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold text-center transition-colors cursor-pointer shadow-xs"
              >
                Claim Lifetime + NFC Online (₹2,999)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 overflow-x-auto no-scrollbar">
        {TABS.map((tab, i) => (
          <button
            key={i}
            onClick={() => setActiveTab(i)}
            aria-selected={activeTab === i}
            role="tab"
            className={cn(
              'px-4 py-2.5 text-xs sm:text-sm font-semibold whitespace-nowrap border-b-2 transition-colors cursor-pointer',
              activeTab === i
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {saveSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{saveMessage}</span>
        </div>
      )}


      {/* TAB 0: SETTINGS */}
      {activeTab === 0 && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tone Selector */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <h3 className="text-sm font-bold text-slate-900">Brand Response Tone</h3>
              <p className="text-xs text-slate-500">Choose how the AI should address your customer reviews.</p>
              <div className="grid grid-cols-2 gap-2 pt-2">
                {TONES.map((tone) => (
                  <button
                    key={tone}
                    type="button"
                    onClick={() => setSelectedTone(tone)}
                    className={`p-3 rounded-xl text-xs font-semibold border text-left transition-all cursor-pointer ${
                      selectedTone === tone
                        ? 'border-blue-600 bg-blue-50/60 text-blue-700 shadow-2xs'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    {tone}
                  </button>
                ))}
              </div>
            </div>

            {/* Language Selector */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <h3 className="text-sm font-bold text-slate-900">Preferred Reply Language</h3>
              <p className="text-xs text-slate-500">Select language for auto-replies matching local customer demographics.</p>
              <div className="grid grid-cols-2 gap-2 pt-2">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setSelectedLang(lang)}
                    className={`p-3 rounded-xl text-xs font-semibold border text-left transition-all cursor-pointer ${
                      selectedLang === lang
                        ? 'border-blue-600 bg-blue-50/60 text-blue-700 shadow-2xs'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Custom Instructions */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Custom Business Instructions</h3>
            <p className="text-xs text-slate-500">Provide specific instructions (e.g. mention head chef, signature salon treatments, parking perks).</p>
            <textarea
              rows={3}
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              className="w-full text-xs text-slate-800 border border-slate-200 rounded-xl p-3 outline-none focus:border-blue-500"
            />
          </div>

          {/* Test Reply Sandbox */}
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Sandbox Preview Generator</h3>
                <p className="text-xs text-slate-500">Simulate a response against a 5-star customer review to verify tone.</p>
              </div>
              <button
                type="button"
                onClick={handleTestReply}
                disabled={isTesting}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{isTesting ? 'Generating...' : 'Simulate Reply'}</span>
              </button>
            </div>

            {testOutput && (
              <div className="p-4 rounded-xl bg-white border border-blue-200 text-xs text-slate-800 animate-fadeIn space-y-1">
                <span className="font-bold text-blue-700">Simulated AI Response:</span>
                <p className="leading-relaxed">&ldquo;{testOutput}&rdquo;</p>
              </div>
            )}
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleSave}
              className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all cursor-pointer"
            >
              Save Settings
            </button>
          </div>
        </div>
      )}

      {/* TAB 1: REPLY TEMPLATES */}
      {activeTab === 1 && (
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">5-Star Reviews Template</label>
              <textarea
                rows={2}
                value={fiveStarTemplate}
                onChange={(e) => setFiveStarTemplate(e.target.value)}
                className="w-full text-xs text-slate-800 border border-slate-200 rounded-xl p-3 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">4-Star Reviews Template</label>
              <textarea
                rows={2}
                value={fourStarTemplate}
                onChange={(e) => setFourStarTemplate(e.target.value)}
                className="w-full text-xs text-slate-800 border border-slate-200 rounded-xl p-3 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">3-Star Feedback Policy</label>
              <textarea
                rows={2}
                value={threeStarTemplate}
                onChange={(e) => setThreeStarTemplate(e.target.value)}
                className="w-full text-xs text-slate-800 border border-slate-200 rounded-xl p-3 outline-none"
              />
            </div>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
              <strong>1-2 Star Safety Policy:</strong> Sensitive complaints always require manual manager approval. The engine will never automatically post replies to low-star reviews without your explicit confirmation.
            </div>
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleSave}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer"
              >
                Save Templates
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: REVIEW CATEGORIES */}
      {activeTab === 2 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {['Quality & Experience', 'Service & Staff', 'Ambiance & Cleanliness', 'Timeliness', 'Pricing & Value', 'Staff Courtesy'].map((cat, i) => (
            <div key={i} className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">{cat}</span>
              <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Auto-Monitored</span>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: SMART CUSTOMISATION */}
      {activeTab === 3 && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <div className="text-xs font-bold text-slate-800">Address Reviewers by First Name</div>
              <div className="text-[11px] text-slate-500">e.g. &ldquo;Thank you, Vikram!&rdquo; instead of generic greeting.</div>
            </div>
            <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <div className="text-xs font-bold text-slate-800">Mention Signature Offerings</div>
              <div className="text-[11px] text-slate-500">Highlight your bestseller or key service when compliments are detected.</div>
            </div>
            <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <div className="text-xs font-bold text-slate-800">Add Manager Sign-Off</div>
              <div className="text-[11px] text-slate-500">Sign replies from &ldquo;The Management Team&rdquo; or custom title.</div>
            </div>
            <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600" />
          </div>
        </div>
      )}

      {/* TAB 4: ACTIVITY LOG */}
      {activeTab === 4 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Recent Automated Replies</span>
            <span className="font-semibold text-slate-700">{recentReplies.length} Logged Replies</span>
          </div>
          
          {recentReplies.length === 0 ? (
            <div className="py-16 px-4 text-center">
              <Bot className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-slate-900 mb-1">No automated replies yet</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Once customer reviews arrive on Google Maps and Auto Reply is active, responses generated and posted by the system will be tracked here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 text-xs">
              {recentReplies.map((r) => (
                <div key={r.reviewId} className="p-4 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{r.reviewerName} ({'★'.repeat(r.rating)})</span>
                    <span className="text-slate-400">{r.date ? new Date(r.date).toLocaleDateString('en-IN') : 'Recent'}</span>
                  </div>
                  <p className="text-slate-600">&ldquo;{r.text || 'Review posted.'}&rdquo;</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Upgrade / Plan Selection Modal */}
      {showUpgradeModal && !isAccountUpgraded && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative max-h-[90vh] overflow-y-auto no-scrollbar">
            <button
              onClick={() => setShowUpgradeModal(false)}
              className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6">
              <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Crown className="w-6 h-6" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
                Activate Active Plan to Turn On Auto Reply
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md mx-auto">
                Auto Reply is turned off for trial accounts. Choose an active 2-year plan below to activate 24/7 automated Google review replies.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              {/* Option 1: 2,599 Without NFC */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Standard Plan</span>
                  <div className="flex items-baseline gap-1.5 mb-1">
                    <span className="text-3xl font-extrabold text-slate-900">₹2,599</span>
                    <span className="text-xs text-slate-500 font-semibold">/ 2 Years</span>
                  </div>
                  <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-slate-200 text-slate-700 mb-3">
                    Without NFC Card · 2 Years Only
                  </span>
                  <div className="text-xs text-slate-600 space-y-2 mb-4">
                    <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Auto Reply System Activated</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Full QR Review Funnel Software</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>2 Years Software Access</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <span>✕ No physical card included</span>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowUpgradeModal(false);
                    setGatewayPlan({
                      planId: 'plan_2year_software',
                      planName: 'Standard 2-Year Plan',
                      amount: 2599,
                    });
                    setShowGatewayModal(true);
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <CreditCard className="w-3.5 h-3.5 text-blue-400" />
                  <span>Activate ₹2,599 Plan Online</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Option 2: 2,999 With NFC */}
              <div className="p-5 rounded-2xl bg-blue-50/80 border-2 border-blue-600 flex flex-col justify-between relative shadow-sm">
                <div className="absolute -top-3 right-4 bg-blue-600 text-white text-[10px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider">
                  Lifetime Deal · First 100
                </div>
                <div>
                  <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block mb-1">Pro Plan + NFC</span>
                  <div className="flex items-baseline gap-1.5 mb-1">
                    <span className="text-3xl font-extrabold text-blue-900">₹2,999</span>
                    <span className="text-xs text-blue-700 font-bold">/ Lifetime Free</span>
                  </div>
                  <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-800 mb-2">
                    First 100 Accounts · Lifetime Free + NFC Card
                  </span>

                  {/* NFC Card Mockup Image */}
                  <div className="relative w-full h-28 my-2 rounded-xl overflow-hidden border border-blue-200">
                    <Image
                      src="/products/nfc-review-card.jpg"
                      alt="NFC Review Card"
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-2">
                      <span className="text-[10px] font-bold text-white flex items-center gap-1">
                        <Smartphone className="w-3 h-3 text-amber-300" />
                        <span>NFC Smart Tap Review Card</span>
                      </span>
                    </div>
                  </div>

                  <div className="text-xs text-slate-700 space-y-1.5 mb-4">
                    <div className="flex items-center gap-1.5 text-blue-900 font-bold">
                      <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>First 100 Accounts: Lifetime Free Software</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Physical NFC Review Card Delivered</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Auto Reply System Activated for Life</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Zero Annual Renewal Fees Forever</span>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowUpgradeModal(false);
                    setGatewayPlan({
                      planId: 'plan_pro_nfc_lifetime',
                      planName: 'Pro Plan + NFC Card (Lifetime Offer)',
                      amount: 2999,
                    });
                    setShowGatewayModal(true);
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Claim ₹2,999 Lifetime Plan Online</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Instant License Key Activation Container */}
            <div className="mb-5 p-4 sm:p-5 bg-gradient-to-r from-blue-50/80 via-indigo-50/60 to-purple-50/60 rounded-2xl border border-blue-200 shadow-2xs">
              <div className="flex items-center gap-2 mb-1.5">
                <Key className="w-4 h-4 text-amber-500 shrink-0" />
                <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                  Already Have an Activation License Key?
                </h4>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-600 mb-3 leading-relaxed">
                Enter your 2-year activation license key below to instantly activate your dashboard and turn on 24/7 AI Google review auto-replies.
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={licenseKeyInput}
                  onChange={(e) => {
                    setLicenseKeyInput(e.target.value);
                    setLicenseKeyError(null);
                  }}
                  placeholder="e.g. PX-XXXX-XXXX or PIXORA-..."
                  className="flex-1 px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono uppercase text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
                <button
                  type="button"
                  onClick={handleActivateLicense}
                  disabled={isActivatingLicense || !licenseKeyInput.trim()}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer shrink-0 flex items-center justify-center gap-1.5"
                >
                  {isActivatingLicense ? 'Activating...' : 'Activate Dashboard Instantly'}
                </button>
              </div>

              {licenseKeyError && (
                <div className="mt-2.5 p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{licenseKeyError}</span>
                </div>
              )}

              {licenseKeySuccess && (
                <div className="mt-2.5 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                  <span>{licenseKeySuccess}</span>
                </div>
              )}
            </div>

            <div className="text-center pt-2">
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800"
              >
                Close and return to dashboard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Beta Locked Information Modal ── */}
      {showBetaLockedModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                  <Lock className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-900">Auto Reply Feature is Locked</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-purple-600 text-white">Beta</span>
                  </div>
                  <p className="text-xs text-slate-500">Launching in Beta Version in {timeLeft.days} Days</p>
                </div>
              </div>
              <button 
                onClick={() => setShowBetaLockedModal(false)}
                className="p-1 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Countdown mini pill */}
            <div className="p-3.5 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl border border-purple-100 mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Timer className="w-4 h-4 text-purple-600" />
                <span className="text-xs font-bold text-purple-900">Launch Countdown</span>
              </div>
              <div className="font-mono text-xs font-black text-purple-700">
                {timeLeft.days}d : {timeLeft.hours}h : {timeLeft.minutes}m : {timeLeft.seconds}s
              </div>
            </div>

            <div className="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed mb-6">
              <p>
                Our AI Automated Review Reply engine is undergoing final security verification and Google Business Profile calibration to ensure 100% compliant, brand-safe replies.
              </p>
              <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 border border-slate-100">
                <div className="text-xs font-bold text-slate-800">What you can do right now:</div>
                <div className="flex items-start gap-2 text-xs text-slate-600">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Test and customize reply tones in the interactive sandbox</span>
                </div>
                <div className="flex items-start gap-2 text-xs text-slate-600">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Save your 5-star, 4-star, and critical review templates (saved in preview mode)</span>
                </div>
                <div className="flex items-start gap-2 text-xs text-slate-600">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Reserve priority Beta access for instant unlock on launch day</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5">
              <button
                type="button"
                onClick={() => {
                  handleEnrollBeta();
                  setShowBetaLockedModal(false);
                }}
                className="flex-1 py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer text-center"
              >
                {betaEnrolled ? '✓ Enrolled in Priority Beta' : 'Enroll in Priority Beta (Free)'}
              </button>
              <button
                type="button"
                onClick={() => setShowBetaLockedModal(false)}
                className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all cursor-pointer text-center"
              >
                Explore Sandbox
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
