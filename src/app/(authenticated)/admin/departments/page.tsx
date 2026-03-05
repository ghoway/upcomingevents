'use client';

import { useState, useEffect, useCallback } from 'react';
import { Building2, Plus, Edit, Trash2, X, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useWebSocket } from '@/hooks/useWebSocket';

interface Department {
  id: string;
  name: string;
  rooms: { id: string; name: string }[];
  _count: { employees: number };
}

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  const fetchDepartments = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/departments?page=${page}&limit=${limit}`);
    const data = await res.json();
    setDepartments(data.data);
    setTotal(data.total);
    setLoading(false);
  }, [page]);

  useEffect(() => { fetchDepartments(); }, [fetchDepartments]);

  useWebSocket(useCallback((msg: { type: string }) => {
    if (msg.type === 'department-updated') fetchDepartments();
  }, [fetchDepartments]));

  const totalPages = Math.ceil(total / limit);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const url = editId ? `/api/departments/${editId}` : '/api/departments';
    const method = editId ? 'PUT' : 'POST';
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) });
    if (!res.ok) { setError((await res.json()).error); return; }
    setShowModal(false); setEditId(null); setName('');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus unit kerja ini?')) return;
    await fetch(`/api/departments/${id}`, { method: 'DELETE' });
  };

  const openEdit = (dept: Department) => {
    setEditId(dept.id); setName(dept.name); setShowModal(true); setError('');
  };

  const openCreate = () => {
    setEditId(null); setName(''); setShowModal(true); setError('');
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text">Unit Kerja</h1>
          <p className="text-text-muted text-sm mt-1">Kelola daftar unit kerja / departemen</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-all shadow-lg shadow-blue-500/20">
          <Plus className="w-4 h-4" /> Tambah
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-surface-light border border-border rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-surface-lighter border-b border-border">
                <th className="text-left px-5 py-3 text-xs font-semibold text-text-muted uppercase">Nama</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-text-muted uppercase">Ruangan</th>
                <th className="text-center px-5 py-3 text-xs font-semibold text-text-muted uppercase">Pegawai</th>
                <th className="text-center px-5 py-3 text-xs font-semibold text-text-muted uppercase w-28">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {departments.length === 0 && (
                <tr><td colSpan={4} className="text-center px-4 py-12 text-text-muted">Belum ada data</td></tr>
              )}
              {departments.map((dept) => (
                <tr key={dept.id} className="border-b border-border/50 hover:bg-surface-lighter/30 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                        <Building2 className="w-4 h-4 text-blue-400" />
                      </div>
                      <span className="text-sm font-medium text-text">{dept.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-sm text-text-muted">{dept.rooms.map(r => r.name).join(', ') || '-'}</td>
                  <td className="px-5 py-3 text-sm text-center text-text-muted">{dept._count.employees}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => openEdit(dept)} className="p-1.5 rounded-lg hover:bg-surface-lighter text-text-muted hover:text-text transition-colors"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(dept.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-text-muted hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <p className="text-sm text-text-muted">
                Menampilkan {(page - 1) * limit + 1} - {Math.min(page * limit, total)} dari {total} data
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
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-light border border-border rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-text">{editId ? 'Edit' : 'Tambah'} Unit Kerja</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-surface-lighter rounded-lg"><X className="w-5 h-5 text-text-muted" /></button>
            </div>
            {error && <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 px-3 py-2 rounded-lg text-sm mb-4"><AlertCircle className="w-4 h-4" />{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-text-muted mb-1">Nama Unit Kerja</label>
                <input value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-text text-sm" placeholder="Contoh: Deputi 1" required />
              </div>
              {!editId && <p className="text-xs text-text-muted bg-surface/50 px-3 py-2 rounded-lg">ℹ️ Ruangan otomatis akan dibuat untuk unit kerja baru</p>}
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
