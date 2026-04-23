import React from 'react';
import { BookOpen, GraduationCap, Home, Users } from 'lucide-react';
import type { TrackerRole } from '../types/user';

interface RoleSwitcherProps {
  currentRole: TrackerRole;
  onNavigate: (path: string) => void;
}

const roleButtons = [
  { id: 'student', label: 'Ученик', path: '/tracker/student', icon: GraduationCap },
  { id: 'teacher', label: 'Учитель', path: '/tracker/teacher', icon: BookOpen },
  { id: 'parent', label: 'Родитель', path: '/tracker/parent', icon: Users },
] as const;

export function RoleSwitcher({ currentRole, onNavigate }: RoleSwitcherProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-[28px] border border-white/70 bg-white/70 p-4 shadow-[0_18px_50px_rgba(15,23,42,0.06)] backdrop-blur">
      <button
        onClick={() => onNavigate('/tracker')}
        className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-100 px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-200"
      >
        <Home className="mr-2 h-4 w-4" />
        Overview
      </button>
      {roleButtons.map((button) => {
        const Icon = button.icon;
        const isActive = currentRole === button.id;

        return (
          <button
            key={button.id}
            onClick={() => onNavigate(button.path)}
            className={`inline-flex h-11 items-center justify-center rounded-2xl px-4 text-sm font-medium transition ${
              isActive ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Icon className="mr-2 h-4 w-4" />
            {button.label}
          </button>
        );
      })}
    </div>
  );
}
