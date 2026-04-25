import React, { useMemo, useState } from 'react';
import {
  Clock3,
  Paperclip,
  LoaderCircle,
  Pencil,
  Trash2,
  X,
  Save,
  CheckCircle2,
  AlertCircle,
  ClipboardCheck,
  MessageCircle,
} from 'lucide-react';
import { parseTaskHelpRequest } from '../utils/helpRequest';
import type { Task, TaskPriority, TaskStatus } from '../types/task';
import { formatDeadline } from '../utils/deadline';

interface TaskCardProps {
  task: Task;
  onStatusChange?: (taskId: string, status: TaskStatus, teacherComment?: string) => Promise<void>;
  onSubmitSolution?: (taskId: string, text: string, files: File[]) => Promise<void>;
  onReview?: (taskId: string, feedback: string, status?: TaskStatus) => void;
  onRequestHelp?: (taskId: string, message: string) => Promise<void>;
  onAnswerHelp?: (taskId: string, response: string) => Promise<void>;
  onEdit?: (
    taskId: string,
    input: {
      title: string;
      subject?: string;
      description?: string;
      deadline: string;
      priority: TaskPriority;
    }
  ) => Promise<void>;
  onDelete?: (taskId: string) => Promise<void>;
  showStudentMeta?: boolean;
}

interface ParsedStep {
  title: string;
  minutes: number | null;
}

interface ParsedDescription {
  plainDescription: string;
  steps: ParsedStep[];
}

function toLocalDateTimeInput(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const timezoneOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 16);
}

function parseStepsFromDescription(description?: string): ParsedDescription {
  const source = String(description || '').trim();

  if (!source) {
    return { plainDescription: '', steps: [] };
  }

  const lines = source.split('\n');
  const markerIndex = lines.findIndex((line) =>
    line.trim().toLowerCase().startsWith('этапы выполнения')
  );

  if (markerIndex === -1) {
    return { plainDescription: source, steps: [] };
  }

  const before = lines.slice(0, markerIndex).join('\n').trim();
  const after = lines.slice(markerIndex + 1);
  const parsedSteps: ParsedStep[] = [];

  for (const rawLine of after) {
    const line = rawLine.trim();
    if (!line) continue;

    const cleaned = line.replace(/^\d+[\).\s-]*/, '').trim();
    const minutesMatch = cleaned.match(/~\s*(\d+)\s*мин/i);
    const minutes = minutesMatch ? Number(minutesMatch[1]) : null;

    const title = cleaned
      .replace(/\(~\s*\d+\s*мин\.?\)/i, '')
      .replace(/~\s*\d+\s*мин\.?/i, '')
      .trim();

    if (!title) continue;

    parsedSteps.push({ title, minutes });
  }

  return {
    plainDescription: before,
    steps: parsedSteps,
  };
}

function getPriorityBadge(priority: TaskPriority) {
  switch (priority) {
    case 'high':
      return 'bg-rose-100 text-rose-700 border border-rose-200';
    case 'low':
      return 'bg-slate-100 text-slate-700 border border-slate-200';
    default:
      return 'bg-amber-100 text-amber-700 border border-amber-200';
  }
}

