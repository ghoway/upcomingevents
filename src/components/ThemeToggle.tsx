'use client';

import { useState, useEffect } from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';

type Theme = 'system' | 'light' | 'dark';

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('system');

  useEffect(() => {
    const stored = localStorage.getItem('theme') as Theme | null;
    if (stored) {
      setTheme(stored);
      applyTheme(stored);
    }
  }, []);

  const applyTheme = (t: Theme) => {
    const root = document.documentElement;
    root.classList.remove('dark', 'light');
    if (t === 'dark') {
      root.classList.add('dark');
    } else if (t === 'light') {
      root.classList.add('light');
    }
    // 'system' uses neither class — CSS media query takes over
  };

  const cycleTheme = () => {
    const next: Theme = theme === 'system' ? 'light' : theme === 'light' ? 'dark' : 'system';
    setTheme(next);
    applyTheme(next);
    localStorage.setItem('theme', next);
  };

  const icon = theme === 'dark' ? Moon : theme === 'light' ? Sun : Monitor;
  const label = theme === 'dark' ? 'Gelap' : theme === 'light' ? 'Terang' : 'Sistem';
  const Icon = icon;

  return (
    <button
      onClick={cycleTheme}
      className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-surface-light border border-border text-text-muted hover:text-text text-sm transition-colors"
      title={`Mode: ${label}`}
    >
      <Icon className="w-4 h-4" />
      <span className="text-xs">{label}</span>
    </button>
  );
}
