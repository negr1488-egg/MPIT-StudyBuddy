import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import type { Task, TaskPriority, TaskStatus } from '../types/task';
import { TaskCard } from './TaskCard';

interface TaskListProps {
  title: string;
  description: string;
  tasks: Task[];
  emptyText: string;
  isLoading?: boolean;
  onStatusChange?: (taskId: string, status: TaskStatus) => Promise<void>;
  onSubmitSolution?: (taskId: string, text: string, files: File[]) => Promise<void>;
  onReview?: (taskId: string, feedback: string, status?: TaskStatus) => void;
  onRequestHelp?: (taskId: string, message: string) => Promise<void>;
  onAnswerHelp?: (taskId: string, response: string) => Promise<void>;
  onEdit?: (taskId: string, input: {
    title: string;
    subject?: string;
    description?: string;
    deadline: string;
    priority: TaskPriority;
  }) => Promise<void>;
  onDelete?: (taskId: string) => Promise<void>;
  showStudentMeta?: boolean;
}

export function TaskList({
  title,
  description,
  tasks,
  emptyText,
  isLoading = false,
  onStatusChange,
  onSubmitSolution,
  onReview,
  onEdit,
  onDelete,
  onRequestHelp,
  onAnswerHelp,
  showStudentMeta = false,
}: TaskListProps) {
  return (
    <section className="rounded-[30px] border border-white/70 bg-white/80 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.07)] backdrop-blur">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-950">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
          {tasks.length}
        </span>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="animate-pulse rounded-[26px] border border-slate-200 bg-white p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="w-full">
                  <div className="h-4 w-44 rounded bg-slate-200" />
                  <div className="mt-3 h-3 w-3/4 rounded bg-slate-200" />
                  <div className="mt-2 h-3 w-1/2 rounded bg-slate-200" />
                </div>
                <div className="h-20 w-36 rounded-3xl bg-slate-200" />
              </div>
            </div>
          ))
        ) : tasks.length > 0 ? (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onStatusChange={onStatusChange}
              onSubmitSolution={onSubmitSolution}
              onReview={onReview}
              onRequestHelp={onRequestHelp}
              onAnswerHelp={onAnswerHelp}
              onEdit={onEdit}
              onDelete={onDelete}
              showStudentMeta={showStudentMeta}
            />
          ))
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-white p-3 text-slate-500">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-800">Пусто, и это нормально</p>
                <p className="mt-2 text-sm leading-6 text-slate-500">{emptyText}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
