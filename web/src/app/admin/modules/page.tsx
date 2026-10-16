'use client';

import { useEffect, useState } from 'react';
import { Check, RefreshCw, ShieldCheck, ToggleLeft, ToggleRight } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { getAdminModules, updateAdminFeature } from '@/services/adminService';

type Feature = { id: string; feature_key: string; feature_name: string; feature_value: string; is_enabled: boolean };
type Plan = { id: string; name: string; slug: string; description: string | null; price_inr: number; billing_interval: string; is_active: boolean; plan_features: Feature[] };

export default function ModulesPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Your admin session has expired.');
      setPlans(await getAdminModules(session.access_token));
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to load plans and features.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const toggle = async (feature: Feature) => {
    setSaving(feature.id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Your admin session has expired.');
      const updated = await updateAdminFeature(session.access_token, feature.id, !feature.is_enabled);
      setPlans((current) => current.map((plan) => ({ ...plan, plan_features: plan.plan_features.map((item) => item.id === feature.id ? { ...item, is_enabled: updated.is_enabled } : item) })));
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to update feature.'); }
    finally { setSaving(null); }
  };

  return <div className="mx-auto w-full max-w-[1400px] space-y-6 pb-12">
    <div className="flex items-end justify-between gap-4"><div><h1 className="text-[28px] font-bold tracking-tight text-slate-900">Modules &amp; Features</h1><p className="mt-2 text-[15px] text-slate-500">Review the feature entitlements currently stored for each plan.</p></div><button type="button" onClick={load} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60"><RefreshCw className={loading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />Refresh</button></div>
    {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
    {loading ? <div className="flex min-h-[300px] items-center justify-center"><RefreshCw className="h-7 w-7 animate-spin text-blue-600" /></div> : plans.length === 0 ? <Empty text="No plans or feature entitlements are configured." /> : <div className="grid gap-5 lg:grid-cols-2">{plans.map((plan) => <section key={plan.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-start justify-between gap-4"><div><div className="flex items-center gap-2"><h2 className="text-lg font-bold text-slate-900">{plan.name}</h2>{plan.is_active && <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold uppercase text-emerald-700">Active</span>}</div><p className="mt-1 text-xs text-slate-500">{plan.description || 'No plan description recorded.'}</p></div><div className="text-right"><div className="text-lg font-bold text-slate-900">₹{Number(plan.price_inr || 0).toLocaleString('en-IN')}</div><div className="text-[11px] text-slate-500">{plan.billing_interval}</div></div></div><div className="mt-5 divide-y divide-slate-100 border-t border-slate-100">{(plan.plan_features || []).map((feature) => <div key={feature.id} className="flex items-center justify-between gap-3 py-3"><div className="flex min-w-0 items-center gap-2"><Check className={feature.is_enabled ? 'h-4 w-4 shrink-0 text-emerald-600' : 'h-4 w-4 shrink-0 text-slate-300'} /><div><div className="text-sm font-semibold text-slate-800">{feature.feature_name}</div><div className="text-[11px] text-slate-400">{feature.feature_key} · {feature.feature_value}</div></div></div><button type="button" onClick={() => toggle(feature)} disabled={saving === feature.id} aria-label={`${feature.is_enabled ? 'Disable' : 'Enable'} ${feature.feature_name}`} className="shrink-0 text-slate-500 hover:text-blue-600 disabled:opacity-50">{feature.is_enabled ? <ToggleRight className="h-7 w-7 text-emerald-600" /> : <ToggleLeft className="h-7 w-7" />}</button></div>)}</div></section>)}</div>}
  </div>;
}

function Empty({ text }: { text: string }) { return <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white text-center text-sm text-slate-500"><ShieldCheck className="mb-3 h-8 w-8 text-slate-300" />{text}</div>; }
