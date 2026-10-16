'use client';

import { useEffect, useState } from 'react';
import { RefreshCw, Save, Settings, ShieldCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { getAdminSettings, updateAdminProfile } from '@/services/adminService';

type Admin = {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
};

export default function SettingsPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Your admin session has expired.');

      const result = await getAdminSettings(session.access_token);
      setAdmins(result.admins as Admin[]);
      const currentAdmin = (result.admins as Admin[]).find(
        (admin: Admin) => admin.id === result.current.adminId,
      );
      setName(currentAdmin?.full_name || '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load admin settings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Your admin session has expired.');

      const updated = await updateAdminProfile(session.access_token, name);
      setAdmins((current) => current.map((admin: Admin) => (
        admin.id === updated.id
          ? { ...admin, full_name: updated.full_name }
          : admin
      )));
      setMessage('Profile name saved.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1200px] space-y-6 pb-12">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-[28px] font-bold tracking-tight text-slate-900">
            <Settings className="h-7 w-7 text-blue-600" />
            Admin Settings
          </h1>
          <p className="mt-2 text-[15px] text-slate-500">
            Manage verified platform administrators and your display name.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>}
      {message && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{message}</div>}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <form onSubmit={save} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-xl bg-blue-50 p-3 text-blue-600"><ShieldCheck className="h-5 w-5" /></div>
            <div>
              <h2 className="font-semibold text-slate-900">Your admin profile</h2>
              <p className="text-xs text-slate-500">This name is shown in admin audit records.</p>
            </div>
          </div>
          <label className="block text-sm font-medium text-slate-700" htmlFor="admin-name">Display name</label>
          <input
            id="admin-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
          <button type="submit" disabled={saving || loading} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
            <Save className="h-4 w-4" />
            {saving ? 'Saving…' : 'Save profile'}
          </button>
        </form>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-slate-900">Verified administrators</h2>
          <p className="mt-1 text-sm text-slate-500">Accounts with platform-admin access.</p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                <tr><th className="px-3 py-3">Name</th><th className="px-3 py-3">Email</th><th className="px-3 py-3">Role</th><th className="px-3 py-3">Status</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {admins.map((admin: Admin) => (
                  <tr key={admin.id}>
                    <td className="px-3 py-3 font-medium text-slate-800">{admin.full_name || 'Unnamed admin'}</td>
                    <td className="px-3 py-3 text-slate-600">{admin.email}</td>
                    <td className="px-3 py-3 capitalize text-slate-600">{admin.role.replace('_', ' ')}</td>
                    <td className="px-3 py-3"><span className={`rounded-full px-2 py-1 text-xs font-semibold ${admin.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{admin.is_active ? 'Active' : 'Inactive'}</span></td>
                  </tr>
                ))}
                {!loading && admins.length === 0 && <tr><td colSpan={4} className="px-3 py-8 text-center text-slate-500">No administrator records were returned.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
