import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { isSupabaseEnabled } from '../../../shared/lib/supabase';
import { studentAchievementsApi } from '../api/studentAchievementsApi';
import type { StudentAchievementRow } from '../types/achievement';
import type { Task } from '../types/task';
import { buildAchievementRules } from '../utils/achievementRules';

interface AchievementStats {
  total: number;
  completedCount: number;
  overdueCount: number;
  completionRate: number;
}

export function useStudentAchievements(
  profileId: string | null | undefined,
  tasks: Task[],
  stats: AchievementStats
) {
  const [savedAchievements, setSavedAchievements] = useState<StudentAchievementRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastSyncKeyRef = useRef('');

  const achievementRules = useMemo(() => {
    return buildAchievementRules(tasks, stats);
  }, [tasks, stats]);

  const loadAchievements = useCallback(async () => {
    if (!isSupabaseEnabled || !profileId) {
      setSavedAchievements([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const rows = await studentAchievementsApi.getByStudent(profileId);
      setSavedAchievements(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось загрузить достижения');
    } finally {
      setIsLoading(false);
    }
  }, [profileId]);

  useEffect(() => {
    void loadAchievements();
  }, [loadAchievements]);

  useEffect(() => {
    if (!isSupabaseEnabled || !profileId || achievementRules.length === 0) return;

    const savedByKey = new Map(savedAchievements.map((item) => [item.achievement_key, item]));

    const payload = achievementRules.map((achievement) => {
      const saved = savedByKey.get(achievement.id);
      const isUnlockedNow = achievement.current >= achievement.target;
      const wasUnlocked = saved?.is_unlocked ?? false;

      return {
        achievement_key: achievement.id,
        title: achievement.title,
        description: achievement.description,
        progress: Math.min(achievement.current, achievement.target),
        target: achievement.target,
        is_unlocked: wasUnlocked || isUnlockedNow,
        unlocked_at:
          saved?.unlocked_at ?? (isUnlockedNow ? new Date().toISOString() : null),
      };
    });

    const syncKey = JSON.stringify(payload.map((item) => ({
      achievement_key: item.achievement_key,
      progress: item.progress,
      target: item.target,
      is_unlocked: item.is_unlocked,
      unlocked_at: item.unlocked_at,
    })));

    if (lastSyncKeyRef.current === syncKey) return;
    lastSyncKeyRef.current = syncKey;

    void studentAchievementsApi
      .upsertMany(profileId, payload)
      .then(loadAchievements)
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Не удалось сохранить достижения');
      });
  }, [achievementRules, loadAchievements, profileId, savedAchievements]);

  return {
    achievements: achievementRules,
    savedAchievements,
    isLoading,
    error,
    reload: loadAchievements,
  };
}
