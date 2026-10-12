'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Download, X, Smartphone, Sparkles, Share2, PlusSquare } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

// Global reference so any button on the page can invoke install
let deferredInstallPrompt: BeforeInstallPromptEvent | null = null;
const installListeners = new Set<() => void>();

export function triggerPwaInstall() {
  if (deferredInstallPrompt) {
    const promptEvent = deferredInstallPrompt;
    promptEvent.prompt().then(() => {
      promptEvent.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          deferredInstallPrompt = null;
          installListeners.forEach(fn => fn());
        }
      });
    });
  } else {
    // If deferred prompt not available (e.g. iOS or already installed or desktop browser),
    // trigger the instructions modal
    const event = new CustomEvent('show-pwa-instructions');
    window.dispatchEvent(event);
  }
}

export function isPwaInstallable() {
  return !!deferredInstallPrompt;
}

export default function PwaInstallPrompt({ 
  source = 'dashboard',
  businessName = 'Pixora Funnel'
}: { 
  source?: 'dashboard' | 'landing' | 'onboarding';
  businessName?: string;
}) {
  const [canInstall, setCanInstall] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if already running as standalone app
    const isApp = 
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(isApp);

    // Check if iOS device
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // Check if dismissed in session
    const dismissed = sessionStorage.getItem(`pixora_pwa_dismissed_${source}`);
    if (dismissed) {
      setIsDismissed(true);
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      deferredInstallPrompt = e as BeforeInstallPromptEvent;
      setCanInstall(true);
      installListeners.forEach(fn => fn());
    };

    const handleAppInstalled = () => {
      deferredInstallPrompt = null;
      setCanInstall(false);
      setIsStandalone(true);
    };

    const handleShowInstructions = () => {
      setShowIOSModal(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('show-pwa-instructions', handleShowInstructions);

    const updateListener = () => {
      setCanInstall(!!deferredInstallPrompt);
    };
    installListeners.add(updateListener);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('show-pwa-instructions', handleShowInstructions);
      installListeners.delete(updateListener);
    };
  }, [source]);

  const handleInstallClick = async () => {
    if (deferredInstallPrompt) {
      await deferredInstallPrompt.prompt();
      const choice = await deferredInstallPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        deferredInstallPrompt = null;
        setCanInstall(false);
      }
    } else if (isIOS) {
      setShowIOSModal(true);
    } else {
      setShowIOSModal(true);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem(`pixora_pwa_dismissed_${source}`, 'true');
  };

  // If already installed in standalone mode, don't show the prompt
  if (isStandalone) {
    return null;
  }

  return (
    <>
      {/* Chrome / Mobile PWA Install Banner */}
      {!isDismissed && (canInstall || isIOS) && (
        <div className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-96 z-50 animate-in fade-in slide-in-from-bottom-5 duration-200">
          <div className="bg-slate-900/95 backdrop-blur-md text-white p-3.5 rounded-2xl shadow-2xl border border-slate-700/80 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 shadow-md ring-1 ring-white/20 relative">
                <Image
                  src="/icon-192.png"
                  alt={`${businessName} App Icon`}
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="truncate">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-xs truncate">Install {businessName}</span>
                  <span className="text-[10px] font-semibold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1 rounded">App</span>
                </div>
                <p className="text-[11px] text-slate-300 truncate mt-0.5">
                  1-tap access on home screen
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleInstallClick}
                className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Install</span>
              </button>
              <button
                type="button"
                onClick={handleDismiss}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* iOS or Fallback Installation Instructions Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 sm:p-6 shadow-2xl border border-slate-200 relative animate-in slide-in-from-bottom-8 duration-200">
            <button
              onClick={() => setShowIOSModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-4">
              <div className="w-16 h-16 mx-auto mb-3 rounded-2xl overflow-hidden shadow-xl shadow-blue-500/20 ring-1 ring-slate-200">
                <Image
                  src="/app-icon.png"
                  alt="Pixora Funnel App Icon"
                  width={64}
                  height={64}
                  className="w-full h-full object-cover"
                />
              </div>
              <h4 className="text-base font-bold text-slate-900">
                Install Pixora on your Phone
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Install as a standalone mobile app for instant access to your reviews and QR funnel.
              </p>
            </div>

            <div className="space-y-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-700 mb-4">
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0 text-[11px]">
                  1
                </div>
                <div className="flex-1">
                  <span>In Chrome or Safari, tap the </span>
                  <strong className="inline-flex items-center gap-1 font-semibold text-slate-900">
                    Share / Menu <Share2 className="w-3.5 h-3.5 inline text-blue-600" />
                  </strong>
                  <span> button.</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0 text-[11px]">
                  2
                </div>
                <div className="flex-1">
                  <span>Scroll down and tap </span>
                  <strong className="inline-flex items-center gap-1 font-semibold text-slate-900">
                    Add to Home Screen <PlusSquare className="w-3.5 h-3.5 inline text-emerald-600" />
                  </strong>
                  <span>.</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0 text-[11px]">
                  3
                </div>
                <div className="flex-1">
                  <span>Tap <strong>Add</strong>. Pixora will now launch as a full-screen mobile app!</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIOSModal(false)}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
