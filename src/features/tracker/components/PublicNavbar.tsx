import React from 'react';
import { BookMarked, LogIn, Sparkles } from 'lucide-react';

interface PublicNavbarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export function PublicNavbar({ currentPath, onNavigate }: PublicNavbarProps) {
  return (
    <header className="sticky top-0 z-30 mb-6 rounded-[28px] border border-white/70 bg-white/80 px-5 py-4 shadow-[0_18px_50px_rgba(15,23,42,0.06)] backdrop-blur md:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button onClick={() => onNavigate('/')} className="inline-flex items-center gap-3 text-left">
          <div className="rounded-2xl bg-[linear-gradient(135deg,#2563eb,#7c3aed)] p-3 text-white shadow-lg shadow-blue-500/20">
            <BookMarked className="h-5 w-5" />
          </div>
          <div>
            <p className="text-lg font-semibold text-slate-950">StudyBuddy</p>
            <p className="text-xs text-slate-500">school tasks made clearer</p>
          </div>
        </button>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => onNavigate('/')}
            className={cn(
              'rounded-full px-4 py-2 text-sm font-medium transition',
              currentPath === '/' ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200',
            )}
          >
            О сервисе
          </button>
          <button
            onClick={() => onNavigate('/register')}
            className={cn(
              'inline-flex items-center rounded-full px-4 py-2 text-sm font-medium transition',
              currentPath === '/register' ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200',
            )}
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Начать
          </button>
          <button
            onClick={() => onNavigate('/login')}
            className={cn(
              'inline-flex items-center rounded-full px-4 py-2 text-sm font-medium transition',
              currentPath === '/login' ? 'bg-slate-950 text-white' : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50',
            )}
          >
            <LogIn className="mr-2 h-4 w-4" />
            Войти
          </button>
        </div>
      </div>
    </header>
  );
}
