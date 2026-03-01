'use client';

import { SessionProvider } from 'next-auth/react';
import { ToastProvider } from '@/components/Toast';
import AuthenticatedShell from './AuthenticatedShell';

export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ToastProvider>
        <AuthenticatedShell>{children}</AuthenticatedShell>
      </ToastProvider>
    </SessionProvider>
  );
}
