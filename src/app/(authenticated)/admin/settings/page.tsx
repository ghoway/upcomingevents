'use client';

import { useState, useEffect } from 'react';
import { Settings, Save, CheckCircle, AlertCircle } from 'lucide-react';

export default function SettingsPage() {
  const [settings, setSettings] = useState({ telegram_bot_token: '', telegram_chat_id: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => { setSettings({ telegram_bot_token: data.telegram_bot_token || '', telegram_chat_id: data.telegram_chat_id || '' }); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError(''); setSuccess(false);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError('Gagal menyimpan pengaturan');
    } finally {
      setSaving(false);
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
        <p className="text-text-muted text-sm mt-1">Konfigurasi Telegram untuk notifikasi backup</p>
      </div>

      <div className="max-w-xl">
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
              <CheckCircle className="w-4 h-4" /> Pengaturan berhasil disimpan
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 px-3 py-2 rounded-lg text-sm mb-4">
              <AlertCircle className="w-4 h-4" /> {error}
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
      </div>
    </div>
  );
}
