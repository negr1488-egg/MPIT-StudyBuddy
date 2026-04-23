import { hasSupabaseEnv } from '../../shared/config/env';
import type { Task, TaskStatus } from '../../features/tracker/types/task';
import { requireSupabase } from './client';

function mapTask(row: {
  id: string;
  title: string;
  description: string | null;
  subject: string | null;
  deadline: string;
  priority: 'low' | 'medium' | 'high';
  status: 'todo' | 'in_progress' | 'done' | 'overdue';
  created_at: string;
  created_by_profile_id: string;
  assigned_student_profile_id: string;
  teacher_profile_id: string | null;
}): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? undefined,
    subject: row.subject ?? undefined,
    deadline: row.deadline,
    priority: row.priority,
    status: row.status,
    createdBy: row.teacher_profile_id ? 'teacher' : 'student',
    assignedToStudentId: row.assigned_student_profile_id,
    createdAt: row.created_at,
  };
}

export const supabaseTaskService = {
  isEnabled: hasSupabaseEnv,

  async listTasks(profileId: string) {
    const client = requireSupabase();
    const { data, error } = await client
      .from('tasks')
      .select('*')
      .or(`assigned_student_profile_id.eq.${profileId},created_by_profile_id.eq.${profileId},teacher_profile_id.eq.${profileId}`)
      .order('deadline', { ascending: true });

    if (error) throw error;
    return (data ?? []).map(mapTask);
  },

  async createTask(profileId: string, task: Task) {
    const client = requireSupabase();
    const payload = {
      title: task.title,
      description: task.description ?? null,
      subject: task.subject ?? null,
      deadline: task.deadline,
      priority: task.priority,
      status: task.status,
      created_by_profile_id: profileId,
      assigned_student_profile_id: task.assignedToStudentId,
      teacher_profile_id: task.createdBy === 'teacher' ? profileId : null,
    };

    const { data, error } = await client.from('tasks').insert(payload).select('*').single();
    if (error) throw error;
    return mapTask(data);
  },

  async updateTaskStatus(taskId: string, status: TaskStatus) {
    const client = requireSupabase();
    const { error } = await client.from('tasks').update({ status, updated_at: new Date().toISOString() }).eq('id', taskId);
    if (error) throw error;
  },

  async deleteTask(taskId: string) {
    const client = requireSupabase();
    const { error } = await client.from('tasks').delete().eq('id', taskId);
    if (error) throw error;
  },
};
