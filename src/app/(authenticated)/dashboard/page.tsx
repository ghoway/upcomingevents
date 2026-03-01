'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useToast } from '@/components/Toast';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import {
  Calendar, Plus, X, Clock, Building2, MapPin,
  CheckCircle, AlertCircle, XCircle, Ban
} from 'lucide-react';

interface Event {
  id: string;
  title: string;
  description: string | null;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  room: { id: string; name: string; isMainRoom: boolean };
  employee: { id: string; name: string; department: { id: string; name: string } };
}

interface Room {
  id: string;
  name: string;
  isMainRoom: boolean;
  departmentId: string | null;
}

interface Employee {
  id: string;
  name: string;
  departmentId: string;
  department: { name: string };
}

export default function UserDashboard() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const [events, setEvents] = useState<Event[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [formData, setFormData] = useState({
    title: '', description: '', roomId: '', employeeId: '',
    date: format(new Date(), 'yyyy-MM-dd'), startTime: '09:00', endTime: '10:00',
  });
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const fetchEvents = useCallback(async () => {
    try {
      const params = new URLSearchParams({ date: selectedDate });
      if (user?.departmentId) params.set('departmentId', user.departmentId);
      const res = await fetch(`/api/events?${params}`);
      setEvents(await res.json());
    } catch (err) {
      console.error(err);
    }
  }, [selectedDate, user?.departmentId]);

  const fetchStaticData = useCallback(async () => {
    try {
      const [roomRes, empRes] = await Promise.all([
        fetch('/api/rooms'),
        fetch(`/api/employees?departmentId=${user?.departmentId || ''}`),
      ]);
      setRooms(await roomRes.json());
      setEmployees(await empRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user?.departmentId]);

  useEffect(() => { fetchStaticData(); }, [fetchStaticData]);
  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  useWebSocket((msg) => {
    if (msg.type === 'event-updated') fetchEvents();
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error || 'Gagal mengajukan agenda');
        return;
      }
      setShowForm(false);
      setFormData({ title: '', description: '', roomId: '', employeeId: '',
        date: format(new Date(), 'yyyy-MM-dd'), startTime: '09:00', endTime: '10:00' });
      // WebSocket will automatically trigger fetchEvents
    } catch (err) {
      setSubmitError('Terjadi kesalahan');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (eventId: string) => {
    if (!confirm('Yakin ingin membatalkan agenda ini?')) return;
    try {
      const res = await fetch(`/api/events/${eventId}/cancel`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        toast('error', data.error || 'Gagal membatalkan agenda');
        return;
      }
      toast('success', 'Agenda berhasil dibatalkan');
      // WebSocket will automatically trigger fetchEvents
    } catch (err) {
      toast('error', 'Terjadi kesalahan jaringan');
    }
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
        <Icon className="w-3.5 h-3.5" />
        {s.label}
      </span>
    );
  };

  const confirmedEvents = events.filter(e => e.status === 'APPROVED');
  const pendingEvents = events.filter(e => e.status === 'PENDING');
  const otherEvents = events.filter(e => e.status !== 'APPROVED' && e.status !== 'PENDING');

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text">Dashboard</h1>
          <p className="text-text-muted text-sm mt-1">
            {user?.departmentName ? `Agenda ${user.departmentName}` : 'Semua Agenda'}
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-all shadow-lg shadow-blue-500/20"
          id="propose-event"
        >
          <Plus className="w-4 h-4" />
          Ajukan Agenda
        </button>
      </div>

      {/* Date filter */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-light border border-border">
          <Calendar className="w-4 h-4 text-primary-light" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-transparent text-text text-sm border-none outline-none"
          />
        </div>
        <button
          onClick={() => setSelectedDate(format(new Date(), 'yyyy-MM-dd'))}
          className="px-3 py-2 rounded-lg bg-primary/10 text-primary-light border border-primary/20 hover:bg-primary/20 text-xs font-medium transition-colors"
        >
          Hari Ini
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-surface-light border border-border rounded-xl p-4">
              <div className="flex items-center justify-between">
                <span className="text-text-muted text-sm">Dikonfirmasi</span>
                <CheckCircle className="w-5 h-5 text-emerald-400" />
              </div>
              <p className="text-2xl font-bold text-emerald-400 mt-1">{confirmedEvents.length}</p>
            </div>
            <div className="bg-surface-light border border-border rounded-xl p-4">
              <div className="flex items-center justify-between">
                <span className="text-text-muted text-sm">Menunggu</span>
                <Clock className="w-5 h-5 text-amber-400" />
              </div>
              <p className="text-2xl font-bold text-amber-400 mt-1">{pendingEvents.length}</p>
            </div>
            <div className="bg-surface-light border border-border rounded-xl p-4">
              <div className="flex items-center justify-between">
                <span className="text-text-muted text-sm">Total</span>
                <Calendar className="w-5 h-5 text-primary-light" />
              </div>
              <p className="text-2xl font-bold text-primary-light mt-1">{events.length}</p>
            </div>
          </div>

          {/* Events table */}
          <div className="bg-surface-light border border-border rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-surface-lighter border-b border-border">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase">Agenda</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase">Ruangan</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase">PIC</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-text-muted uppercase">Waktu</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-text-muted uppercase">Status</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-text-muted uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {events.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center px-4 py-12 text-text-muted">
                      Tidak ada agenda pada tanggal ini
                    </td>
                  </tr>
                )}
                {events.map((event) => (
                  <tr key={event.id} className="border-b border-border/50 hover:bg-surface-lighter/30 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-text">{event.title}</p>
                      {event.description && <p className="text-xs text-text-muted mt-0.5">{event.description}</p>}
                    </td>
                    <td className="px-4 py-3 text-sm text-text">{event.room.name}</td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-text">{event.employee.name}</p>
                      <p className="text-xs text-text-muted">{event.employee.department.name}</p>
                    </td>
                    <td className="px-4 py-3 text-center text-sm font-mono text-text">
                      {event.startTime} - {event.endTime}
                    </td>
                    <td className="px-4 py-3 text-center">{statusBadge(event.status)}</td>
                    <td className="px-4 py-3 text-center">
                      {(event.status === 'PENDING' && event.employee.id === user?.employeeId) && (
                        <button
                          onClick={() => handleCancel(event.id)}
                          className="text-xs text-red-400 hover:text-red-300 hover:underline"
                        >
                          Batalkan
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

      {/* Propose Event Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-light border border-border rounded-2xl p-6 w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-text">Ajukan Agenda Baru</h2>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-surface-lighter rounded-lg transition-colors">
                <X className="w-5 h-5 text-text-muted" />
              </button>
            </div>

            {submitError && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 px-3 py-2 rounded-lg text-sm mb-4">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {submitError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1">Judul Agenda *</label>
                <input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-text text-sm"
                  placeholder="Contoh: Rapat Koordinasi"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1">Deskripsi</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-text text-sm h-20 resize-none"
                  placeholder="Detail agenda (opsional)"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1">Ruangan *</label>
                  <select
                    value={formData.roomId}
                    onChange={(e) => setFormData({ ...formData, roomId: e.target.value })}
                    className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-text text-sm"
                    required
                  >
                    <option value="">Pilih ruangan</option>
                    {rooms.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} {r.isMainRoom ? '(Utama)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1">PIC *</label>
                  <select
                    value={formData.employeeId}
                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                    className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-text text-sm"
                    required
                  >
                    <option value="">Pilih PIC</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>{emp.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1">Tanggal *</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-text text-sm"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1">Mulai *</label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-text text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1">Selesai *</label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-text text-sm"
                    required
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-border text-text-muted hover:bg-surface-lighter text-sm transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-4 py-2.5 rounded-xl font-medium text-sm disabled:opacity-50 transition-all"
                >
                  {submitting ? 'Memproses...' : 'Ajukan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
