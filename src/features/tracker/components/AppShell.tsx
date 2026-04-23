import React from 'react';
import { AppSidebar } from './AppSidebar';
import type { MockSession } from '../types/auth';
import type { TrackerRole } from '../types/user';

interface AppShellProps {
  session: MockSession;
  currentPath: string;
  role: TrackerRole;
  title: string;
  subtitle: string;
  onNavigate: (path: string) => void;
  onLogout: () => void;
  onRoleChange: (role: TrackerRole) => void;
  children: React.ReactNode;
}

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

const roleBadgeTone: Record<TrackerRole, string> = {
  student: 'bg-blue-100 text-blue-700',
  teacher: 'bg-emerald-100 text-emerald-700',
  parent: 'bg-amber-100 text-amber-700',
};

export function AppShell({ session, currentPath, role, title, subtitle, onNavigate, onLogout, onRoleChange, children }: AppShellProps) {
  return (
    <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
      <AppSidebar session={session} currentPath={currentPath} onNavigate={onNavigate} onLogout={onLogout} onRoleChange={onRoleChange} />

      <div className="min-w-0">
        <header className="mb-6 rounded-[30px] border border-white/70 bg-white/85 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)] backdrop-blur md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm text-slate-500">StudyBuddy workspace</p>
              <h1 className="mt-2 text-2xl font-semibold text-slate-950 md:text-3xl">{title}</h1>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">{subtitle}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className={cn('rounded-full px-3 py-1 text-sm font-semibold', roleBadgeTone[role])}>
                {role === 'student' ? 'Ученик' : role === 'teacher' ? 'Учитель' : 'Родитель'}
              </span>
              <div className="rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-700">{session.name}</div>
            </div>
          </div>
        </header>

        {children}
      </div>
    </div>
  );
}