function getVisualState(task: Task) {
  const isPendingReview = task.status === 'done' && !task.checkedAt;
  const isCompletedFinal = task.status === 'done' && Boolean(task.checkedAt);

  if (isPendingReview) {
    return {
      statusLabel: 'Ждёт проверки',
      statusClass: 'bg-amber-100 text-amber-800 border border-amber-200',
      cardClass:
        'border-amber-300 bg-white shadow-[0_12px_35px_rgba(245,158,11,0.12)]',
      stripeClass: 'bg-amber-400',
      deadlineClass: 'bg-amber-50 text-amber-900 border border-amber-200',
      banner: {
        icon: ClipboardCheck,
        text: 'Нужно проверить: задача выполнена учеником и ждёт проверки учителя',
        className: 'border-amber-300 bg-amber-100 text-amber-900',
      },
    };
  }

  if (isCompletedFinal) {
    return {
      statusLabel: 'Завершено',
      statusClass: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
      cardClass:
        'border-emerald-300 bg-white shadow-[0_12px_35px_rgba(16,185,129,0.12)]',
      stripeClass: 'bg-emerald-400',
      deadlineClass: 'bg-emerald-50 text-emerald-900 border border-emerald-200',
      banner: {
        icon: CheckCircle2,
        text: 'Задача полностью завершена и проверена',
        className: 'border-emerald-300 bg-emerald-100 text-emerald-900',
      },
    };
  }

  if (task.status === 'overdue') {
    return {
      statusLabel: 'Просрочено',
      statusClass: 'bg-rose-100 text-rose-700 border border-rose-200',
      cardClass:
        'border-rose-300 bg-white shadow-[0_12px_35px_rgba(244,63,94,0.10)]',
      stripeClass: 'bg-rose-400',
      deadlineClass: 'bg-rose-50 text-rose-900 border border-rose-200',
      banner: null,
    };
  }

  if (task.status === 'in_progress') {
    return {
      statusLabel: 'В работе',
      statusClass: 'bg-sky-100 text-sky-700 border border-sky-200',
      cardClass:
        'border-sky-200 bg-white shadow-[0_10px_28px_rgba(14,165,233,0.08)]',
      stripeClass: 'bg-sky-400',
      deadlineClass: 'bg-sky-50 text-sky-900 border border-sky-200',
      banner: null,
    };
  }

  return {
    statusLabel: 'К выполнению',
    statusClass: 'bg-slate-100 text-slate-700 border border-slate-200',
    cardClass: 'border-slate-200 bg-white shadow-sm',
    stripeClass: 'bg-slate-300',
    deadlineClass: 'bg-slate-50 text-slate-700 border border-slate-200',
    banner: null,
  };
}

