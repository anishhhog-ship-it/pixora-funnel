'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { 
  getAdminSupportTickets, 
  replyToSupportTicket, 
  broadcastAdminNotification 
} from '@/services/adminService';
import { 
  LifeBuoy, 
  Filter, 
  AlertTriangle, 
  Send, 
  Bell, 
  CheckCircle2, 
  X, 
  Sparkles,
  MessageSquare
} from 'lucide-react';

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Reply Modal State
  const [activeTicket, setActiveTicket] = useState<any | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [replyStatus, setReplyStatus] = useState('Resolved');
  const [isSendingReply, setIsSendingReply] = useState(false);

  // Broadcast Notification Modal State
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastType, setBroadcastType] = useState('admin_broadcast');
  const [broadcastLink, setBroadcastLink] = useState('/dashboard');
  const [isSendingBroadcast, setIsSendingBroadcast] = useState(false);
  const [broadcastSuccess, setBroadcastSuccess] = useState(false);

  async function load() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const data = await getAdminSupportTickets(session.access_token);
        setTickets(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTicket || !replyMessage.trim()) return;

    setIsSendingReply(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await replyToSupportTicket(
          session.access_token,
          activeTicket.id,
          replyMessage.trim(),
          replyStatus
        );
        setActiveTicket(null);
        setReplyMessage('');
        await load();
      }
    } catch (err) {
      console.error('Failed to reply to ticket:', err);
    } finally {
      setIsSendingReply(false);
    }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) return;

    setIsSendingBroadcast(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await broadcastAdminNotification(session.access_token, {
          title: broadcastTitle.trim(),
          message: broadcastMessage.trim(),
          type: broadcastType,
          link: broadcastLink.trim() || '/dashboard',
        });
        setBroadcastSuccess(true);
        setTimeout(() => {
          setShowBroadcastModal(false);
          setBroadcastSuccess(false);
          setBroadcastTitle('');
          setBroadcastMessage('');
        }, 1200);
      }
    } catch (err) {
      console.error('Failed to broadcast notification:', err);
    } finally {
      setIsSendingBroadcast(false);
    }
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4">
        <div>
          <h1 className="text-[28px] font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Support &amp; Client Communication
          </h1>
          <p className="text-[15px] text-slate-500 mt-1">
            Respond to client support tickets and broadcast live announcements to all client dashboards.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowBroadcastModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer self-start sm:self-auto"
        >
          <Bell className="w-4 h-4" />
          <span>Broadcast Notification to Clients</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="flex-1 overflow-x-auto min-h-[400px]">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : tickets.length === 0 ? (
            <div className="flex flex-col h-64 items-center justify-center text-slate-400">
              <MessageSquare className="w-10 h-10 mb-2 opacity-50" />
              <p className="font-semibold text-slate-600 text-sm">No support tickets found</p>
            </div>
          ) : (
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-500 font-bold text-xs uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">Ticket</th>
                  <th className="px-6 py-4">Business</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Priority</th>
                  <th className="px-6 py-4">Created</th>
                  <th className="px-6 py-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tickets.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4">
                       <div className="font-bold text-slate-900">{t.subject}</div>
                       <div className="text-xs text-slate-500 truncate max-w-[280px]">
                         {t.description || 'No description provided'}
                       </div>
                       {t.admin_reply && (
                         <div className="text-[11px] text-blue-600 mt-1 truncate max-w-[280px]">
                           ✓ Reply: {t.admin_reply}
                         </div>
                       )}
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-medium">{t.businesses?.name || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`text-[11px] font-bold px-2 py-1 rounded-md w-max ${t.status === 'Open' ? 'bg-rose-50 text-rose-700' : t.status === 'Resolved' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'}`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                       {t.priority === 'High Priority' ? (
                          <span className="text-rose-600 font-bold flex items-center gap-1 text-xs"><AlertTriangle className="w-3 h-3"/> High</span>
                       ) : (
                          <span className="text-slate-600 font-medium text-xs">{t.priority}</span>
                       )}
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-xs">{new Date(t.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTicket(t);
                          setReplyMessage(t.admin_reply || '');
                        }}
                        className="text-blue-600 hover:text-blue-800 font-bold text-xs hover:underline cursor-pointer"
                      >
                        {t.admin_reply ? 'Edit Reply' : 'Reply & Notify'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Ticket Reply Modal */}
      {activeTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative">
            <button
              onClick={() => setActiveTicket(null)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 mb-1">
              Reply to Ticket #{activeTicket.id.slice(0, 8)}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Replying will update the ticket and instantly push a notification to the client dashboard.
            </p>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 mb-4 text-xs space-y-1">
              <p className="font-bold text-slate-800">{activeTicket.subject}</p>
              <p className="text-slate-600 whitespace-pre-wrap">{activeTicket.description}</p>
            </div>

            <form onSubmit={handleSendReply} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Resolution / Support Response
                </label>
                <textarea
                  required
                  rows={4}
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="Type official response to the client..."
                  className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Status
                </label>
                <select
                  value={replyStatus}
                  onChange={(e) => setReplyStatus(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800"
                >
                  <option value="Resolved">Resolved</option>
                  <option value="Pending Reply">In Progress / Pending Reply</option>
                  <option value="Open">Keep Open</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTicket(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSendingReply}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSendingReply ? 'Sending...' : 'Send Reply & Notify Client'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Broadcast Notification Modal */}
      {showBroadcastModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative">
            <button
              onClick={() => setShowBroadcastModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <Bell className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-bold text-slate-900">
                Broadcast Notification
              </h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Sends a live notification to all client dashboards connected to the platform.
            </p>

            {broadcastSuccess ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center text-emerald-800 text-xs font-bold flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Notification successfully broadcasted to clients!</span>
              </div>
            ) : (
              <form onSubmit={handleSendBroadcast} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Notification Title
                  </label>
                  <input
                    type="text"
                    required
                    value={broadcastTitle}
                    onChange={(e) => setBroadcastTitle(e.target.value)}
                    placeholder="e.g. 📢 System Maintenance or New NFC Feature Available"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Notification Message
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={broadcastMessage}
                    onChange={(e) => setBroadcastMessage(e.target.value)}
                    placeholder="Detailed announcement text displayed inside the client notification bell..."
                    className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Type
                    </label>
                    <select
                      value={broadcastType}
                      onChange={(e) => setBroadcastType(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800"
                    >
                      <option value="admin_broadcast">Admin Announcement</option>
                      <option value="system">System Alert</option>
                      <option value="trial">Plan / Feature Update</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Target Link
                    </label>
                    <input
                      type="text"
                      value={broadcastLink}
                      onChange={(e) => setBroadcastLink(e.target.value)}
                      placeholder="/dashboard/qr"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowBroadcastModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSendingBroadcast}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSendingBroadcast ? 'Broadcasting...' : 'Broadcast to Clients'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
