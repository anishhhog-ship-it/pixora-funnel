'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { Prospect } from '@/types/sales';
import {
  CalendarCheck,
  Phone,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export default function FollowupsTasksPage() {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/sales/prospects', {
        headers: { Authorization: session ? `Bearer ${session.access_token}` : '' },
      });
      const data = await res.json();
      if (data.success) {
        setProspects(data.prospects || []);
      }
    } catch (e) {
      console.warn('Fetch tasks error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const scheduled = prospects.filter((p) => p.next_followup_date);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <CalendarCheck className="w-6 h-6 text-amber-600" />
          <span>Follow-ups &amp; Field Tasks</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Keep track of scheduled client meetings, demo reviews, and conversion calls.
        </p>
      </div>

      {loading ? (
        <div className="py-24 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-[#5356EC] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : scheduled.length === 0 ? (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-12 text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto">
            <CalendarCheck className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900 text-base">All caught up!</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No pending follow-ups scheduled. Check your leads list to schedule next steps with prospective clients.
          </p>
          <Link
            href="/sales/leads"
            className="px-4 py-2 bg-[#5356EC] hover:bg-[#4346DB] text-white font-bold text-xs rounded-xl shadow-xs inline-block transition-colors"
          >
            Go to Leads
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {scheduled.map((lead) => (
            <div
              key={lead.id}
              className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs hover:border-slate-300 transition-colors"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-slate-900 text-sm">{lead.business_name}</h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-[#5356EC] border border-indigo-200">
                    {lead.stage}
                  </span>
                </div>
                <p className="text-xs text-slate-600">
                  Contact: <span className="text-slate-900 font-semibold">{lead.contact_name || 'Owner'}</span>
                  {lead.phone && <span className="ml-2 text-slate-500">({lead.phone})</span>}
                </p>
                {lead.notes && (
                  <p className="text-[11px] text-slate-500 italic mt-1">&ldquo;{lead.notes}&rdquo;</p>
                )}
              </div>

              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="text-right text-xs">
                  <span className="inline-flex items-center gap-1 font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    <span>{new Date(lead.next_followup_date!).toLocaleDateString()}</span>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/sales/demo-builder?prospectId=${lead.id}`}
                    className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                    title="Build Demo"
                  >
                    <Sparkles className="w-4 h-4 text-[#5356EC]" />
                  </Link>
                  <Link
                    href={`/sales/conversions?prospectId=${lead.id}`}
                    className="px-3.5 py-2 rounded-xl bg-[#5356EC] hover:bg-[#4346DB] text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
                  >
                    <span>Close Deal</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
