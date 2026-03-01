'use client';

import { useState, useEffect } from 'react';
import { UserCog, Plus, Edit, Trash2, X, AlertCircle, Shield } from 'lucide-react';

interface Employee { id: string; name: string; department: { name: string } | null; }
interface User {
  id: string; username: string; role: string; employeeId: string | null;
  employee: { name: string; department: { name: string; id: string } } | null;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ username: '', password: '', role: 'USER', employeeId: '' });
  const [error, setError] = useState('');

  const fetchData = async () => {
    const [userRes, empRes] = await Promise.all([fetch('/api/users'), fetch('/api/employees')]);
    setUsers(await userRes.json());
    setEmployees(await empRes.json());
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    const url = editId ? `/api/users/${editId}` : '/api/users';
    const method = editId ? 'PUT' : 'POST';
    const body = editId && !form.password ? { ...form, password: undefined } : form;
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!res.ok) { setError((await res.json()).error); return; }
    setShowModal(false); setEditId(null); setForm({ username: '', password: '', role: 'USER', employeeId: '' }); fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus pengguna ini?')) return;
    await fetch(`/api/users/${id}`, { method: 'DELETE' }); fetchData();
  };

  const openEdit = (u: User) => {
    setEditId(u.id); setForm({ username: u.username, password: '', role: u.role, employeeId: u.employeeId || '' }); setShowModal(true); setError('');
  };

  const openCreate = () => {
    setEditId(null); setForm({ username: '', password: '', role: 'USER', employeeId: '' }); setShowModal(true); setError('');
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text">Pengguna</h1>
          <p className="text-text-muted text-sm mt-1">Kelola akun pengguna sistem</p>
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
                <th className="text-left px-5 py-3 text-xs font-semibold text-text-muted uppercase">Username</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-text-muted uppercase">Pegawai</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-text-muted uppercase">Unit Kerja</th>
                <th className="text-center px-5 py-3 text-xs font-semibold text-text-muted uppercase">Role</th>
                <th className="text-center px-5 py-3 text-xs font-semibold text-text-muted uppercase w-28">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 && (
                <tr><td colSpan={5} className="text-center px-4 py-12 text-text-muted">Belum ada data</td></tr>
              )}
              {users.map((u) => (
                <tr key={u.id} className="border-b border-border/50 hover:bg-surface-lighter/30 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${u.role === 'ADMIN' ? 'bg-amber-500/10' : 'bg-blue-500/10'}`}>
                        <UserCog className={`w-4 h-4 ${u.role === 'ADMIN' ? 'text-amber-400' : 'text-blue-400'}`} />
                      </div>
                      <span className="text-sm font-medium text-text">{u.username}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-sm text-text-muted">{u.employee?.name || '-'}</td>
                  <td className="px-5 py-3 text-sm text-text-muted">{u.employee?.department?.name || '-'}</td>
                  <td className="px-5 py-3 text-center">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${u.role === 'ADMIN' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}>
                      <Shield className="w-3 h-3" /> {u.role}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => openEdit(u)} className="p-1.5 rounded-lg hover:bg-surface-lighter text-text-muted hover:text-text transition-colors"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(u.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-text-muted hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
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
              <h2 className="text-lg font-bold text-text">{editId ? 'Edit' : 'Tambah'} Pengguna</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-surface-lighter rounded-lg"><X className="w-5 h-5 text-text-muted" /></button>
            </div>
            {error && <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 px-3 py-2 rounded-lg text-sm mb-4"><AlertCircle className="w-4 h-4" />{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-text-muted mb-1">Username</label>
                <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-text text-sm" required />
              </div>
              <div>
                <label className="block text-sm text-text-muted mb-1">Password {editId && '(kosongkan jika tidak diubah)'}</label>
                <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-text text-sm" {...(!editId ? { required: true } : {})} />
              </div>
              <div>
                <label className="block text-sm text-text-muted mb-1">Role</label>
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-text text-sm">
                  <option value="USER">User</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-text-muted mb-1">Pegawai (opsional)</label>
                <select value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-text text-sm">
                  <option value="">- Tidak dikaitkan -</option>
                  {employees.map((emp: any) => <option key={emp.id} value={emp.id}>{emp.name} ({emp.department?.name})</option>)}
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
