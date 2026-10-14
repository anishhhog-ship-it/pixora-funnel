'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import {
  Settings,
  User,
  Shield,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  LogOut,
  Sparkles,
  Flame,
} from 'lucide-react';

export default function SalesSettingsPage() {
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('salesperson');
  const [loading, setLoading] = useState(true);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [passSuccess, setPassSuccess] = useState<string | null>(null);
  const [passError, setPassError] = useState<string | null>(null);

  useEffect(() => {
    async function loadUser() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const response = await fetch('/api/sales/me', { headers: { Authorization: `Bearer ${session.access_token}` } });
          const data = await response.json();
          if (!response.ok || !data.success || !data.staff) throw new Error(data.error || 'Sales profile unavailable');
          setUserEmail(data.staff.email || session.user.email || '');
          setUserName(data.staff.fullName || session.user.email?.split('@')[0] || 'Sales Rep');
          setUserRole(data.staff.role);
        }
      } catch (e) {
        console.warn('Load user error:', e);
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, []);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError(null);
    setPassSuccess(null);

    if (newPassword.length < 6) {
      setPassError('Password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPassError('Passwords do not match.');
      return;
    }

    setUpdatingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        setPassError(error.message);
      } else {
        setPassSuccess('Password updated successfully.');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err: unknown) {
      setPassError(err instanceof Error ? err.message : 'Password update failed.');
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  if (loading) {
    return (
      <div className="py-24 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#5356EC] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-[#5356EC]" />
          <span>Sales Settings &amp; Profile</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage your salesperson account details, security credentials, and view system permissions.
        </p>
      </div>

      {/* Profile Card */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-[#5356EC] flex items-center justify-center font-bold text-xl border border-indigo-100">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base">{userName}</h3>
            <p className="text-xs text-slate-500">{userEmail}</p>
            <div className="mt-1">
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-[#5356EC] border border-indigo-200">
                {userRole === 'admin'
                  ? 'SUPER ADMIN'
                  : userRole === 'sales_manager'
                  ? 'SALES MANAGER'
                  : 'SALES EXECUTIVE'}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-slate-400 font-semibold block text-[11px]">ROLE ACCESS LEVEL</span>
            <p className="font-bold text-slate-800 mt-0.5">
              {userRole === 'admin'
                ? 'Full Platform & Verification Control'
                : 'Assigned Leads & Demos Access'}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-slate-400 font-semibold block text-[11px]">PAYMENT VERIFICATION POLICY</span>
            <p className="font-bold text-slate-800 mt-0.5">
              Strict RBAC: Only Admin can approve bank receipts
            </p>
          </div>
        </div>
      </div>

      {/* Security: Change Password */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-[#5356EC]" />
          <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider">
            Update Account Password
          </h3>
        </div>

        {passSuccess && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{passSuccess}</span>
          </div>
        )}

        {passError && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{passError}</span>
          </div>
        )}

        <form onSubmit={handleUpdatePassword} className="space-y-4 text-xs max-w-md">
          <div className="space-y-1">
            <label className="text-slate-700 font-semibold">New Password</label>
            <input
              type="password"
              required
              placeholder="Minimum 6 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#5356EC] focus:border-[#5356EC]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-slate-700 font-semibold">Confirm New Password</label>
            <input
              type="password"
              required
              placeholder="Re-enter password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#5356EC] focus:border-[#5356EC]"
            />
          </div>

          <button
            type="submit"
            disabled={updatingPassword}
            className="px-5 py-2.5 rounded-xl bg-[#5356EC] hover:bg-[#4346DB] text-white font-bold text-xs shadow-xs cursor-pointer disabled:opacity-50 transition-colors"
          >
            {updatingPassword ? 'Updating...' : 'Change Password'}
          </button>
        </form>
      </div>

      {/* Logout */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs flex items-center justify-between">
        <div>
          <h4 className="font-bold text-slate-900 text-sm">Session Sign Out</h4>
          <p className="text-xs text-slate-500 mt-0.5">Safely log out of this sales device</p>
        </div>
        <button
          onClick={handleSignOut}
          className="px-4 py-2.5 rounded-xl bg-slate-50 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200 hover:border-rose-200 text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}
