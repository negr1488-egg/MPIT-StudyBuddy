export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          role: 'student' | 'teacher' | 'parent';
          created_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          role: 'student' | 'teacher' | 'parent';
          created_at?: string;
        };
        Update: {
          full_name?: string;
          role?: 'student' | 'teacher' | 'parent';
        };
      };
      students: {
        Row: {
          id: string;
          profile_id: string;
          class_name: string | null;
          parent_profile_id: string | null;
        };
        Insert: {
          id?: string;
          profile_id: string;
          class_name?: string | null;
          parent_profile_id?: string | null;
        };
        Update: {
          class_name?: string | null;
          parent_profile_id?: string | null;
        };
      };
      teachers: {
        Row: {
          id: string;
          profile_id: string;
          subject: string | null;
        };
        Insert: {
          id?: string;
          profile_id: string;
          subject?: string | null;
        };
        Update: {
          subject?: string | null;
        };
      };
      parents: {
        Row: {
          id: string;
          profile_id: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
        };
        Update: Record<string, never>;
      };
      tasks: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          subject: string | null;
          deadline: string;
          priority: 'low' | 'medium' | 'high';
          status: 'todo' | 'in_progress' | 'done' | 'overdue';
          created_by_profile_id: string;
          assigned_student_profile_id: string;
          teacher_profile_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          subject?: string | null;
          deadline: string;
          priority: 'low' | 'medium' | 'high';
          status: 'todo' | 'in_progress' | 'done' | 'overdue';
          created_by_profile_id: string;
          assigned_student_profile_id: string;
          teacher_profile_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          description?: string | null;
          subject?: string | null;
          deadline?: string;
          priority?: 'low' | 'medium' | 'high';
          status?: 'todo' | 'in_progress' | 'done' | 'overdue';
          teacher_profile_id?: string | null;
          updated_at?: string;
        };
      };
      task_comments: {
        Row: {
          id: string;
          task_id: string;
          author_profile_id: string;
          body: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          task_id: string;
          author_profile_id: string;
          body: string;
          created_at?: string;
        };
        Update: {
          body?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          profile_id: string;
          type: string;
          title: string;
          body: string;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          type: string;
          title: string;
          body: string;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          is_read?: boolean;
          title?: string;
          body?: string;
        };
      };
      goals: {
        Row: {
          id: string;
          profile_id: string;
          title: string;
          target_value: number;
          current_value: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          title: string;
          target_value: number;
          current_value?: number;
          created_at?: string;
        };
        Update: {
          title?: string;
          target_value?: number;
          current_value?: number;
        };
      };
      achievements: {
        Row: {
          id: string;
          profile_id: string;
          title: string;
          description: string;
          unlocked_at: string | null;
        };
        Insert: {
          id?: string;
          profile_id: string;
          title: string;
          description: string;
          unlocked_at?: string | null;
        };
        Update: {
          unlocked_at?: string | null;
          title?: string;
          description?: string;
        };
      };
      ai_insights: {
        Row: {
          id: string;
          profile_id: string;
          type: string;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          type: string;
          content: string;
          created_at?: string;
        };
        Update: {
          type?: string;
          content?: string;
        };
      };
    };
  };
}
