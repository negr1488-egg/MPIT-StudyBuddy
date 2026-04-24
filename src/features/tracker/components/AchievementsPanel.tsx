import React, { useMemo } from 'react';
import { Award, Lock, Sparkles, Trophy } from 'lucide-react';
import type { AchievementRule, StudentAchievementRow } from '../types/achievement';

interface AchievementsPanelProps {
  achievements: AchievementRule[];
  savedAchievements?: StudentAchievementRow[];
  isLoading?: boolean;
  error?: string | null;
}

function clampProgress(value: number) {
  return Math.min(100, Math.max(0, value));
}

function getProgress(current: number, target: number) {
  if (target <= 0) return 100;
  return clampProgress(Math.round((current / target) * 100));
}

function formatUnlockedDate(value: string | null | undefined) {
  if (!value) return '';
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value));
}

export function AchievementsPanel({
  achievements,
  savedAchievements = [],
  isLoading = false,
  error = null,
}: AchievementsPanelProps) {
  const savedByKey = useMemo(() => {
    return new Map(savedAchievements.map((item) => [item.achievement_key, item]));
  }, [savedAchievements]);

  const unlockedCount = achievements.filter((item) => {
    const saved = savedByKey.get(item.id);
    return saved?.is_unlocked || item.current >= item.target;
  }).length;

  const totalCount = achievements.length;
  const nextAchievement = achievements.find((item) => {
    const saved = savedByKey.get(item.id);
    return !(saved?.is_unlocked || item.current >= item.target);
  }) ?? null;

  return (
    <section className="rounded-[30px] border border-white/70 bg-white/80 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.07)] backdrop-blur">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-amber-600" />
            <h2 className="text-lg font-semibold text-slate-950">Достижения ученика</h2>
          </div>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Награды открываются автоматически и сохраняются в базе данных Supabase.
          </p>
          {isLoading && <p className="mt-2 text-xs text-slate-500">Загружаю достижения...</p>}
          {error && <p className="mt-2 text-xs text-rose-600">{error}</p>}
        </div>

        <div className="rounded-3xl bg-slate-950 px-5 py-4 text-white">
          <div className="text-xs text-slate-300">Открыто достижений</div>
          <div className="mt-1 flex items-end gap-2">
            <span className="text-3xl font-semibold">{unlockedCount}</span>
            <span className="pb-1 text-sm text-slate-300">из {totalCount}</span>
          </div>
        </div>
      </div>

      {nextAchievement && (
        <div className="mt-5 rounded-3xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div>
              <div className="text-sm font-semibold text-amber-950">
                Следующая цель: {nextAchievement.title}
              </div>
              <div className="mt-1 text-sm leading-6 text-amber-800">
                {nextAchievement.description}. Прогресс: {Math.min(nextAchievement.current, nextAchievement.target)} / {nextAchievement.target}.
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {achievements.map((achievement) => {
          const Icon = achievement.icon || Trophy;
          const saved = savedByKey.get(achievement.id);
          const isUnlocked = saved?.is_unlocked || achievement.current >= achievement.target;
          const current = saved?.progress ?? achievement.current;
          const progress = getProgress(current, achievement.target);
          const unlockedDate = formatUnlockedDate(saved?.unlocked_at);

          return (
            <article
              key={achievement.id}
              className={`rounded-[28px] border p-4 transition ${
                isUnlocked
                  ? 'border-slate-200 bg-white shadow-[0_12px_35px_rgba(15,23,42,0.06)]'
                  : 'border-slate-200 bg-slate-50 opacity-80'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div
                  className={`rounded-2xl bg-gradient-to-r p-3 text-white shadow-lg ${
                    isUnlocked ? achievement.accent : 'from-slate-300 to-slate-400'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                  {isUnlocked ? 'Открыто' : <Lock className="h-3.5 w-3.5" />}
                </div>
              </div>

              <h3 className="mt-4 text-sm font-semibold text-slate-950">{achievement.title}</h3>
              <p className="mt-1 min-h-[40px] text-xs leading-5 text-slate-500">
                {achievement.description}
              </p>

              {isUnlocked && unlockedDate && (
                <p className="mt-2 text-xs font-medium text-emerald-700">
                  Получено: {unlockedDate}
                </p>
              )}

              <div className="mt-4">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>{Math.min(current, achievement.target)} / {achievement.target}</span>
                  <span>{progress}%</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${achievement.accent}`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
