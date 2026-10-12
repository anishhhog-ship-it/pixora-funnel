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
  Key
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { replyEngine, reviewService, businessService } from '@/services';
import { Review, Business } from '@/types';

const TABS = ['Settings', 'Reply Templates', 'Review Categories', 'Smart Customisation', 'Activity Log'];
const TONES = ['Warm & Friendly', 'Professional', 'Short & Simple', 'Traditional'];
const LANGUAGES = ['English', 'Hindi', 'Hinglish', 'Other'];

export default function AutoReplyPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [isEnabled, setIsEnabled] = useState(false);
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

  // License Key Activation State
  const [licenseKeyInput, setLicenseKeyInput] = useState('');
  const [licenseKeyError, setLicenseKeyError] = useState<string | null>(null);
  const [licenseKeySuccess, setLicenseKeySuccess] = useState<string | null>(null);
  const [isActivatingLicense, setIsActivatingLicense] = useState(false);

  // Determine whether current business is in trial
  const isTrial = activeBiz ? activeBiz.planStatus !== 'active' : true;

  // Template state
  const [fiveStarTemplate, setFiveStarTemplate] = useState('Thank you so much for the 5-star love, {name}! We are thrilled you enjoyed {business}. Looking forward to serving you again soon! ✨');
  const [fourStarTemplate, setFourStarTemplate] = useState('Dear {name}, thank you for your wonderful review! We are delighted with your visit and always striving to make your next experience a full 5 stars.');
  const [threeStarTemplate, setThreeStarTemplate] = useState('Thank you for sharing your feedback, {name}. We appreciate your support and would love to know how we can make your next visit even better.');

  useEffect(() => {
    async function loadData() {
      const biz = await businessService.getActiveBusiness();
      setActiveBiz(biz);
      const bizId = biz?.businessId || await businessService.getActiveBusinessId();

      const currentlyOnTrial = biz ? biz.planStatus !== 'active' : true;

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

      // Load real reviews that have replies
      const reviews = await reviewService.getReviews(bizId);
      const replied = reviews.filter(r => r.replyStatus === 'replied' || r.replyStatus === 'auto_replied');
      setRecentReplies(replied);
    }
    loadData();
  }, []);

  const handleToggle = () => {
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
          trialExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
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

  const handleSave = () => {
    const bizId = activeBiz?.businessId || businessService.getActiveBusinessId();
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
    
    if (isTrial) {
      setSaveMessage('Preferences saved! Note: Auto Reply remains OFF for trial accounts and will activate once an active plan is activated.');
    } else {
      setSaveMessage('Auto-reply configuration saved successfully!');
    }
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 4000);
  };

  const bizName = activeBiz?.name || 'My Business';

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10 max-w-5xl mx-auto">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-2">
            <Bot className="w-3.5 h-3.5 text-blue-600" />
            <span>AI Automated Reputation Manager</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Auto Reply System</h1>
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
              isEnabled && !isTrial ? 'bg-blue-600' : 'bg-slate-300'
            }`}
            title={isTrial ? 'Auto Reply is turned off for trial accounts. Click to upgrade.' : undefined}
          >
            <div className={`w-4 h-4 bg-white rounded-full absolute top-1 shadow-sm transition-transform ${
              isEnabled && !isTrial ? 'right-1' : 'left-1'
            }`} />
          </button>
          
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
              {isTrial ? (
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
            {isTrial && (
              <span className="text-[10px] text-amber-700 font-medium">Active Plan Required</span>
            )}
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
                <span>View 1-Year Pricing Options</span>
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
                  <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">1 Year Only</span>
                </div>
                <div className="flex items-baseline gap-2 mb-1.5">
                  <span className="text-2xl font-extrabold text-slate-900">₹2,599</span>
                  <span className="text-xs text-slate-500 font-medium">/ 1 Year (Without NFC Card)</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed mb-3">
                  Full software suite for 1 location. Turns on the AI Auto Reply system for Google Reviews for 1 full year.
                </p>
                <div className="text-[11px] text-slate-700 space-y-1 mb-4">
                  <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Auto Reply System Activated</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>1 Year Software Validity</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <span className="w-3.5 text-center font-bold text-slate-400">✕</span>
                    <span>No physical NFC card (Software only)</span>
                  </div>
                </div>
              </div>
              <a
                href={`https://wa.me/919257378047?text=${encodeURIComponent(`Hi Pixora! I want to activate the ₹2,599 1-Year Plan (Without NFC Card) for ${bizName} to turn on Auto Reply.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold text-center transition-colors"
              >
                Activate ₹2,599 Plan (1 Year)
              </a>
            </div>

            {/* Plan 2: 2,999 With NFC */}
            <div className="p-4 rounded-2xl bg-blue-50/70 border-2 border-blue-600 shadow-2xs flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-extrabold px-3 py-0.5 rounded-bl-xl uppercase tracking-wider">
                Recommended
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">Plan Option 2 · Best Value</span>
                </div>
                <div className="flex items-baseline gap-2 mb-1.5">
                  <span className="text-2xl font-extrabold text-blue-900">₹2,999</span>
                  <span className="text-xs text-blue-700 font-medium">/ 1 Year (With NFC Card)</span>
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
                  <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Includes Physical NFC Review Card (Delivered)</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Auto Reply System Activated</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>1 Year Software Validity + Doorstep Delivery</span>
                  </div>
                </div>
              </div>
              <a
                href={`https://wa.me/919257378047?text=${encodeURIComponent(`Hi Pixora! I want to activate the ₹2,999 1-Year Plan (With NFC Review Card) for ${bizName} to turn on Auto Reply.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold text-center transition-colors shadow-sm"
              >
                Activate ₹2,999 Plan (With NFC Card)
              </a>
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
      {showUpgradeModal && (
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
                Auto Reply is turned off for trial accounts. Choose an active 1-year plan below to activate 24/7 automated Google review replies.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              {/* Option 1: 2,599 Without NFC */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Standard Plan</span>
                  <div className="flex items-baseline gap-1.5 mb-1">
                    <span className="text-3xl font-extrabold text-slate-900">₹2,599</span>
                    <span className="text-xs text-slate-500 font-semibold">/ 1 Year</span>
                  </div>
                  <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-slate-200 text-slate-700 mb-3">
                    Without NFC Card · 1 Year Only
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
                      <span>1 Year Software Access</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <span>✕ No physical card included</span>
                    </div>
                  </div>
                </div>
                <a
                  href={`https://wa.me/919257378047?text=${encodeURIComponent(`Hi Pixora! I would like to activate the ₹2,599 1-Year Plan (Without NFC Card) for ${bizName}.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs flex items-center justify-center gap-2 transition-all"
                >
                  <span>Activate ₹2,599 Plan</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Option 2: 2,999 With NFC */}
              <div className="p-5 rounded-2xl bg-blue-50/80 border-2 border-blue-600 flex flex-col justify-between relative shadow-sm">
                <div className="absolute -top-3 right-4 bg-blue-600 text-white text-[10px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider">
                  Best Value
                </div>
                <div>
                  <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block mb-1">Pro Plan + NFC</span>
                  <div className="flex items-baseline gap-1.5 mb-1">
                    <span className="text-3xl font-extrabold text-blue-900">₹2,999</span>
                    <span className="text-xs text-blue-700 font-semibold">/ 1 Year</span>
                  </div>
                  <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-800 mb-2">
                    With NFC Card · 1 Year
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
                      <span>Physical NFC Review Card Delivered</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Auto Reply System Activated</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>1 Year Software Access + Support</span>
                    </div>
                  </div>
                </div>
                <a
                  href={`https://wa.me/919257378047?text=${encodeURIComponent(`Hi Pixora! I would like to activate the ₹2,999 1-Year Plan (With NFC Review Card) for ${bizName}.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md"
                >
                  <span>Activate ₹2,999 Plan + NFC</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
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
                Enter your 1-year activation license key below to instantly activate your dashboard and turn on 24/7 AI Google review auto-replies.
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

    </div>
  );
}

