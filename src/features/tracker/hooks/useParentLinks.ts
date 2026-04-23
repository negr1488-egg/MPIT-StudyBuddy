// useParentLinks.ts (без изменений, но привожу для полноты)
import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase, isSupabaseEnabled } from '../../../shared/lib/supabase';

export interface ParentChildLink {
  id: string;
  parent_profile_id: string;
  student_profile_id: string;
  created_at: string;
}

export interface LinkedStudentProfile {
  id: string;
  full_name: string | null;
  role: string | null;
}

export function useParentLinks() {
  const [links, setLinks] = useState<ParentChildLink[]>([]);
  const [children, setChildren] = useState<LinkedStudentProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [initialized, setInitialized] = useState(false);

  const resetError = useCallback(() => setError(''), []);

  const getCurrentUserId = useCallback(async () => {
    if (!supabase) return null;
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user?.id ?? null;
  }, []);

  const loadChildrenForParent = useCallback(async () => {
    if (!isSupabaseEnabled || !supabase) {
      setChildren([]);
      setLinks([]);
      return [];
    }

    setIsLoading(true);
    setError('');

    try {
      const parentId = await getCurrentUserId();
      if (!parentId) {
        setChildren([]);
        setLinks([]);
        return [];
      }

      const { data: linkRows, error: linksError } = await supabase
        .from('parent_student_links')
        .select('*')
        .eq('parent_profile_id', parentId)
        .order('created_at', { ascending: false });

      if (linksError) throw linksError;

      const safeLinks = (linkRows ?? []) as ParentChildLink[];
      setLinks(safeLinks);

      if (safeLinks.length === 0) {
        setChildren([]);
        return [];
      }

      const studentIds = safeLinks.map(link => link.student_profile_id);
      const { data: studentProfiles, error: studentError } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .in('id', studentIds);

      if (studentError) throw studentError;

      const safeChildren = (studentProfiles ?? []) as LinkedStudentProfile[];
      setChildren(safeChildren);
      return safeChildren;
    } catch (err) {
      console.error('loadChildrenForParent error:', err);
      setError(err instanceof Error ? err.message : 'Ошибка загрузки детей');
      return [];
    } finally {
      setIsLoading(false);
      setInitialized(true);
    }
  }, [getCurrentUserId]);

  const linkParentToStudent = useCallback(async (studentProfileId: string) => {
    if (!isSupabaseEnabled || !supabase) {
      setError('Supabase не подключен.');
      return null;
    }

    setIsLoading(true);
    setError('');

    try {
      const parentId = await getCurrentUserId();
      if (!parentId) throw new Error('Нет активной сессии родителя');

      const { data: existing } = await supabase
        .from('parent_student_links')
        .select('*')
        .eq('parent_profile_id', parentId)
        .eq('student_profile_id', studentProfileId)
        .maybeSingle();

      if (existing) {
        await loadChildrenForParent();
        return existing as ParentChildLink;
      }

      const { data, error: insertError } = await supabase
        .from('parent_student_links')
        .insert({ parent_profile_id: parentId, student_profile_id: studentProfileId })
        .select()
        .single();

      if (insertError) throw insertError;

      await loadChildrenForParent();
      return data as ParentChildLink;
    } catch (err) {
      console.error('linkParentToStudent error:', err);
      setError(err instanceof Error ? err.message : 'Не удалось привязать');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [getCurrentUserId, loadChildrenForParent]);

  const unlinkParentFromStudent = useCallback(async (studentProfileId: string) => {
    if (!isSupabaseEnabled || !supabase) return false;
    setIsLoading(true);
    setError('');
    try {
      const parentId = await getCurrentUserId();
      if (!parentId) throw new Error('Нет сессии');
      const { error: deleteError } = await supabase
        .from('parent_student_links')
        .delete()
        .eq('parent_profile_id', parentId)
        .eq('student_profile_id', studentProfileId);
      if (deleteError) throw deleteError;
      await loadChildrenForParent();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка отвязки');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [getCurrentUserId, loadChildrenForParent]);

  useEffect(() => {
    if (!initialized && isSupabaseEnabled) {
      loadChildrenForParent();
    }
  }, [initialized, loadChildrenForParent]);

  const hasChildren = useMemo(() => children.length > 0, [children]);

  return {
    links,
    children,
    hasChildren,
    isLoading,
    error,
    resetError,
    loadChildrenForParent,
    linkParentToStudent,
    unlinkParentFromStudent,
  };
}