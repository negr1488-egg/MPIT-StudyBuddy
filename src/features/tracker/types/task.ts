export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'overdue';
export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskRoleOwner = 'student' | 'teacher' | 'parent';

export interface DbTask {
  id: string;
  title: string;
  subject: string | null;
  description: string | null;
  deadline: string;
  priority: TaskPriority;
  status: TaskStatus;
  created_by_profile_id: string;
  assigned_student_profile_id: string;
  teacher_profile_id: string | null;
  teacher_comment: string | null;
  reminder_missed_count: number;
  created_at: string;
  updated_at: string;
  // 👇 новые поля
  attachments: string[] | null;
  solution_text: string | null;
  solution_attachments: string[] | null;
  teacher_feedback: string | null;
  checked_at: string | null;
}

export interface Task {
  id: string;
  title: string;
  subject?: string;
  description?: string;
  deadline: string;
  priority: TaskPriority;
  status: TaskStatus;
  createdBy: TaskRoleOwner;
  assignedToStudentId: string;
  createdAt: string;
  studentName?: string;
  teacherComment?: string;
  reminderMissedCount?: number;
  // 👇 новые поля
  attachments?: string[];
  solutionText?: string;
  solutionAttachments?: string[];
  teacherFeedback?: string;
  checkedAt?: string;
}