'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/Toast';
import { DoorOpen, Plus, Edit, Trash2, X, AlertCircle, Star } from 'lucide-react';
import { useWebSocket } from '@/hooks/useWebSocket';

interface Room {
  id: string; name: string; isMainRoom: boolean;
  departmentId: string | null; department: { id: string; name: string } | null;
}
interface Department { id: string; name: string; }

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', departmentId: '', isMainRoom: false });
  const [error, setError] = useState('');
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    const [rRes, dRes] = await Promise.all([fetch('/api/rooms'), fetch('/api/departments')]);
    setRooms(await rRes.json());
    setDepartments(await dRes.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useWebSocket(useCallback((msg: { type: string }) => {
    if (msg.type === 'room-updated' || msg.type === 'department-updated') fetchData();
  }, [fetchData]));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    const url = editId ? `/api/rooms/${editId}` : '/api/rooms';
    const method = editId ? 'PUT' : 'POST';
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    if (!res.ok) { setError((await res.json()).error); return; }
    setShowModal(false); setEditId(null); setForm({ name: '', departmentId: '', isMainRoom: false });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus ruangan ini?')) return;
    const res = await fetch(`/api/rooms/${id}`, { method: 'DELETE' });
    if (!res.ok) { toast('error', (await res.json()).error); return; }
    toast('success', 'Ruangan berhasil dihapus');
  };

  const openEdit = (room: Room) => {
    setEditId(room.id); setForm({ name: room.name, departmentId: room.departmentId || '', isMainRoom: room.isMainRoom }); setShowModal(true); setError('');
  };

  const openCreate = () => {
    setEditId(null); setForm({ name: '', departmentId: '', isMainRoom: false }); setShowModal(true); setError('');
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text">Ruangan</h1>
          <p className="text-text-muted text-sm mt-1">Kelola daftar ruang rapat</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-all shadow-lg shadow-blue-500/20">
          <Plus className="w-4 h-4" /> Tambah
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>
      ) : (
        <div className="bg-surface-light border border-border rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-surface-lighter border-b border-border">
                <th className="text-left px-5 py-3 text-xs font-semibold text-text-muted uppercase">Nama Ruangan</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-text-muted uppercase">Unit Kerja</th>
                <th className="text-center px-5 py-3 text-xs font-semibold text-text-muted uppercase">Tipe</th>
                <th className="text-center px-5 py-3 text-xs font-semibold text-text-muted uppercase w-28">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {rooms.length === 0 && (
                <tr><td colSpan={4} className="text-center px-4 py-12 text-text-muted">Belum ada data</td></tr>
              )}
              {rooms.map((room) => (
                <tr key={room.id} className="border-b border-border/50 hover:bg-surface-lighter/30 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${room.isMainRoom ? 'bg-amber-500/10' : 'bg-teal-500/10'}`}>
                        {room.isMainRoom ? <Star className="w-4 h-4 text-amber-400" /> : <DoorOpen className="w-4 h-4 text-teal-400" />}
                      </div>
                      <span className="text-sm font-medium text-text">{room.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-sm text-text-muted">{room.department?.name || '-'}</td>
                  <td className="px-5 py-3 text-center">
                    {room.isMainRoom ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        <Star className="w-3 h-3" /> Utama
                      </span>
                    ) : (
                      <span className="text-xs text-text-muted">Departemen</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => openEdit(room)} className="p-1.5 rounded-lg hover:bg-surface-lighter text-text-muted hover:text-text transition-colors"><Edit className="w-4 h-4" /></button>
                      {!room.isMainRoom && (
                        <button onClick={() => handleDelete(room.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-text-muted hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-light border border-border rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-text">{editId ? 'Edit' : 'Tambah'} Ruangan</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-surface-lighter rounded-lg"><X className="w-5 h-5 text-text-muted" /></button>
            </div>
            {error && <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 px-3 py-2 rounded-lg text-sm mb-4"><AlertCircle className="w-4 h-4" />{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-text-muted mb-1">Nama Ruangan</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-text text-sm" required />
              </div>
              <div>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox" checked={form.isMainRoom} onChange={(e) => setForm({ ...form, isMainRoom: e.target.checked, departmentId: e.target.checked ? '' : form.departmentId })} className="w-4 h-4 rounded border-border accent-amber-500" />
                  <span className="text-sm text-text-muted">Ruang Utama</span>
                </label>
              </div>
              {!form.isMainRoom && (
                <div>
                  <label className="block text-sm text-text-muted mb-1">Unit Kerja (opsional)</label>
                  <select value={form.departmentId} onChange={(e) => setForm({ ...form, departmentId: e.target.value })} className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-text text-sm">
                    <option value="">- Tidak ke unit kerja -</option>
                    {departments.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
              )}
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-border text-text-muted text-sm">Batal</button>
                <button type="submit" className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2.5 rounded-xl font-medium text-sm">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
