'use client';

import { useState, useEffect, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, Eye, EyeOff, ShieldCheck, Check, Sparkles } from 'lucide-react';
import { authService, trialService } from '@/services';

function SignUpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const queryPhone = searchParams.get('phone');
    if (queryPhone) {
      setPhone(queryPhone);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !email.includes('@')) {
      setError('Please provide a valid business email.');
      return;
    }
    if (!phone.trim() || phone.replace(/\D/g, '').length < 8) {
      setError('Please provide a valid 10-digit mobile number.');
      return;
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    try {
      setIsLoading(true);
      const user = await authService.signUp({
        email: email.trim(),
        phone: phone.startsWith('+') ? phone.trim() : `+91 ${phone.trim()}`,
        password,
      });

      // Start the 1-day trial
      await trialService.startTrial(user.id);

      // Redirect to onboarding wizard
      router.push('/onboarding');
    } catch (err: any) {
      setError(err?.message || 'Failed to start trial. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const user = await authService.signInWithGoogle();
      
      // If we got a user back directly, it means we are in local mock mode
      // or the redirect hasn't happened yet. We must route manually.
      if (user) {
        // We can check if they need onboarding or just go to dashboard
        router.push('/onboarding');
      }
    } catch (err: any) {
      setError(err?.message || 'Google sign-in failed. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Top Header */}
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <Image
            src="/pixora-logo.png"
            alt="Pixora Funnel by Pixora Automations"
            width={240}
            height={65}
            className="h-11 sm:h-13 md:h-14 w-auto object-contain transition-transform group-hover:scale-105"
            priority
          />
        </Link>

        <div className="text-xs sm:text-sm text-slate-600">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-blue-600 hover:text-blue-700 hover:underline">
            Login
          </Link>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-md w-full mx-auto px-4 py-8">
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200/90">
          
          {/* Header */}
          <div className="mb-6 text-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>1-Day Full Feature Free Trial</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Start Your 1-Day Free Trial
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1.5">
              Set up your business in a few minutes. No credit card required.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Mobile Number */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Mobile Number
              </label>
              <div className="flex items-center rounded-xl border border-slate-200 bg-white px-3 py-2.5 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                <span className="text-xs font-semibold text-slate-500 pr-2 border-r border-slate-200 select-none">
                  🇮🇳 +91
                </span>
                <input
                  type="tel"
                  required
                  placeholder="92573 78047"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-2.5 text-sm text-slate-900 placeholder:text-slate-400 bg-transparent outline-none"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Work Email Address
              </label>
              <input
                type="email"
                required
                placeholder="owner@yourbusiness.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Create Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Primary CTA */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
            >
              <span>{isLoading ? 'Creating Trial...' : 'Continue →'}</span>
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <span className="relative bg-white px-3 text-xs uppercase font-medium text-slate-400">
              OR
            </span>
          </div>

          {/* Google Button */}
          <button
            type="button"
            onClick={handleGoogleAuth}
            disabled={isLoading}
            className="w-full py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center justify-center gap-2.5 shadow-2xs transition-colors"
          >
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          {/* Value checkmarks */}
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-center gap-4 text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              1-Day Full Access
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              Cancel Anytime
            </span>
          </div>

          {/* Legal */}
          <p className="mt-4 text-center text-[10px] text-slate-400 leading-normal">
            By signing up, you agree to Pixora Automations&apos;{' '}
            <Link href="/terms" target="_blank" className="underline hover:text-slate-600 transition-colors">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" target="_blank" className="underline hover:text-slate-600 transition-colors">
              Privacy Policy
            </Link>.
          </p>

        </div>
      </div>

      {/* Bottom info */}
      <div className="py-4 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} Pixora Automations. Built for local business growth.
      </div>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center text-sm text-slate-500">Loading trial setup...</div>}>
      <SignUpContent />
    </Suspense>
  );
}
