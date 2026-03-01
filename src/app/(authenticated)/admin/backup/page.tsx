'use client';

import { useState } from 'react';
import { Database, Send, CheckCircle, AlertCircle, HardDrive } from 'lucide-react';

export default function BackupPage() {
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleBackup = async () => {
    setSending(true); setResult(null);
    try {
      const res = await fetch('/api/backup', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setResult({ type: 'error', message: data.error || 'Gagal mengirim backup' });
      } else {
        setResult({ type: 'success', message: data.message || 'Backup berhasil dikirim ke Telegram' });
      }
    } catch {
      setResult({ type: 'error', message: 'Terjadi kesalahan jaringan' });
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text">Backup Database</h1>
        <p className="text-text-muted text-sm mt-1">Kirim backup database ke Telegram</p>
      </div>

      <div className="max-w-xl">
        <div className="bg-surface-light border border-border rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-600/20 flex items-center justify-center">
              <HardDrive className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-text">Backup & Restore</h2>
              <p className="text-xs text-text-muted">File database SQLite akan dikirim ke Telegram</p>
            </div>
          </div>

          <div className="bg-surface/50 border border-border rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3">
              <Database className="w-5 h-5 text-text-muted" />
              <div>
                <p className="text-sm text-text font-medium">prisma/dev.db</p>
                <p className="text-xs text-text-muted">SQLite Database</p>
              </div>
            </div>
          </div>

          {result && (
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm mb-4 ${
              result.type === 'success'
                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                : 'bg-red-500/10 border border-red-500/20 text-red-400'
            }`}>
              {result.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              {result.message}
            </div>
          )}

          <button
            onClick={handleBackup}
            disabled={sending}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-5 py-2.5 rounded-xl font-medium text-sm disabled:opacity-50 transition-all shadow-lg shadow-blue-500/20 w-full justify-center"
          >
            <Send className="w-4 h-4" />
            {sending ? 'Mengirim backup...' : 'Kirim Backup ke Telegram'}
          </button>

          <p className="text-xs text-text-muted mt-3 text-center">
            Pastikan Telegram Bot Token dan Chat ID sudah dikonfigurasi di Pengaturan
          </p>
        </div>
      </div>
    </div>
  );
}
