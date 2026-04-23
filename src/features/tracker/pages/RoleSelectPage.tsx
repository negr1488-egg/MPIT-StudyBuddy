import React from 'react';
import { ArrowRight, BookOpen, GraduationCap, Users } from 'lucide-react';
import type { UseMockSessionResult } from '../hooks/useMockSession';
import type { TrackerRole } from '../types/user';

interface RoleSelectPageProps {
  auth: UseMockSessionResult;
  onNavigate: (path: string) => void;
}

const roleCards: Array<{
  id: TrackerRole;
  title: string;
  text: string;
  icon: typeof GraduationCap;
  tone: string;
}> = [
  {
    id: 'student',
    title: 'Ученик',
    text: 'Задачи на сегодня, ближайшие дедлайны, просрочки и личный прогресс.',
    icon: GraduationCap,
    tone: 'from-blue-500 to-violet-500',
  },
  {
    id: 'teacher',
    title: 'Учитель',
    text: 'Созданные задания, статусы по ученикам и компактный контроль в одном месте.',
    icon: BookOpen,
    tone: 'from-emerald-500 to-cyan-500',
  },
  {
    id: 'parent',
    title: 'Родитель',
    text: 'Прогресс ребенка, сигналы по просрочкам и видимость важных задач без хаоса.',
    icon: Users,
    tone: 'from-amber-500 to-orange-500',
  },
];

export function RoleSelectPage({ auth, onNavigate }: RoleSelectPageProps) {
  const handleSelectRole = async (role: TrackerRole) => {
    const session = await auth.selectRole(role);

    if (!session) {
      onNavigate('/login');
      return;
    }

    onNavigate(`/app/${role}`);
  };

  return (
    <div className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.07)] backdrop-blur md:p-8">
      <div className="max-w-3xl">
        <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Role selection</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-950 md:text-4xl">Выбери свою роль в StudyBuddy</h1>
        <p className="mt-4 text-sm leading-7 text-slate-600 md:text-base">
          У каждой роли свой слой интерфейса. Выбор можно будет поменять позже, но для первого входа лучше сразу задать нужный режим.
        </p>
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        {roleCards.map((card) => {
          const Icon = card.icon;

          return (
            <button
              key={card.id}
              onClick={() => void handleSelectRole(card.id)}
              className="group rounded-[30px] border border-slate-200 bg-slate-50 p-5 text-left transition hover:-translate-y-1 hover:bg-white hover:shadow-[0_18px_50px_rgba(15,23,42,0.08)]"
            >
              <div className={`inline-flex rounded-2xl bg-gradient-to-r p-3 text-white ${card.tone}`}>
                <Icon className="h-5 w-5" />
              </div>
              <p className="mt-5 text-xl font-semibold text-slate-950">{card.title}</p>
              <p className="mt-3 text-sm leading-7 text-slate-600">{card.text}</p>
              <span className="mt-5 inline-flex items-center text-sm font-medium text-blue-700">
                Выбрать роль
                <ArrowRight className="ml-2 h-4 w-4 transition group-hover:translate-x-1" />
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
