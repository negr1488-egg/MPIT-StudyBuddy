import {
  BookOpenCheck,
  CheckCircle2,
  Medal,
  ShieldCheck,
  Star,
  Target,
  Trophy,
  Zap,
} from 'lucide-react';
import type { AchievementRule } from '../types/achievement';
import type { Task } from '../types/task';

interface AchievementStats {
  total: number;
  completedCount: number;
  overdueCount: number;
  completionRate: number;
}

export function buildAchievementRules(tasks: Task[], stats: AchievementStats): AchievementRule[] {
  const completedTasks = tasks.filter((task) => task.status === 'done');
  const checkedTasks = completedTasks.filter((task) => Boolean(task.checkedAt));
  const highPriorityDone = completedTasks.filter((task) => task.priority === 'high');
  const subjects = new Set(
    completedTasks
      .map((task) => task.subject?.trim().toLowerCase())
      .filter((subject): subject is string => Boolean(subject))
  );

  return [
    {
      id: 'first-step',
      title: 'Первый шаг',
      description: 'Выполни первое задание',
      target: 1,
      current: stats.completedCount,
      icon: Star,
      accent: 'from-amber-400 to-orange-500',
    },
    {
      id: 'five-tasks',
      title: 'Учебный разгон',
      description: 'Выполни 5 заданий',
      target: 5,
      current: stats.completedCount,
      icon: Zap,
      accent: 'from-sky-400 to-blue-600',
    },
    {
      id: 'ten-tasks',
      title: 'Стабильный темп',
      description: 'Выполни 10 заданий',
      target: 10,
      current: stats.completedCount,
      icon: Trophy,
      accent: 'from-violet-500 to-fuchsia-600',
    },
    {
      id: 'no-overdue',
      title: 'Без просрочек',
      description: 'Держи список без просроченных задач',
      target: 1,
      current: stats.total > 0 && stats.overdueCount === 0 ? 1 : 0,
      icon: ShieldCheck,
      accent: 'from-emerald-400 to-teal-600',
    },
    {
      id: 'perfect-progress',
      title: '100% контроль',
      description: 'Закрой все текущие задачи',
      target: 100,
      current: stats.completionRate,
      icon: Target,
      accent: 'from-indigo-500 to-blue-700',
    },
    {
      id: 'teacher-approved',
      title: 'Проверено учителем',
      description: 'Получи 3 проверенные работы',
      target: 3,
      current: checkedTasks.length,
      icon: CheckCircle2,
      accent: 'from-lime-400 to-emerald-600',
    },
    {
      id: 'hard-mode',
      title: 'Сложные задачи',
      description: 'Выполни 3 задания с высоким приоритетом',
      target: 3,
      current: highPriorityDone.length,
      icon: Medal,
      accent: 'from-rose-500 to-red-600',
    },
    {
      id: 'many-subjects',
      title: 'Разносторонний ученик',
      description: 'Закрой задания по 3 разным предметам',
      target: 3,
      current: subjects.size,
      icon: BookOpenCheck,
      accent: 'from-cyan-400 to-sky-600',
    },
  ];
}
