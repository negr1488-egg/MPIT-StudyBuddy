import React from 'react';
import { AppSidebar } from './AppSidebar';
import type { MockSession } from '../types/auth';

interface AppShellProps {
  session: MockSession;
  children: React.ReactNode;
  onNavigate: (path: string) => void;
  onLogout: () => void;
}

export function AppShell({ session, children, onNavigate, onLogout }: AppShellProps) {
  return (
    <div className="flex min-h-screen bg-slate-100 p-4">
      <div className="flex w-full gap-4">
        
        {/* Sidebar */}
        <div className="w-[280px]">
          <AppSidebar
            session={session}
            onNavigate={onNavigate}
            onLogout={onLogout}
          />
        </div>

        {/* Main Content */}
        <main className="flex-1 rounded-[30px] bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
          {children}
        </main>

      </div>
    </div>
  );
}
