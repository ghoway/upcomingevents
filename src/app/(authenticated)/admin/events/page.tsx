'use client';

import { useState, useEffect, useCallback } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useToast } from '@/components/Toast';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import {
  CalendarCheck, Calendar, CheckCircle, XCircle, Ban, Clock,
  ChevronLeft, ChevronRight, AlertCircle, X, MessageSquare
} from 'lucide-react';

interface Event {
  id: string; title: string; description: string | null;
  date: string; startTime: string; endTime: string; status: string;
  remarks: string | null;
  room: { id: string; name: string; isMainRoom: boolean };
  employee: { id: string; name: string; department: { id: string; name: string } };
}

export default function AdminEventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [filter, setFilter] = useState<string>('ALL');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;
  const { toast } = useToast();

  // Remarks modal state
  const [remarksModal, setRemarksModal] = useState<{
    open: boolean;
    eventId: string;
    action: 'reject' | 'cancel';
    eventTitle: string;
    remarks: string;
  }>({ open: false, eventId: '', action: 'reject', eventTitle: '', remarks: '' });

const fetchEvents = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ date: selectedDate, page: page.toString(), limit: limit.toString() });
    if (filter !== 'ALL') params.set('status', filter);
    const res = await fetch(`/api/events?${params}`);
    const data = await res.json();
    setEvents(data.data);
    setTotal(data.total);
    setLoading(false);
  }, [selectedDate, filter, page]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const totalPages = Math.ceil(total / limit);

  useWebSocket((msg) => {
    if (msg.type === 'event-updated') fetchEvents();
  });

  const actionLabels: Record<string, { success: string; fail: string }> = {
    approve: { success: 'Agenda berhasil disetujui', fail: 'Gagal menyetujui agenda' },
    reject: { success: 'Agenda berhasil ditolak', fail: 'Gagal menolak agenda' },
    cancel: { success: 'Agenda berhasil dibatalkan', fail: 'Gagal membatalkan agenda' },
  };

  const handleApprove = async (eventId: string) => {
    setActionLoading(eventId);
    try {
      const res = await fetch(`/api/events/${eventId}/approve`, { method: 'POST' });
      if (!res.ok) {
        const data = await res.json();
        toast('error', data.error || actionLabels.approve.fail);
      } else {
        toast('success', actionLabels.approve.success);
      }
    } catch (err) {
      toast('error', 'Terjadi kesalahan jaringan');
    } finally {
      setActionLoading(null);
    }
  };

  const openRemarksModal = (eventId: string, action: 'reject' | 'cancel', eventTitle: string) => {
    setRemarksModal({ open: true, eventId, action, eventTitle, remarks: '' });
  };

  const handleRemarksSubmit = async () => {
    const { eventId, action, remarks } = remarksModal;
    setActionLoading(eventId);
    setRemarksModal({ ...remarksModal, open: false });
    try {
      const res = await fetch(`/api/events/${eventId}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ remarks: remarks.trim() || null }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast('error', data.error || actionLabels[action].fail);
      } else {
        toast('success', actionLabels[action].success);
      }
    } catch (err) {
      toast('error', 'Terjadi kesalahan jaringan');
    } finally {
      setActionLoading(null);
    }
  };

  const changeDate = (days: number) => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const dt = new Date(y, m - 1, d + days);
    setSelectedDate(format(dt, 'yyyy-MM-dd'));
  };

  const statusBadge = (status: string) => {
    const map: Record<string, { bg: string; text: string; icon: any; label: string }> = {
      APPROVED: { bg: 'bg-emerald-500/10 border-emerald-500/20', text: 'text-emerald-400', icon: CheckCircle, label: 'Disetujui' },
      PENDING: { bg: 'bg-amber-500/10 border-amber-500/20 badge-pending', text: 'text-amber-400', icon: Clock, label: 'Menunggu' },
      REJECTED: { bg: 'bg-red-500/10 border-red-500/20', text: 'text-red-400', icon: XCircle, label: 'Ditolak' },
      CANCELLED: { bg: 'bg-gray-500/10 border-gray-500/20', text: 'text-gray-400', icon: Ban, label: 'Dibatalkan' },
    };
    const s = map[status] || map.PENDING;
    const Icon = s.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${s.bg} ${s.text}`}>
        <Icon className="w-3.5 h-3.5" /> {s.label}
      </span>
    );
  };

  const formattedDate = (() => {
    try {
      const [y, m, d] = selectedDate.split('-').map(Number);
      return format(new Date(y, m - 1, d), 'EEEE, dd MMMM yyyy', { locale: idLocale });
    } catch { return selectedDate; }
  })();

  const pending = events.filter(e => e.status === 'PENDING');

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text">Manajemen Agenda</h1>
          <p className="text-text-muted text-sm mt-1">Kelola persetujuan dan pembatalan agenda</p>
        </div>
      </div>

      {/* Date & status filter */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <button onClick={() => changeDate(-1)} className="p-2 rounded-lg bg-surface-light hover:bg-surface-lighter border border-border transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-light border border-border">
          <Calendar className="w-4 h-4 text-primary-light" />
          <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-transparent text-text text-sm border-none outline-none" />
        </div>
        <button onClick={() => changeDate(1)} className="p-2 rounded-lg bg-surface-light hover:bg-surface-lighter border border-border transition-colors">
          <ChevronRight className="w-5 h-5" />
        </button>
        <button onClick={() => setSelectedDate(format(new Date(), 'yyyy-MM-dd'))}
          className="px-3 py-2 rounded-lg bg-primary/10 text-primary-light border border-primary/20 text-xs font-medium">
          Hari Ini
        </button>
        <div className="ml-auto flex gap-2">
          {['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                filter === s ? 'bg-primary/20 text-primary-light border-primary/30' : 'bg-surface-light text-text-muted border-border hover:bg-surface-lighter'
              }`}>
              {s === 'ALL' ? 'Semua' : s === 'PENDING' ? 'Menunggu' : s === 'APPROVED' ? 'Disetujui' : s === 'REJECTED' ? 'Ditolak' : 'Dibatalkan'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>
      ) : (
        <div className="space-y-6">
          {/* Pending requiring action */}
          {pending.length > 0 && filter === 'ALL' && (
            <div>
              <h3 className="flex items-center gap-2 text-sm font-semibold text-amber-400 uppercase tracking-wider mb-3">
                <AlertCircle className="w-4 h-4" /> Menunggu Persetujuan ({pending.length})
              </h3>
              <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-amber-500/10 border-b border-amber-500/20">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-amber-400/80 uppercase">Agenda</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-amber-400/80 uppercase">Unit Kerja</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-amber-400/80 uppercase">PIC</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-amber-400/80 uppercase">Ruangan</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-amber-400/80 uppercase">Waktu</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-amber-400/80 uppercase">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pending.map((event) => (
                      <tr key={event.id} className="border-b border-amber-500/10 hover:bg-amber-500/5 transition-colors">
                        <td className="px-4 py-3 text-sm font-medium text-text">{event.title}</td>
                        <td className="px-4 py-3 text-sm text-text-muted">{event.employee.department.name}</td>
                        <td className="px-4 py-3 text-sm text-text-muted">{event.employee.name}</td>
                        <td className="px-4 py-3 text-sm text-text-muted">{event.room.name}</td>
                        <td className="px-4 py-3 text-center text-sm font-mono text-text-muted">{event.startTime} - {event.endTime}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleApprove(event.id)}
                              disabled={actionLoading === event.id}
                              className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 text-xs font-medium disabled:opacity-50"
                            >
                              Setujui
                            </button>
                            <button
                              onClick={() => openRemarksModal(event.id, 'reject', event.title)}
                              disabled={actionLoading === event.id}
                              className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 text-xs font-medium disabled:opacity-50"
                            >
                              Tolak
                            </button>
                          </div>
                        </td>
                      </tr>
                ))}
              </tbody>
            </table>
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                <p className="text-sm text-text-muted">
                  Menampilkan {(page - 1) * limit + 1} - {Math.min(page * limit, total)} dari {total} agenda
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-1.5 rounded-lg border border-border text-text-muted hover:bg-surface-lighter disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                        page === p ? 'bg-primary text-white' : 'text-text-muted hover:bg-surface-lighter border border-border'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-1.5 rounded-lg border border-border text-text-muted hover:bg-surface-lighter disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

          {/* All events */}
          <div className="bg-surface-light border border-border rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <h3 className="text-sm font-semibold text-text-muted">{formattedDate} · {filter === 'ALL' ? 'Semua' : filter} ({filter === 'ALL' ? events.length : events.filter(e => e.status === filter).length})</h3>
            </div>
            <table className="w-full">
              <thead>
                <tr className="bg-surface-lighter border-b border-border">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase">Agenda</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase">Unit Kerja</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase">PIC</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase">Ruangan</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-text-muted uppercase">Waktu</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-text-muted uppercase">Status</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-text-muted uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {events.length === 0 && (
                  <tr><td colSpan={7} className="text-center px-4 py-12 text-text-muted">Tidak ada agenda</td></tr>
                )}
                {(filter === 'ALL' ? events : events.filter(e => e.status === filter)).map(event => (
                  <tr key={event.id} className="border-b border-border/50 hover:bg-surface-lighter/30 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-text">{event.title}</p>
                      {event.remarks && (
                        <p className="text-xs text-text-muted mt-0.5 flex items-center gap-1">
                          <MessageSquare className="w-3 h-3 shrink-0" />
                          {event.remarks}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-text-muted">{event.employee.department.name}</td>
                    <td className="px-4 py-3 text-sm text-text-muted">{event.employee.name}</td>
                    <td className="px-4 py-3 text-sm text-text-muted">{event.room.name}</td>
                    <td className="px-4 py-3 text-center text-sm font-mono text-text-muted">{event.startTime} - {event.endTime}</td>
                    <td className="px-4 py-3 text-center">{statusBadge(event.status)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        {event.status === 'PENDING' && (
                          <>
                            <button onClick={() => handleApprove(event.id)} disabled={actionLoading === event.id}
                              className="p-1.5 rounded-lg hover:bg-emerald-500/10 text-text-muted hover:text-emerald-400 transition-colors disabled:opacity-50">
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button onClick={() => openRemarksModal(event.id, 'reject', event.title)} disabled={actionLoading === event.id}
                              className="p-1.5 rounded-lg hover:bg-red-500/10 text-text-muted hover:text-red-400 transition-colors disabled:opacity-50">
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {event.status === 'APPROVED' && (
                          <button onClick={() => openRemarksModal(event.id, 'cancel', event.title)} disabled={actionLoading === event.id}
                            className="p-1.5 rounded-lg hover:bg-red-500/10 text-text-muted hover:text-red-400 transition-colors disabled:opacity-50"
                            title="Batalkan">
                            <Ban className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Remarks Modal */}
      {remarksModal.open && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-light border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-text">
                {remarksModal.action === 'reject' ? 'Tolak Agenda' : 'Batalkan Agenda'}
              </h2>
              <button onClick={() => setRemarksModal({ ...remarksModal, open: false })} className="p-1 hover:bg-surface-lighter rounded-lg transition-colors">
                <X className="w-5 h-5 text-text-muted" />
              </button>
            </div>

            <p className="text-sm text-text-muted mb-4">
              {remarksModal.action === 'reject' ? 'Tolak' : 'Batalkan'} agenda: <span className="font-medium text-text">{remarksModal.eventTitle}</span>
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-text-muted mb-1.5">
                Catatan / Alasan <span className="text-text-muted/60">(opsional)</span>
              </label>
              <textarea
                value={remarksModal.remarks}
                onChange={(e) => setRemarksModal({ ...remarksModal, remarks: e.target.value })}
                className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-text text-sm h-24 resize-none placeholder-text-muted/50"
                placeholder={remarksModal.action === 'reject' ? 'Contoh: Jadwal bentrok dengan rapat pimpinan' : 'Contoh: Dibatalkan atas permintaan PIC'}
                autoFocus
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setRemarksModal({ ...remarksModal, open: false })}
                className="flex-1 px-4 py-2.5 rounded-xl border border-border text-text-muted hover:bg-surface-lighter text-sm transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleRemarksSubmit}
                className={`flex-1 px-4 py-2.5 rounded-xl font-medium text-sm text-white transition-all ${
                  remarksModal.action === 'reject'
                    ? 'bg-red-500 hover:bg-red-600'
                    : 'bg-amber-500 hover:bg-amber-600'
                }`}
              >
                {remarksModal.action === 'reject' ? 'Tolak Agenda' : 'Batalkan Agenda'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
