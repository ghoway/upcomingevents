'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/Toast';
import { UserCog, Plus, Edit, Trash2, X, AlertCircle, Shield, KeyRound } from 'lucide-react';
import { useWebSocket } from '@/hooks/useWebSocket';

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
  const { toast } = useToast();

  // Reset password modal state
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetUser, setResetUser] = useState<User | null>(null);
  const [resetPassword, setResetPassword] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetting, setResetting] = useState(false);

  const fetchData = useCallback(async () => {
    const [userRes, empRes] = await Promise.all([fetch('/api/users'), fetch('/api/employees')]);
    setUsers(await userRes.json());
    setEmployees(await empRes.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useWebSocket(useCallback((msg: { type: string }) => {
    if (msg.type === 'user-updated' || msg.type === 'employee-updated') fetchData();
  }, [fetchData]));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    const url = editId ? `/api/users/${editId}` : '/api/users';
    const method = editId ? 'PUT' : 'POST';
    const body = editId && !form.password ? { ...form, password: undefined } : form;
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!res.ok) { setError((await res.json()).error); return; }
    setShowModal(false); setEditId(null); setForm({ username: '', password: '', role: 'USER', employeeId: '' });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus pengguna ini?')) return;
    await fetch(`/api/users/${id}`, { method: 'DELETE' });
  };

  const openEdit = (u: User) => {
    setEditId(u.id); setForm({ username: u.username, password: '', role: u.role, employeeId: u.employeeId || '' }); setShowModal(true); setError('');
  };

  const openCreate = () => {
    setEditId(null); setForm({ username: '', password: '', role: 'USER', employeeId: '' }); setShowModal(true); setError('');
  };

  const openResetPassword = (u: User) => {
    setResetUser(u); setResetPassword(''); setResetError(''); setShowResetModal(true);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault(); setResetError('');
    if (!resetUser) return;
    if (resetPassword.length < 6) { setResetError('Password minimal 6 karakter'); return; }

    setResetting(true);
    try {
      const res = await fetch('/api/users/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: resetUser.id, newPassword: resetPassword }),
      });
      const data = await res.json();
      if (!res.ok) { setResetError(data.error || 'Gagal mereset password'); return; }
      toast('success', `Password ${resetUser.username} berhasil direset`);
      setShowResetModal(false); setResetUser(null); setResetPassword('');
    } catch {
      setResetError('Terjadi kesalahan jaringan');
    } finally {
      setResetting(false);
    }
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
                <th className="text-center px-5 py-3 text-xs font-semibold text-text-muted uppercase w-36">Aksi</th>
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
                      <button onClick={() => openResetPassword(u)} title="Reset Password" className="p-1.5 rounded-lg hover:bg-amber-500/10 text-text-muted hover:text-amber-400 transition-colors"><KeyRound className="w-4 h-4" /></button>
                      <button onClick={() => openEdit(u)} title="Edit" className="p-1.5 rounded-lg hover:bg-surface-lighter text-text-muted hover:text-text transition-colors"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(u.id)} title="Hapus" className="p-1.5 rounded-lg hover:bg-red-500/10 text-text-muted hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit User Modal */}
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

      {/* Reset Password Modal */}
      {showResetModal && resetUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-light border border-border rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-text">Reset Password</h2>
              <button onClick={() => setShowResetModal(false)} className="p-1 hover:bg-surface-lighter rounded-lg"><X className="w-5 h-5 text-text-muted" /></button>
            </div>

            <div className="flex items-center gap-3 bg-surface/50 border border-border rounded-xl p-3 mb-4">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${resetUser.role === 'ADMIN' ? 'bg-amber-500/10' : 'bg-blue-500/10'}`}>
                <UserCog className={`w-4 h-4 ${resetUser.role === 'ADMIN' ? 'text-amber-400' : 'text-blue-400'}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-text">{resetUser.username}</p>
                <p className="text-xs text-text-muted">{resetUser.employee?.name || 'Tidak terkait pegawai'}</p>
              </div>
            </div>

            {resetError && <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 px-3 py-2 rounded-lg text-sm mb-4"><AlertCircle className="w-4 h-4" />{resetError}</div>}

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-sm text-text-muted mb-1">Password Baru</label>
                <input
                  type="password"
                  value={resetPassword}
                  onChange={(e) => setResetPassword(e.target.value)}
                  className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-text text-sm"
                  required
                  minLength={6}
                  placeholder="Minimal 6 karakter"
                />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowResetModal(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-border text-text-muted text-sm">Batal</button>
                <button type="submit" disabled={resetting} className="flex-1 bg-gradient-to-r from-amber-500 to-orange-600 text-white px-4 py-2.5 rounded-xl font-medium text-sm disabled:opacity-50">
                  {resetting ? 'Mereset...' : 'Reset Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
