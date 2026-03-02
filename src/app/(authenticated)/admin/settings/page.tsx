'use client';

import { useState, useEffect } from 'react';
import { Settings, Save, CheckCircle, AlertCircle, Send, Database, HardDrive } from 'lucide-react';

export default function SettingsPage() {
  const [settings, setSettings] = useState({ telegram_bot_token: '', telegram_chat_id: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Backup state
  const [sending, setSending] = useState(false);
  const [backupResult, setBackupResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => { setSettings({ telegram_bot_token: data.telegram_bot_token || '', telegram_chat_id: data.telegram_chat_id || '' }); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError(''); setSuccess('');
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error();
      setSuccess('Pengaturan berhasil disimpan');
      setTimeout(() => setSuccess(''), 3000);
    } catch {
      setError('Gagal menyimpan pengaturan');
    } finally {
      setSaving(false);
    }
  };

  const handleBackup = async () => {
    setSending(true); setBackupResult(null);
    try {
      const res = await fetch('/api/backup', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setBackupResult({ type: 'error', message: data.error || 'Gagal mengirim backup' });
      } else {
        setBackupResult({ type: 'success', message: data.message || 'Backup berhasil dikirim ke Telegram' });
      }
    } catch {
      setBackupResult({ type: 'error', message: 'Terjadi kesalahan jaringan' });
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text">Pengaturan</h1>
        <p className="text-text-muted text-sm mt-1">Konfigurasi Telegram dan backup database</p>
      </div>

      <div className="max-w-xl space-y-6">
        {/* Telegram Settings */}
        <div className="bg-surface-light border border-border rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Settings className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-text">Telegram Bot</h2>
              <p className="text-xs text-text-muted">Digunakan untuk mengirim backup database</p>
            </div>
          </div>

          {success && (
            <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-2 rounded-lg text-sm mb-4">
              <CheckCircle className="w-4 h-4 shrink-0" /> {success}
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 px-3 py-2 rounded-lg text-sm mb-4">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">Bot Token</label>
              <input
                value={settings.telegram_bot_token}
                onChange={(e) => setSettings({ ...settings, telegram_bot_token: e.target.value })}
                className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-text text-sm font-mono"
                placeholder="123456:ABC-DEF1234..."
              />
              <p className="text-xs text-text-muted mt-1">Dapatkan dari @BotFather di Telegram</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">Chat ID</label>
              <input
                value={settings.telegram_chat_id}
                onChange={(e) => setSettings({ ...settings, telegram_chat_id: e.target.value })}
                className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-text text-sm font-mono"
                placeholder="-1001234567890"
              />
              <p className="text-xs text-text-muted mt-1">ID chat/grup untuk menerima backup</p>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-5 py-2.5 rounded-xl font-medium text-sm disabled:opacity-50 transition-all"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </form>
        </div>

        {/* Backup Database */}
        <div className="bg-surface-light border border-border rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-600/20 flex items-center justify-center">
              <HardDrive className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-text">Backup Database</h2>
              <p className="text-xs text-text-muted">Kirim file database SQLite ke Telegram</p>
            </div>
          </div>

          <div className="bg-surface/50 border border-border rounded-xl p-4 mb-4">
            <div className="flex items-center gap-3">
              <Database className="w-5 h-5 text-text-muted" />
              <div>
                <p className="text-sm text-text font-medium">prisma/dev.db</p>
                <p className="text-xs text-text-muted">SQLite Database</p>
              </div>
            </div>
          </div>

          {backupResult && (
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm mb-4 ${
              backupResult.type === 'success'
                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                : 'bg-red-500/10 border border-red-500/20 text-red-400'
            }`}>
              {backupResult.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              {backupResult.message}
            </div>
          )}

          <button
            onClick={handleBackup}
            disabled={sending}
            className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-5 py-2.5 rounded-xl font-medium text-sm disabled:opacity-50 transition-all w-full justify-center"
          >
            <Send className="w-4 h-4" />
            {sending ? 'Mengirim backup...' : 'Kirim Backup ke Telegram'}
          </button>

          <p className="text-xs text-text-muted mt-3 text-center">
            Pastikan Bot Token dan Chat ID sudah dikonfigurasi di atas
          </p>
        </div>
      </div>
    </div>
  );
}
