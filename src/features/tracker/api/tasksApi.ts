import { supabase, isSupabaseEnabled } from '../../../shared/lib/supabase';
import type { TaskStatus, TaskPriority } from '../types/task';

export interface DbTask {
  id: string;
  title: string;
  subject: string | null;
  description: string | null;
  deadline: string;
  priority: TaskPriority;
  status: TaskStatus;
  teacher_profile_id: string | null;
  assigned_student_profile_id: string;
  created_by_profile_id: string;
  created_at: string;
  teacher_comment: string | null;
  reminder_missed_count: number;
  attachments: string[];
  solution_text: string | null;
  solution_attachments: string[];
  teacher_feedback: string | null;
  checked_at: string | null;
}

export interface CreateTaskPayload {
  title: string;
  subject: string | null;
  description: string | null;
  deadline: string;
  priority: TaskPriority;
  assigned_student_profile_id: string;
  created_by_profile_id: string;
  teacher_profile_id: string | null;
  teacher_comment: string | null;
  attachments: string[];
}

export interface UpdateTaskPayload {
  title?: string;
  subject?: string | null;
  description?: string | null;
  deadline?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  teacher_comment?: string | null;
}

export const tasksApi = {
  async getUserTasks(userId: string): Promise<DbTask[]> {
    if (!isSupabaseEnabled || !supabase) return [];
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .or(`assigned_student_profile_id.eq.${userId},created_by_profile_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data as DbTask[]) ?? [];
  },

  async getStudentTasks(studentId: string): Promise<DbTask[]> {
    if (!isSupabaseEnabled || !supabase) return [];
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('assigned_student_profile_id', studentId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data as DbTask[]) ?? [];
  },

  async getTeacherRelatedTasks(teacherId: string): Promise<DbTask[]> {
    if (!isSupabaseEnabled || !supabase) return [];
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('teacher_profile_id', teacherId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data as DbTask[]) ?? [];
  },

  async getTasksByStudent(studentId: string): Promise<DbTask[]> {
    return this.getStudentTasks(studentId);
  },

  async createTask(payload: CreateTaskPayload): Promise<DbTask> {
    if (!isSupabaseEnabled || !supabase) {
      throw new Error('Supabase not initialized');
    }

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        ...payload,
        status: 'todo',
        reminder_missed_count: 0,
        attachments: payload.attachments ?? [],
        solution_text: null,
        solution_attachments: [],
        teacher_feedback: null,
        checked_at: null,
      })
      .select()
      .single();

    if (error) throw error;
    return data as DbTask;
  },

  async updateTask(taskId: string, updates: UpdateTaskPayload): Promise<void> {
    if (!isSupabaseEnabled || !supabase) return;

    const { error } = await supabase.from('tasks').update(updates).eq('id', taskId);

    if (error) throw error;
  },

  async updateTaskStatus(
    taskId: string,
    updates: { status?: TaskStatus; teacher_comment?: string }
  ): Promise<void> {
    if (!isSupabaseEnabled || !supabase) return;

    const { error } = await supabase.from('tasks').update(updates).eq('id', taskId);

    if (error) throw error;
  },

  async submitSolution(taskId: string, text: string, attachments: string[]): Promise<void> {
    if (!isSupabaseEnabled || !supabase) return;

    const { error } = await supabase
      .from('tasks')
      .update({
        solution_text: text,
        solution_attachments: attachments,
        status: 'in_progress',
      })
      .eq('id', taskId);

    if (error) throw error;
  },

  async reviewTask(taskId: string, feedback: string, status: TaskStatus = 'done'): Promise<void> {
    if (!isSupabaseEnabled || !supabase) return;

    const { error } = await supabase
      .from('tasks')
      .update({
        teacher_feedback: feedback,
        status,
        checked_at: new Date().toISOString(),
      })
      .eq('id', taskId);

    if (error) throw error;
  },

  async updateTaskAttachments(taskId: string, attachments: string[]): Promise<void> {
    if (!isSupabaseEnabled || !supabase) return;

    const { error } = await supabase
      .from('tasks')
      .update({ attachments })
      .eq('id', taskId);

    if (error) throw error;
  },

  async deleteTask(taskId: string): Promise<void> {
    if (!isSupabaseEnabled || !supabase) return;

    const { error } = await supabase.from('tasks').delete().eq('id', taskId);

    if (error) throw error;
  },
};