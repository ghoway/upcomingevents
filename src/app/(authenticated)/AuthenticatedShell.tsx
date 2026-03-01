'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard, Building2, Users, UserCog, DoorOpen,
  CalendarCheck, Settings, Database, LogOut, Menu, X,
  ChevronRight, Monitor, Shield
} from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';

export default function AuthenticatedShell({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const user = session?.user as any;
  const isAdmin = user?.role === 'ADMIN';

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) return null;

  const adminLinks = [
    { href: '/admin/events', label: 'Manajemen Agenda', icon: CalendarCheck },
    { href: '/admin/departments', label: 'Unit Kerja', icon: Building2 },
    { href: '/admin/employees', label: 'Pegawai', icon: Users },
    { href: '/admin/users', label: 'Pengguna', icon: UserCog },
    { href: '/admin/rooms', label: 'Ruangan', icon: DoorOpen },
    { href: '/admin/settings', label: 'Pengaturan', icon: Settings },
    { href: '/admin/backup', label: 'Backup Database', icon: Database },
  ];

  const userLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  ];

  const navLinks = isAdmin ? [...userLinks, ...adminLinks] : userLinks;

  return (
    <div className="min-h-screen bg-surface flex">
      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 h-screen bg-surface-light border-r border-border transition-all duration-300 flex flex-col ${
          sidebarOpen ? 'w-64' : 'w-0 overflow-hidden'
        }`}
      >
        {/* Brand */}
        <div className="px-5 py-4 border-b border-border flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shrink-0">
            <Monitor className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-text truncate">Dasbor Rapat</h2>
            <div className="flex items-center gap-1">
              <Shield className="w-3 h-3 text-primary-light" />
              <span className="text-xs text-text-muted">{isAdmin ? 'Admin' : 'User'}</span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                  isActive
                    ? 'bg-primary/10 text-primary-light border border-primary/20'
                    : 'text-text-muted hover:text-text hover:bg-surface-lighter'
                }`}
              >
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-primary-light' : 'text-text-muted group-hover:text-text'}`} />
                <span className="truncate">{link.label}</span>
                {isActive && <ChevronRight className="w-4 h-4 ml-auto text-primary-light" />}
              </Link>
            );
          })}
        </nav>

        {/* User info & logout */}
        <div className="p-3 border-t border-border space-y-2">
          <div className="px-3 py-2">
            <p className="text-sm font-medium text-text truncate">{user?.name}</p>
            <p className="text-xs text-text-muted truncate">{user?.departmentName || 'Administrator'}</p>
          </div>
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-text-muted hover:text-text hover:bg-surface-lighter transition-colors"
          >
            <Monitor className="w-4 h-4" />
            <span>Tampilan TV</span>
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-red-400 hover:bg-red-500/10 w-full transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
        {/* Top bar */}
        <div className="sticky top-0 z-30 bg-surface/80 backdrop-blur-xl border-b border-border px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-surface-light border border-border transition-colors"
            id="sidebar-toggle"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex-1" />
          <ThemeToggle />
        </div>

        {/* Page content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
