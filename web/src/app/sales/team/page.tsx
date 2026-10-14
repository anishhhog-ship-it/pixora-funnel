'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { SalesStaff, SalesRole } from '@/types/sales';
import {
  UserCheck,
  UserPlus,
  Mail,
  Phone,
  Shield,
  CheckCircle2,
  AlertCircle,
  X,
  Lock,
  Clock,
  Briefcase,
} from 'lucide-react';

export default function SalesTeamPage() {
  const [team, setTeam] = useState<SalesStaff[]>([]);
  const [loading, setLoading] = useState(true);
  const [addModalOpen, setAddModalOpen] = useState(false);

  // Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<SalesRole>('salesperson');
  const [temporaryPassword, setTemporaryPassword] = useState('');
  const [notes, setNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchTeam = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/sales/staff', {
        headers: { Authorization: session ? `Bearer ${session.access_token}` : '' },
      });
      const data = await res.json();
      if (data.success) {
        setTeam(data.staff || []);
      }
    } catch (e) {
      console.warn('Fetch team error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, []);

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/sales/staff', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: session ? `Bearer ${session.access_token}` : '',
        },
        body: JSON.stringify({
          fullName,
          email,
          phone,
          role,
          temporaryPassword,
          notes,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        setErrorMsg(data.error || 'Failed to create salesperson');
      } else {
        setSuccessMsg(data.message);
        setAddModalOpen(false);
        setFullName('');
        setEmail('');
        setPhone('');
        setTemporaryPassword('');
        setNotes('');
        fetchTeam();
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (staffId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'deactivated' : 'active';
      const { data: { session } } = await supabase.auth.getSession();
      await fetch('/api/sales/staff', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: session ? `Bearer ${session.access_token}` : '',
        },
        body: JSON.stringify({ staffId, status: newStatus }),
      });
      fetchTeam();
    } catch (e) {
      console.warn('Toggle staff error:', e);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-[#5356EC]" />
            <span>Sales Team &amp; Staff Management</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Create real salesperson accounts, assign roles, and monitor team field activities.
          </p>
        </div>

        <button
          onClick={() => setAddModalOpen(true)}
          className="px-4 py-2.5 bg-[#5356EC] hover:bg-[#4346DB] text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 cursor-pointer self-start transition-colors"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>+ Add Salesperson</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {loading ? (
        <div className="py-24 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-[#5356EC] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : team.length === 0 ? (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-12 text-center space-y-4 shadow-xs">
          <div className="w-12 h-12 bg-indigo-50 text-[#5356EC] rounded-2xl flex items-center justify-center mx-auto">
            <UserCheck className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900 text-base">No sales staff accounts added yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Provision the first salesperson account to allow field reps to create prospects and demos.
          </p>
          <button
            onClick={() => setAddModalOpen(true)}
            className="px-4 py-2 bg-[#5356EC] hover:bg-[#4346DB] text-white font-bold text-xs rounded-xl shadow-xs inline-flex items-center gap-2 cursor-pointer transition-colors"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Create Salesperson Account</span>
          </button>
        </div>
      ) : (
        <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase tracking-wider text-[11px] font-semibold">
                <tr>
                  <th className="py-3 px-4">Salesperson</th>
                  <th className="py-3 px-4">Email &amp; Phone</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Account Status</th>
                  <th className="py-3 px-4">Last Active</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {team.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900 text-sm">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-indigo-50 text-[#5356EC] border border-indigo-100 flex items-center justify-center font-bold text-xs">
                          {member.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p>{member.full_name}</p>
                          {member.notes && <p className="text-[10px] text-slate-400 font-normal">{member.notes}</p>}
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600">
                      <p className="flex items-center gap-1.5 font-medium">
                        <Mail className="w-3 h-3 text-slate-400" /> {member.email}
                      </p>
                      {member.phone && (
                        <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400" /> {member.phone}
                        </p>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          member.role === 'admin'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : member.role === 'sales_manager'
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : 'bg-indigo-50 text-[#5356EC] border-indigo-200'
                        }`}
                      >
                        {member.role === 'admin'
                          ? 'Super Admin'
                          : member.role === 'sales_manager'
                          ? 'Sales Manager'
                          : 'Salesperson'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          member.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : member.status === 'invited'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        {member.status.toUpperCase()}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                      {member.last_active_at ? (
                        <span>{new Date(member.last_active_at).toLocaleDateString()}</span>
                      ) : (
                        <span className="text-slate-400">Pending login</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      {member.role !== 'admin' && (
                        <button
                          onClick={() => handleToggleStatus(member.id, member.status)}
                          className={`text-xs font-semibold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                            member.status === 'active'
                              ? 'border-slate-200 text-slate-600 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200'
                              : 'border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                          }`}
                        >
                          {member.status === 'active' ? 'Deactivate' : 'Reactivate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Salesperson Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg p-6 sm:p-8 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-[#5356EC] flex items-center justify-center">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Create Salesperson Account</h3>
                  <p className="text-xs text-slate-500">Provisions real Supabase Auth user &amp; staff credentials</p>
                </div>
              </div>
              <button
                onClick={() => setAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-700">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateStaff} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-700 font-semibold">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vikas Sharma"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#5356EC] focus:border-[#5356EC]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 font-semibold">Work Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="vikas@pixora.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#5356EC] focus:border-[#5356EC]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-700 font-semibold">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#5356EC] focus:border-[#5356EC]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-700 font-semibold">Role *</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as SalesRole)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#5356EC] focus:border-[#5356EC]"
                  >
                    <option value="salesperson">Salesperson (Field Rep)</option>
                    <option value="sales_manager">Sales Manager</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 font-semibold">
                  Password (Leave empty to send email invitation)
                </label>
                <input
                  type="text"
                  placeholder="e.g. SalesRep@2026! (or leave blank)"
                  value={temporaryPassword}
                  onChange={(e) => setTemporaryPassword(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#5356EC] focus:border-[#5356EC]"
                />
                <p className="text-[11px] text-slate-400">
                  If set, staff member can log in immediately. If left empty, an email invite is dispatched.
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 font-semibold">Internal Notes</label>
                <textarea
                  rows={2}
                  placeholder="Territory assigned, target quotes, etc."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#5356EC] focus:border-[#5356EC]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-[#5356EC] hover:bg-[#4346DB] text-white font-bold flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Creating Auth User...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
