'use client';

import { useState, useEffect, useCallback } from 'react';
import { Users, Plus, Edit, Trash2, X, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useWebSocket } from '@/hooks/useWebSocket';

interface Department { id: string; name: string; }
interface Employee {
  id: string; name: string; nip: string | null;
  department: Department;
  user: { id: string; username: string; role: string } | null;
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', nip: '', departmentId: '' });
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [empRes, deptRes] = await Promise.all([
      fetch(`/api/employees?page=${page}&limit=${limit}`), fetch('/api/departments?page=1&limit=1000')
    ]);
    const empData = await empRes.json();
    const deptData = await deptRes.json();
    setEmployees(empData.data);
    setTotal(empData.total);
    setDepartments(deptData.data);
    setLoading(false);
  }, [page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useWebSocket(useCallback((msg: { type: string }) => {
    if (msg.type === 'employee-updated' || msg.type === 'department-updated') fetchData();
  }, [fetchData]));

  const totalPages = Math.ceil(total / limit);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    const url = editId ? `/api/employees/${editId}` : '/api/employees';
    const method = editId ? 'PUT' : 'POST';
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    if (!res.ok) { setError((await res.json()).error); return; }
    setShowModal(false); setEditId(null); setForm({ name: '', nip: '', departmentId: '' });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus pegawai ini?')) return;
    await fetch(`/api/employees/${id}`, { method: 'DELETE' });
  };

  const openEdit = (emp: Employee) => {
    setEditId(emp.id); setForm({ name: emp.name, nip: emp.nip || '', departmentId: emp.department.id }); setShowModal(true); setError('');
  };

  const openCreate = () => {
    setEditId(null); setForm({ name: '', nip: '', departmentId: '' }); setShowModal(true); setError('');
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text">Pegawai</h1>
          <p className="text-text-muted text-sm mt-1">Kelola daftar pegawai</p>
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
                <th className="text-left px-5 py-3 text-xs font-semibold text-text-muted uppercase">Nama</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-text-muted uppercase">NIP</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-text-muted uppercase">Unit Kerja</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-text-muted uppercase">Akun</th>
                <th className="text-center px-5 py-3 text-xs font-semibold text-text-muted uppercase w-28">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {employees.length === 0 && (
                <tr><td colSpan={5} className="text-center px-4 py-12 text-text-muted">Belum ada data</td></tr>
              )}
              {employees.map((emp) => (
                <tr key={emp.id} className="border-b border-border/50 hover:bg-surface-lighter/30 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                        <Users className="w-4 h-4 text-purple-400" />
                      </div>
                      <span className="text-sm font-medium text-text">{emp.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-sm text-text-muted">{emp.nip || '-'}</td>
                  <td className="px-5 py-3 text-sm text-text-muted">{emp.department.name}</td>
                  <td className="px-5 py-3 text-sm text-text-muted">{emp.user?.username || '-'}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => openEdit(emp)} className="p-1.5 rounded-lg hover:bg-surface-lighter text-text-muted hover:text-text transition-colors"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(emp.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-text-muted hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
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
              <h2 className="text-lg font-bold text-text">{editId ? 'Edit' : 'Tambah'} Pegawai</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-surface-lighter rounded-lg"><X className="w-5 h-5 text-text-muted" /></button>
            </div>
            {error && <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 px-3 py-2 rounded-lg text-sm mb-4"><AlertCircle className="w-4 h-4" />{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-text-muted mb-1">Nama</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-text text-sm" required />
              </div>
              <div>
                <label className="block text-sm text-text-muted mb-1">NIP</label>
                <input value={form.nip} onChange={(e) => setForm({ ...form, nip: e.target.value })} className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-text text-sm" />
              </div>
              <div>
                <label className="block text-sm text-text-muted mb-1">Unit Kerja</label>
                <select value={form.departmentId} onChange={(e) => setForm({ ...form, departmentId: e.target.value })} className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-text text-sm" required>
                  <option value="">Pilih unit kerja</option>
                  {departments.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
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
