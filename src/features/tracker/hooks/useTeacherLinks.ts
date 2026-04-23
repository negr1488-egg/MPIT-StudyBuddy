import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase, isSupabaseEnabled } from '../../../shared/lib/supabase';

export interface TeacherStudentLink {
  id: string;
  teacher_profile_id: string;
  student_profile_id: string;
  created_at: string;
}

export interface LinkedStudentProfile {
  id: string;
  full_name: string | null;
  role: string | null;
}

export interface LinkedTeacherProfile {
  id: string;
  full_name: string | null;
  role: string | null;
}

export function useTeacherLinks() {
  const [links, setLinks] = useState<TeacherStudentLink[]>([]);
  const [students, setStudents] = useState<LinkedStudentProfile[]>([]);
  const [teachers, setTeachers] = useState<LinkedTeacherProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const resetError = useCallback(() => {
    setError('');
  }, []);

  const getCurrentUserId = useCallback(async () => {
    if (!supabase) return null;

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      setError(sessionError.message);
      return null;
    }

    return session?.user?.id ?? null;
  }, []);

  const loadStudentsForTeacher = useCallback(async () => {
    if (!isSupabaseEnabled || !supabase) {
      setStudents([]);
      setLinks([]);
      return [];
    }

    setIsLoading(true);
    setError('');

    try {
      const teacherId = await getCurrentUserId();

      if (!teacherId) {
        setStudents([]);
        setLinks([]);
        return [];
      }

      const { data: linkRows, error: linksError } = await supabase
        .from('teacher_student_links')
        .select('*')
        .eq('teacher_profile_id', teacherId)
        .order('created_at', { ascending: false });

      console.log('TEACHER LINKS DATA:', linkRows);
      console.log('TEACHER LINKS ERROR:', linksError);

      if (linksError) {
        setError(linksError.message);
        setStudents([]);
        setLinks([]);
        return [];
      }

      const safeLinks = (linkRows ?? []) as TeacherStudentLink[];
      setLinks(safeLinks);

      if (safeLinks.length === 0) {
        setStudents([]);
        return [];
      }

      const studentIds = safeLinks.map((link) => link.student_profile_id);

      const { data: studentProfiles, error: studentError } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .in('id', studentIds);

      console.log('TEACHER STUDENTS DATA:', studentProfiles);
      console.log('TEACHER STUDENTS ERROR:', studentError);

      if (studentError) {
        setError(studentError.message);
        setStudents([]);
        return [];
      }

      const safeStudents = (studentProfiles ?? []) as LinkedStudentProfile[];
      setStudents(safeStudents);
      return safeStudents;
    } catch (nextError) {
      console.error('LOAD STUDENTS FOR TEACHER CATCH:', nextError);
      setError(
        nextError instanceof Error ? nextError.message : 'Не удалось загрузить учеников.'
      );
      setStudents([]);
      setLinks([]);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [getCurrentUserId]);

  const loadTeachersForStudent = useCallback(async () => {
    if (!isSupabaseEnabled || !supabase) {
      setTeachers([]);
      return [];
    }

    setIsLoading(true);
    setError('');

    try {
      const studentId = await getCurrentUserId();

      if (!studentId) {
        setTeachers([]);
        return [];
      }

      const { data: linkRows, error: linksError } = await supabase
        .from('teacher_student_links')
        .select('*')
        .eq('student_profile_id', studentId)
        .order('created_at', { ascending: false });

      console.log('STUDENT->TEACHER LINKS DATA:', linkRows);
      console.log('STUDENT->TEACHER LINKS ERROR:', linksError);

      if (linksError) {
        setError(linksError.message);
        setTeachers([]);
        return [];
      }

      const safeLinks = (linkRows ?? []) as TeacherStudentLink[];

      if (safeLinks.length === 0) {
        setTeachers([]);
        return [];
      }

      const teacherIds = safeLinks.map((link) => link.teacher_profile_id);

      const { data: teacherProfiles, error: teacherError } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .in('id', teacherIds);

      console.log('TEACHERS DATA:', teacherProfiles);
      console.log('TEACHERS ERROR:', teacherError);

      if (teacherError) {
        setError(teacherError.message);
        setTeachers([]);
        return [];
      }

      const safeTeachers = (teacherProfiles ?? []) as LinkedTeacherProfile[];
      setTeachers(safeTeachers);
      return safeTeachers;
    } catch (nextError) {
      console.error('LOAD TEACHERS FOR STUDENT CATCH:', nextError);
      setError(
        nextError instanceof Error ? nextError.message : 'Не удалось загрузить учителей.'
      );
      setTeachers([]);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [getCurrentUserId]);

  const linkTeacherToStudent = useCallback(
    async (studentProfileId: string) => {
      if (!isSupabaseEnabled || !supabase) {
        setError('Supabase не подключен.');
        return null;
      }

      setIsLoading(true);
      setError('');

      try {
        const teacherProfileId = await getCurrentUserId();

        if (!teacherProfileId) {
          setError('Нет активной сессии учителя.');
          return null;
        }

        const { data: existingLink, error: existingError } = await supabase
          .from('teacher_student_links')
          .select('*')
          .eq('teacher_profile_id', teacherProfileId)
          .eq('student_profile_id', studentProfileId)
          .maybeSingle();

        console.log('EXISTING TEACHER LINK:', existingLink);
        console.log('EXISTING TEACHER LINK ERROR:', existingError);

        if (existingError) {
          setError(existingError.message);
          return null;
        }

        if (existingLink) {
          await loadStudentsForTeacher();
          return existingLink as TeacherStudentLink;
        }

        const { data, error: insertError } = await supabase
          .from('teacher_student_links')
          .insert({
            teacher_profile_id: teacherProfileId,
            student_profile_id: studentProfileId,
          })
          .select()
          .single();

        console.log('INSERT TEACHER LINK DATA:', data);
        console.log('INSERT TEACHER LINK ERROR:', insertError);

        if (insertError) {
          setError(insertError.message);
          return null;
        }

        await loadStudentsForTeacher();
        return data as TeacherStudentLink;
      } catch (nextError) {
        console.error('LINK TEACHER TO STUDENT CATCH:', nextError);
        setError(
          nextError instanceof Error
            ? nextError.message
            : 'Не удалось привязать учителя к ученику.'
        );
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [getCurrentUserId, loadStudentsForTeacher]
  );

  const unlinkTeacherFromStudent = useCallback(
    async (studentProfileId: string) => {
      if (!isSupabaseEnabled || !supabase) {
        setError('Supabase не подключен.');
        return false;
      }

      setIsLoading(true);
      setError('');

      try {
        const teacherProfileId = await getCurrentUserId();

        if (!teacherProfileId) {
          setError('Нет активной сессии учителя.');
          return false;
        }

        const { error: deleteError } = await supabase
          .from('teacher_student_links')
          .delete()
          .eq('teacher_profile_id', teacherProfileId)
          .eq('student_profile_id', studentProfileId);

        console.log('DELETE TEACHER LINK ERROR:', deleteError);

        if (deleteError) {
          setError(deleteError.message);
          return false;
        }

        await loadStudentsForTeacher();
        return true;
      } catch (nextError) {
        console.error('UNLINK TEACHER FROM STUDENT CATCH:', nextError);
        setError(
          nextError instanceof Error
            ? nextError.message
            : 'Не удалось отвязать учителя от ученика.'
        );
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [getCurrentUserId, loadStudentsForTeacher]
  );

  useEffect(() => {
    if (!isSupabaseEnabled) return;
    void loadStudentsForTeacher();
  }, [loadStudentsForTeacher]);

  const hasStudents = useMemo(() => students.length > 0, [students]);

  return {
    links,
    students,
    teachers,
    hasStudents,
    isLoading,
    error,
    resetError,
    loadStudentsForTeacher,
    loadTeachersForStudent,
    linkTeacherToStudent,
    unlinkTeacherFromStudent,
  };
}

export type UseTeacherLinksResult = ReturnType<typeof useTeacherLinks>;