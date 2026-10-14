'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Lock, Mail, User as UserIcon, CheckCircle2, AlertCircle } from 'lucide-react';
import { authService } from '@/services';

export default function LoginPage() {
  const router = useRouter();

  // Auth state
  const [isSignUp, setIsSignUp] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  // Handle Email Submit (Sign In or Sign Up)
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfoMessage(null);

    if (!email || !email.includes('@')) {
      setError('Please enter a valid business email address.');
      return;
    }

    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    try {
      setIsLoading(true);
      if (isSignUp) {
        await authService.signUp({
          name: fullName.trim() || undefined,
          email: email.trim(),
          password,
        });
        setInfoMessage('Account created successfully! Redirecting to onboarding...');
        router.push('/onboarding');
      } else {
        const user = await authService.login({
          email: email.trim(),
          password,
        });
        
        // Check if user is an Admin or Salesperson
        const { supabase } = await import('@/lib/supabase/client');
        const { data: adminRecord } = await (supabase as any)
          .from('platform_admins')
          .select('id, role')
          .or(`auth_user_id.eq.${user.id},email.ilike.${user.email}`)
          .eq('is_active', true)
          .maybeSingle();

        if (adminRecord || user.email?.toLowerCase() === 'admin@pixoraautomations.com') {
          setInfoMessage('Admin verified! Opening Super Admin Dashboard...');
          router.push('/admin');
          return;
        }

        const { data: staffRecord } = await (supabase as any)
          .from('sales_staff')
          .select('id, role')
          .or(`auth_user_id.eq.${user.id},email.ilike.${user.email}`)
          .eq('status', 'active')
          .maybeSingle();

        if (staffRecord) {
          setInfoMessage('Sales representative verified! Opening Sales Portal...');
          router.push('/sales');
          return;
        }

        // Redirect logic for client businesses
        const { businessService } = await import('@/services');
        const bizs = await businessService.getBusinessesForUser(user.id);
        
        if (bizs.length === 0) {
          setError('No business profile attached to this email');
          setIsLoading(false);
          return;
        } else {
          setInfoMessage('Signed in successfully! Redirecting to dashboard...');
          router.push('/dashboard');
        }
      }
    } catch (err: any) {
      setError(err?.message || (isSignUp ? 'Account creation failed. Please try again.' : 'Login failed. Please verify your credentials.'));
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Google Login
  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const user = await authService.signInWithGoogle();
      
      // If we are in local mock mode, check if they have a business
      const { isSupabaseConfigured } = await import('@/lib/supabase/client');
      if (!isSupabaseConfigured() && user) {
        const { businessService } = await import('@/services');
        const bizs = await businessService.getBusinessesForUser(user.id);
        if (bizs.length === 0) {
          setError('No business profile attached to this email');
          setIsLoading(false);
          return;
        }
        router.push('/dashboard');
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
          New to Pixora Funnel?{' '}
          <Link href="/onboarding" className="font-semibold text-blue-600 hover:text-blue-700 hover:underline">
            Start 1-Day Trial
          </Link>
        </div>
      </div>

      {/* Main Card */}
      <div className="max-w-md w-full mx-auto px-4 py-8">
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200/90">
          
          {/* Header */}
          <div className="mb-6 text-center">
            {/* Pixora Mark Icon */}
            <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-center p-2">
              <Image
                src="/pixora-mark.png"
                alt="Pixora Funnel"
                width={48}
                height={48}
                className="w-full h-full object-contain"
              />
            </div>
            
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {isSignUp ? 'Create Your Account' : 'Welcome Back'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {isSignUp
                ? 'Sign up to start collecting 5-star Google reviews on autopilot.'
                : 'Log in to your Pixora Funnel client portal.'}
            </p>
          </div>

          {/* Feedback Alerts */}
          {error && (
            <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium space-y-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span className="font-semibold">{error}</span>
              </div>
              {error === 'No business profile attached to this email' && (
                <div className="pt-2 border-t border-red-200/60 flex items-center justify-between text-[11px]">
                  <span className="text-red-700">Need to create your funnel?</span>
                  <Link
                    href="/onboarding"
                    className="font-bold text-red-800 hover:text-red-950 underline flex items-center gap-1"
                  >
                    <span>Start 1-Day Trial →</span>
                  </Link>
                </div>
              )}
            </div>
          )}

          {infoMessage && (
            <div className="mb-4 p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-xs font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-blue-600" />
              <span>{infoMessage}</span>
            </div>
          )}

          {/* Email Authentication Form */}
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            {isSignUp && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Your Full Name
                </label>
                <div className="flex items-center rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                  <UserIcon className="w-4 h-4 text-slate-400 mr-2.5 shrink-0" />
                  <input
                    type="text"
                    placeholder="e.g. Vikram Joshi"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full text-sm text-slate-900 placeholder:text-slate-400 bg-transparent outline-none"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Business Email
              </label>
              <div className="flex items-center rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                <Mail className="w-4 h-4 text-slate-400 mr-2.5 shrink-0" />
                <input
                  type="email"
                  required
                  placeholder="owner@yourbusiness.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-sm text-slate-900 placeholder:text-slate-400 bg-transparent outline-none"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Password
                </label>
                {!isSignUp && (
                  <span className="text-[11px] text-blue-600 hover:underline cursor-pointer">
                    Forgot?
                  </span>
                )}
              </div>
              <div className="flex items-center rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                <Lock className="w-4 h-4 text-slate-400 mr-2.5 shrink-0" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full text-sm text-slate-900 placeholder:text-slate-400 bg-transparent outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-slate-500">
                {isSignUp ? 'Already have an account?' : 'Need a new account?'}
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError(null);
                  setInfoMessage(null);
                }}
                className="font-semibold text-blue-600 hover:underline cursor-pointer"
              >
                {isSignUp ? 'Sign In instead' : 'Sign Up with Email'}
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading || !email.trim() || !password.trim()}
              className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
            >
              <span>
                {isLoading
                  ? isSignUp
                    ? 'Creating Account...'
                    : 'Signing In...'
                  : isSignUp
                  ? 'Create Account'
                  : 'Sign In to Client Portal'}
              </span>
              <ArrowRight className="w-4 h-4" />
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
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2.5 shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <svg viewBox="0 0 24 24" width="18" height="18">
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

          {/* Legal / Notice */}
          <div className="mt-6 pt-4 border-t border-slate-100 text-center text-[10px] text-slate-400">
            By continuing, you agree to our{' '}
            <Link href="/terms" target="_blank" className="underline hover:text-slate-600 transition-colors">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" target="_blank" className="underline hover:text-slate-600 transition-colors">
              Privacy Policy
            </Link>.
          </div>

        </div>
      </div>

      {/* Bottom info */}
      <div className="py-4 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} Pixora Automations. Secure client portal.
      </div>
    </div>
  );
}
