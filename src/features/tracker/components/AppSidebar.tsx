import React from 'react';
import { BookOpen, GraduationCap, LogOut, Users } from 'lucide-react';
import type { MockSession } from '../types/auth';
import type { TrackerRole } from '../types/user';

interface AppSidebarProps {
  session: MockSession;
  onNavigate: (path: string) => void;
  onLogout: () => void;
}

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

const roleMeta: Record<TrackerRole, { label: string; icon: typeof GraduationCap; accent: string }> = {
  student: { label: 'Ученик', icon: GraduationCap, accent: 'from-blue-500 to-violet-500' },
  teacher: { label: 'Учитель', icon: BookOpen, accent: 'from-emerald-500 to-cyan-500' },
  parent: { label: 'Родитель', icon: Users, accent: 'from-amber-500 to-orange-500' },
};

export function AppSidebar({ session, onNavigate, onLogout }: AppSidebarProps) {
  const role = session.role ?? 'student';
  const roleInfo = roleMeta[role];
  const RoleIcon = roleInfo.icon;

  return (
    <aside className="flex h-full flex-col rounded-[30px] border border-white/70 bg-white/85 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)] backdrop-blur">
      <button onClick={() => onNavigate('/')} className="flex items-center gap-3 text-left">
        <div className="rounded-2xl bg-[linear-gradient(135deg,#2563eb,#7c3aed)] p-3 text-white shadow-lg shadow-blue-500/20">
          <GraduationCap className="h-5 w-5" />
        </div>
        <div>
          <p className="text-lg font-semibold text-slate-950">StudyBuddy</p>
          <p className="text-xs text-slate-500">dashboard workspace</p>
        </div>
      </button>

      <div className="mt-6 rounded-[28px] bg-slate-50 p-4">
        <div className="flex items-center gap-3">
          <div className={cn('rounded-2xl bg-gradient-to-r p-3 text-white shadow-lg', roleInfo.accent)}>
            <RoleIcon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-950">{session.name}</p>
            <p className="text-xs text-slate-500">{roleInfo.label}</p>
          </div>
        </div>
        <p className="mt-3 text-xs leading-6 text-slate-500">{session.email}</p>
      </div>

      <div className="mt-6 rounded-[28px] border border-slate-200 bg-white p-4">
        <p className="text-sm font-semibold text-slate-950">Роль фиксирует свой слой интерфейса</p>
        <p className="mt-2 text-xs leading-6 text-slate-500">
          Ученик видит задачи и прогресс, учитель — назначение и статусы, родитель — сигналы и результаты.
        </p>
      </div>

      <button
        onClick={onLogout}
        className="mt-auto inline-flex h-11 items-center justify-center rounded-2xl bg-slate-100 px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-200"
      >
        <LogOut className="mr-2 h-4 w-4" />
        Выйти
      </button>
    </aside>
  );
}