export function TaskCard({
  task,
  onStatusChange,
  onSubmitSolution,
  onReview,
  onEdit,
  onDelete,
  onRequestHelp,
  onAnswerHelp,
  showStudentMeta = false,
}: TaskCardProps) {
  const [solutionText, setSolutionText] = useState('');
  const [solutionFiles, setSolutionFiles] = useState<File[]>([]);
  const [feedback, setFeedback] = useState('');
  const [showSolutionForm, setShowSolutionForm] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const [editTitle, setEditTitle] = useState(task.title);
  const [editSubject, setEditSubject] = useState(task.subject ?? '');
  const [editDescription, setEditDescription] = useState(task.description ?? '');
  const [editDeadline, setEditDeadline] = useState(toLocalDateTimeInput(task.deadline));
  const [editPriority, setEditPriority] = useState<TaskPriority>(task.priority);

  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [helpMessage, setHelpMessage] = useState("");
  const [helpResponse, setHelpResponse] = useState("");
  const [showHelpForm, setShowHelpForm] = useState(false);
  const [showHelpAnswerForm, setShowHelpAnswerForm] = useState(false);
  const [isSendingHelp, setIsSendingHelp] = useState(false);
  const [helpError, setHelpError] = useState<string | null>(null);

  const { plainDescription, steps } = useMemo(
    () => parseStepsFromDescription(task.description),
    [task.description]
  );

  const helpRequest = useMemo(() => parseTaskHelpRequest(task.teacherComment), [task.teacherComment]);
  const canSubmit = task.status !== 'done' && !task.checkedAt;
  const isPendingReview = task.status === 'done' && !task.checkedAt;
  const isCompletedFinal = task.status === 'done' && Boolean(task.checkedAt);
  const canManageTask = Boolean((onEdit || onDelete) && !isCompletedFinal);

  const priorityBadge = getPriorityBadge(task.priority);
  const visual = getVisualState(task);

  const handleStatusChange = async (newStatus: TaskStatus) => {
    if (!onStatusChange) return;

    setStatusLoading(true);
    setStatusError(null);

    try {
      await onStatusChange(task.id, newStatus);
    } catch (err) {
      setStatusError(err instanceof Error ? err.message : 'Не удалось изменить статус');
    } finally {
      setStatusLoading(false);
    }
  };

  const handleSubmitSolution = async () => {
    if (!solutionText.trim() && solutionFiles.length === 0) return;
    if (!onSubmitSolution) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await onSubmitSolution(task.id, solutionText, solutionFiles);
      setSolutionText('');
      setSolutionFiles([]);
      setShowSolutionForm(false);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Ошибка отправки');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReview = () => {
    onReview?.(task.id, feedback, 'done');
    setFeedback('');
    setShowReviewForm(false);
  };

  const handleStartEdit = () => {
    if (isCompletedFinal) {
      setEditError('Завершённую задачу нельзя редактировать');
      return;
    }

    setEditError(null);
    setEditTitle(task.title);
    setEditSubject(task.subject ?? '');
    setEditDescription(task.description ?? '');
    setEditDeadline(toLocalDateTimeInput(task.deadline));
    setEditPriority(task.priority);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditError(null);
  };

  const handleSaveEdit = async () => {
    if (!onEdit) return;

    if (isCompletedFinal) {
      setEditError('Завершённую задачу нельзя редактировать');
      return;
    }

    if (!editTitle.trim()) {
      setEditError('Введите название задачи');
      return;
    }

    if (!editDeadline) {
      setEditError('Укажите дедлайн');
      return;
    }

    setIsSavingEdit(true);
    setEditError(null);

    try {
      await onEdit(task.id, {
        title: editTitle.trim(),
        subject: editSubject.trim() || undefined,
        description: editDescription.trim() || undefined,
        deadline: new Date(editDeadline).toISOString(),
        priority: editPriority,
      });

      setIsEditing(false);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Не удалось сохранить изменения');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;

    if (isCompletedFinal) {
      setDeleteError('Завершённую задачу нельзя удалить');
      return;
    }

    const confirmed = window.confirm(`Удалить задачу "${task.title}"?`);
    if (!confirmed) return;

    setIsDeleting(true);
    setDeleteError(null);

    try {
      await onDelete(task.id);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Не удалось удалить задачу');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRequestHelp = async () => {
    if (!onRequestHelp) return;

    const message = helpMessage.trim();
    if (!message) {
      setHelpError('Опишите, в чём нужна помощь');
      return;
    }

    setIsSendingHelp(true);
    setHelpError(null);

    try {
      await onRequestHelp(task.id, message);
      setHelpMessage('');
      setShowHelpForm(false);
    } catch (err) {
      setHelpError(err instanceof Error ? err.message : 'Не удалось отправить запрос');
    } finally {
      setIsSendingHelp(false);
    }
  };

  const handleAnswerHelp = async () => {
    if (!onAnswerHelp) return;

    const response = helpResponse.trim();
    if (!response) {
      setHelpError('Введите ответ ученику');
      return;
    }

    setIsSendingHelp(true);
    setHelpError(null);

    try {
      await onAnswerHelp(task.id, response);
      setHelpResponse('');
      setShowHelpAnswerForm(false);
    } catch (err) {
      setHelpError(err instanceof Error ? err.message : 'Не удалось отправить ответ');
    } finally {
      setIsSendingHelp(false);
    }
  };

  const BannerIcon = visual.banner?.icon;

  return (
    <div
      className={`group relative overflow-hidden rounded-[30px] border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_38px_rgba(15,23,42,0.10)] ${visual.cardClass}`}
    >
      <div className={`absolute inset-y-0 left-0 w-1.5 ${visual.stripeClass}`} />

      <div className="pl-5 pr-4 pt-4">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="min-w-0 flex-1">
            <div className="mb-3 flex flex-wrap gap-2">
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${priorityBadge}`}>
                {task.priority}
              </span>

              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${visual.statusClass}`}
              >
                {visual.statusLabel}
              </span>

              {task.subject && (
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700">
                  {task.subject}
                </span>
              )}
            </div>

            {visual.banner && BannerIcon && (
              <div
                className={`mb-3 rounded-2xl border px-4 py-3 text-sm font-medium ${visual.banner.className}`}
              >
                <div className="flex items-center gap-2">
                  <BannerIcon className="h-4 w-4 shrink-0" />
                  <span>{visual.banner.text}</span>
                </div>
              </div>
            )}

            {!isEditing ? (
              <>
                <h3 className="text-lg font-semibold leading-7 text-slate-900">{task.title}</h3>

                {plainDescription && (
                  <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-600">
                    {plainDescription}
                  </p>
                )}

                {showStudentMeta && task.studentName && (
                  <p className="mt-3 text-sm text-slate-500">Ученик: {task.studentName}</p>
                )}
              </>
            ) : (
              <div className="space-y-3">
                <input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="h-11 w-full rounded-2xl border px-4 text-sm"
                  placeholder="Название"
                  disabled={isSavingEdit}
                />

                <input
                  value={editSubject}
                  onChange={(e) => setEditSubject(e.target.value)}
                  className="h-11 w-full rounded-2xl border px-4 text-sm"
                  placeholder="Предмет"
                  disabled={isSavingEdit}
                />

                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="min-h-[100px] w-full rounded-2xl border p-4 text-sm"
                  placeholder="Описание"
                  disabled={isSavingEdit}
                />

                <div className="grid gap-3 md:grid-cols-2">
                  <input
                    type="datetime-local"
                    value={editDeadline}
                    onChange={(e) => setEditDeadline(e.target.value)}
                    className="h-11 w-full rounded-2xl border px-4 text-sm"
                    disabled={isSavingEdit}
                  />

                  <select
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value as TaskPriority)}
                    className="h-11 w-full rounded-2xl border px-4 text-sm"
                    disabled={isSavingEdit}
                  >
                    <option value="low">Низкий</option>
                    <option value="medium">Средний</option>
                    <option value="high">Высокий</option>
                  </select>
                </div>

                {editError && (
                  <div className="rounded-xl bg-rose-50 p-2 text-sm text-rose-700">
                    {editError}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex w-full flex-col gap-3 sm:w-auto sm:min-w-[220px]">
            <div className={`rounded-3xl px-4 py-4 text-sm ${visual.deadlineClass}`}>
              <div className="flex items-center gap-2">
                <Clock3 className="h-4 w-4 shrink-0" />
                <span className="font-medium">{formatDeadline(task.deadline)}</span>
              </div>
            </div>

            {canManageTask && !isEditing && (
              <div className="flex flex-wrap justify-start gap-2 sm:justify-end">
                {onEdit && (
                  <button
                    type="button"
                    onClick={handleStartEdit}
                    className="inline-flex items-center rounded-2xl bg-slate-100 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-200"
                  >
                    <Pencil className="mr-2 h-3.5 w-3.5" />
                    Редактировать
                  </button>
                )}

                {onDelete && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="inline-flex items-center rounded-2xl bg-rose-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-rose-700 disabled:opacity-60"
                  >
                    {isDeleting ? (
                      <LoaderCircle className="mr-2 h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="mr-2 h-3.5 w-3.5" />
                    )}
                    Удалить
                  </button>
                )}
              </div>
            )}

            {isEditing && (
              <div className="flex flex-wrap justify-start gap-2 sm:justify-end">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={isSavingEdit}
                  className="inline-flex items-center rounded-2xl bg-slate-100 px-3 py-2 text-xs font-medium text-slate-700"
                >
                  <X className="mr-2 h-3.5 w-3.5" />
                  Отмена
                </button>

                <button
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={isSavingEdit}
                  className="inline-flex items-center rounded-2xl bg-slate-950 px-3 py-2 text-xs font-medium text-white disabled:opacity-60"
                >
                  {isSavingEdit ? (
                    <LoaderCircle className="mr-2 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-3.5 w-3.5" />
                  )}
                  Сохранить
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4 py-4">
          {steps.length > 0 && (
            <div className="rounded-[24px] border border-violet-200 bg-violet-50 p-4">
              <p className="text-sm font-medium text-violet-900">Этапы выполнения</p>
              <div className="mt-3 space-y-2">
                {steps.map((step, index) => (
                  <div
                    key={`${step.title}-${index}`}
                    className="flex items-start justify-between gap-3 rounded-2xl border border-violet-100 bg-white px-4 py-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-semibold text-violet-700">
                        {index + 1}
                      </div>
                      <p className="text-sm leading-6 text-slate-800">{step.title}</p>
                    </div>

                    {step.minutes !== null && (
                      <span className="whitespace-nowrap rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                        ~{step.minutes} мин
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {task.attachments && task.attachments.length > 0 && (
            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-700">Прикреплённые файлы</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {task.attachments.map((url, i) => (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-blue-600 hover:underline"
                  >
                    <Paperclip className="h-3 w-3" /> Файл {i + 1}
                  </a>
                ))}
              </div>
            </div>
          )}

          {helpRequest && (
            <div className="rounded-[24px] border border-sky-200 bg-sky-50 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-sky-900">
                <MessageCircle className="h-4 w-4" />
                Запрос помощи учителю
              </div>
              <p className="mt-2 whitespace-pre-line text-sm leading-6 text-sky-900">
                {helpRequest.request}
              </p>
              {helpRequest.response ? (
                <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Ответ учителя</p>
                  <p className="mt-1 whitespace-pre-line text-sm leading-6 text-emerald-900">
                    {helpRequest.response}
                  </p>
                </div>
              ) : (
                <p className="mt-3 text-xs font-medium text-sky-700">Учитель ещё не ответил</p>
              )}
            </div>
          )}

          {task.solutionText && (
            <div
              className={`rounded-[24px] border p-4 ${
                isPendingReview
                  ? 'border-amber-200 bg-amber-50'
                  : isCompletedFinal
                  ? 'border-emerald-200 bg-emerald-50'
                  : 'border-slate-200 bg-slate-50'
              }`}
            >
              <p className="text-sm font-medium text-slate-800">Решение ученика</p>
              <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-700">
                {task.solutionText}
              </p>

              {task.solutionAttachments && task.solutionAttachments.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {task.solutionAttachments.map((url, i) => (
                    <a
                      key={i}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-blue-600 shadow-sm"
                    >
                      <Paperclip className="h-3 w-3" /> Решение {i + 1}
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}

          {task.teacherFeedback ? (
            <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-sm font-medium text-emerald-800">Отзыв учителя</p>
              <p className="mt-2 text-sm leading-6 text-emerald-900">{task.teacherFeedback}</p>
            </div>
          ) : isPendingReview ? (
            <div className="rounded-[24px] border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-amber-900">
                <AlertCircle className="h-4 w-4" />
                Работа отправлена и ожидает проверки учителя
              </div>
            </div>
          ) : (
            <div className="text-xs italic text-slate-400">Отзыва учителя пока нет</div>
          )}

          {statusError && (
            <div className="rounded-xl bg-rose-50 p-2 text-sm text-rose-700">{statusError}</div>
          )}

          {deleteError && (
            <div className="rounded-xl bg-rose-50 p-2 text-sm text-rose-700">{deleteError}</div>
          )}
        </div>

        <div className="flex flex-wrap gap-2 border-t border-slate-100 py-4">
          {onStatusChange && task.status !== 'done' && !isEditing && (
            <>
              <button
                onClick={() => handleStatusChange('in_progress')}
                disabled={statusLoading}
                className="inline-flex items-center rounded-2xl bg-slate-950 px-4 py-2 text-sm text-white disabled:opacity-50"
              >
                {statusLoading && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                Начать
              </button>

              <button
                onClick={() => handleStatusChange('done')}
                disabled={statusLoading}
                className="inline-flex items-center rounded-2xl bg-emerald-600 px-4 py-2 text-sm text-white disabled:opacity-50"
              >
                {statusLoading && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                Выполнено
              </button>
            </>
          )}

          {canSubmit && onSubmitSolution && !isEditing && (
            <button
              onClick={() => setShowSolutionForm(!showSolutionForm)}
              className="rounded-2xl bg-blue-600 px-4 py-2 text-sm text-white"
            >
              {showSolutionForm ? 'Скрыть' : 'Отправить решение'}
            </button>
          )}


          {onRequestHelp && task.createdBy === 'teacher' && !isEditing && !isCompletedFinal && (
            <button
              onClick={() => setShowHelpForm(!showHelpForm)}
              className="inline-flex items-center rounded-2xl bg-sky-600 px-4 py-2 text-sm text-white"
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              {showHelpForm ? 'Скрыть запрос' : helpRequest ? 'Изменить запрос помощи' : 'Попросить помощь'}
            </button>
          )}

          {onAnswerHelp && helpRequest && !helpRequest.response && !isEditing && (
            <button
              onClick={() => setShowHelpAnswerForm(!showHelpAnswerForm)}
              className="inline-flex items-center rounded-2xl bg-sky-600 px-4 py-2 text-sm font-medium text-white shadow-sm"
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              Ответить на запрос
            </button>
          )}
          {onReview && isPendingReview && !isEditing && (
            <button
              onClick={() => setShowReviewForm(!showReviewForm)}
              className="rounded-2xl bg-amber-600 px-4 py-2 text-sm font-medium text-white shadow-sm"
            >
              Проверить
            </button>
          )}
        </div>


        {showHelpForm && !isEditing && (
          <div className="pb-4">
            <div className="rounded-[24px] border border-sky-200 bg-sky-50 p-4">
              <textarea
                value={helpMessage}
                onChange={(e) => setHelpMessage(e.target.value)}
                placeholder="Напиши, что именно непонятно по задаче..."
                className="w-full rounded-xl border p-3 text-sm"
                rows={3}
                disabled={isSendingHelp}
              />

              {helpError && (
                <div className="mt-2 rounded-xl bg-rose-50 p-2 text-sm text-rose-700">
                  {helpError}
                </div>
              )}

              <button
                onClick={handleRequestHelp}
                disabled={isSendingHelp}
                className="mt-3 inline-flex items-center rounded-xl bg-sky-600 px-4 py-2 text-sm text-white disabled:opacity-50"
              >
                {isSendingHelp && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                Отправить запрос учителю
              </button>
            </div>
          </div>
        )}

        {showHelpAnswerForm && !isEditing && (
          <div className="pb-4">
            <div className="rounded-[24px] border border-sky-200 bg-sky-50 p-4">
              <div className="mb-3 rounded-2xl bg-white p-3 text-sm leading-6 text-slate-700">
                {helpRequest?.request}
              </div>

              <textarea
                value={helpResponse}
                onChange={(e) => setHelpResponse(e.target.value)}
                placeholder="Ответ ученику..."
                className="w-full rounded-xl border p-3 text-sm"
                rows={3}
                disabled={isSendingHelp}
              />

              {helpError && (
                <div className="mt-2 rounded-xl bg-rose-50 p-2 text-sm text-rose-700">
                  {helpError}
                </div>
              )}

              <button
                onClick={handleAnswerHelp}
                disabled={isSendingHelp}
                className="mt-3 inline-flex items-center rounded-xl bg-slate-950 px-4 py-2 text-sm text-white disabled:opacity-50"
              >
                {isSendingHelp && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                Отправить ответ
              </button>
            </div>
          </div>
        )}
        {showSolutionForm && !isEditing && (
          <div className="pb-4">
            <div className="rounded-[24px] border bg-slate-50 p-4">
              <textarea
                value={solutionText}
                onChange={(e) => setSolutionText(e.target.value)}
                placeholder="Текст решения..."
                className="w-full rounded-xl border p-3 text-sm"
                rows={3}
                disabled={isSubmitting}
              />

              <div className="mt-3">
                <label className="text-sm font-medium text-slate-700">Прикрепить файлы:</label>
                <input
                  type="file"
                  multiple
                  onChange={(e) => setSolutionFiles(Array.from(e.target.files || []))}
                  className="mt-1 text-sm"
                  disabled={isSubmitting}
                />
              </div>

              {submitError && (
                <div className="mt-2 rounded-xl bg-rose-50 p-2 text-sm text-rose-700">
                  {submitError}
                </div>
              )}

              <button
                onClick={handleSubmitSolution}
                disabled={isSubmitting}
                className="mt-3 inline-flex items-center rounded-xl bg-slate-950 px-4 py-2 text-sm text-white disabled:opacity-50"
              >
                {isSubmitting && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? 'Отправка...' : 'Отправить'}
              </button>
            </div>
          </div>
        )}

        {showReviewForm && !isEditing && (
          <div className="pb-4">
            <div className="rounded-[24px] border border-amber-200 bg-amber-50 p-4">
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Комментарий к работе..."
                className="w-full rounded-xl border p-3 text-sm"
                rows={3}
              />

              <button
                onClick={handleReview}
                className="mt-3 rounded-xl bg-slate-950 px-4 py-2 text-sm text-white"
              >
                Завершить проверку
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
