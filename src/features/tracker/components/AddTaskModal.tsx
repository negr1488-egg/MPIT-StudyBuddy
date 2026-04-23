import React, { useEffect, useRef, useState } from 'react';
import { X, LoaderCircle, Paperclip, Trash2, Sparkles } from 'lucide-react';
import type { CreateTaskInput } from '../hooks/useTasks';
import type { TaskRoleOwner } from '../types/task';

interface AddTaskModalProps {
  open: boolean;
  onClose: () => void;
  onAddTask: (input: CreateTaskInput) => Promise<void>;
  defaultCreatedBy?: TaskRoleOwner;
  selectedStudentId?: string;
  students?: { id: string; full_name: string | null }[];
}

function formatStepsForDescription(steps: AiTaskStep[]) {
  if (!steps.length) return '';

  const lines = steps.map(
    (step, index) => `${index + 1}. ${step.title} (~${step.minutes} мин.)`
  );

  return ['Этапы выполнения:', ...lines].join('\n');
}

function mergeDescriptionWithSteps(description: string, steps: AiTaskStep[]) {
  const trimmedDescription = description.trim();
  const stepsBlock = formatStepsForDescription(steps);

  if (!stepsBlock) return trimmedDescription;

  const cleanedDescription = trimmedDescription
    .replace(/\n*\s*Этапы выполнения:\s*[\s\S]*$/i, '')
    .trim();

  if (!cleanedDescription) {
    return stepsBlock;
  }

  return `${cleanedDescription}\n\n${stepsBlock}`;
}

function toDatetimeLocalValue(isoString?: string) {
  if (!isoString) return '';

  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '';

  const timezoneOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 16);
}

function AddTaskModalComponent({
  open,
  onClose,
  onAddTask,
  defaultCreatedBy = 'student',
  selectedStudentId = '',
  students = [],
}: AddTaskModalProps) {
  const [rawInput, setRawInput] = useState('');
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [deadline, setDeadline] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [studentId, setStudentId] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [steps, setSteps] = useState<AiTaskStep[]>([]);
  const [stepsError, setStepsError] = useState('');
  const [stepsSource, setStepsSource] = useState<'gigachat' | 'fallback' | ''>('');

  const [isAiParsing, setIsAiParsing] = useState(false);
  const [aiError, setAiError] = useState('');

  const isTeacher = defaultCreatedBy === 'teacher';
  const rawInputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previousOpen = useRef(open);

  useEffect(() => {
    if (open && !previousOpen.current) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(18, 0, 0, 0);

      setRawInput('');
      setDeadline(tomorrow.toISOString().slice(0, 16));
      setError('');
      setTitle('');
      setSubject('');
      setPriority('medium');
      setDescription('');
      setFiles([]);
      setSteps([]);
      setStepsError('');
      setStepsSource('');
      setAiError('');
      setIsAiParsing(false);

      if (isTeacher) {
        setStudentId(selectedStudentId || (students.length > 0 ? students[0].id : ''));
      } else {
        setStudentId('');
      }

      setIsSubmitting(false);

      requestAnimationFrame(() => {
        rawInputRef.current?.focus();
      });
    }

    previousOpen.current = open;
  }, [open, isTeacher, selectedStudentId, students]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAiParseAndBuildSteps = async () => {
    if (!rawInput.trim()) {
      setAiError('Сначала вставь текст задания');
      return;
    }

    setAiError('');
    setStepsError('');
    setIsAiParsing(true);

    try {
      const parsed = await gigachatClient.parseTask(rawInput.trim());

      const parsedTitle = parsed.title?.trim() || '';
      const parsedSubject = parsed.subject?.trim() || '';
      const parsedDescription =
        parsed.description?.trim() || rawInput.trim();
      const parsedPriority = parsed.priority ?? 'medium';
      const parsedDeadline = parsed.deadline
        ? toDatetimeLocalValue(parsed.deadline)
        : deadline;

      setTitle(parsedTitle);
      setSubject(parsedSubject);
      setDescription(parsedDescription);
      setPriority(parsedPriority);
      if (parsedDeadline) {
        setDeadline(parsedDeadline);
      }

      const stepsResult = await gigachatClient.buildTaskSteps({
        title: parsedTitle,
        subject: parsedSubject,
        description: parsedDescription,
        deadline: parsed.deadline || (parsedDeadline ? new Date(parsedDeadline).toISOString() : ''),
      });

      setSteps(Array.isArray(stepsResult.steps) ? stepsResult.steps : []);
      setStepsSource(stepsResult.source ?? '');
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Не удалось распознать задачу через ИИ');
    } finally {
      setIsAiParsing(false);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError('Введите название');
      return;
    }

    if (!deadline) {
      setError('Укажите дедлайн');
      return;
    }

    if (isTeacher && !studentId) {
      setError('Выберите ученика');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      const finalDescription = mergeDescriptionWithSteps(description, steps);

      await onAddTask({
        title: title.trim(),
        subject: subject.trim() || undefined,
        description: finalDescription || undefined,
        deadline: new Date(deadline).toISOString(),
        priority,
        createdBy: defaultCreatedBy,
        studentId: isTeacher ? studentId : undefined,
        attachments: files,
      });

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось создать задачу');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/40 p-4 backdrop-blur-sm">
      <div className="my-6 w-full max-w-2xl rounded-[32px] border border-white/70 bg-white p-6 shadow-[0_30px_80px_rgba(15,23,42,0.18)]">
        <div className="flex items-start justify-between">
          <h2 className="text-2xl font-semibold">Новая задача</h2>
          <button
            onClick={onClose}
            className="rounded-2xl bg-slate-100 p-3 hover:bg-slate-200"
            disabled={isSubmitting || isAiParsing}
            aria-label="Закрыть"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {isTeacher && (
          <div className="mt-6 rounded-[28px] bg-slate-50 p-5">
            <label className="text-sm font-medium">Ученик</label>
            <select
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="mt-3 h-12 w-full rounded-2xl border bg-white px-4 focus:border-slate-400 focus:outline-none"
              disabled={isSubmitting || isAiParsing}
            >
              <option value="">Выберите</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.full_name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="mt-6">
          <label className="text-sm font-medium">Текст задания</label>
          <div className="mt-2 flex flex-wrap items-start gap-3">
            <textarea
              ref={rawInputRef}
              value={rawInput}
              onChange={(e) => setRawInput(e.target.value)}
              className="min-h-[110px] w-full rounded-2xl border p-4 focus:border-slate-400 focus:outline-none"
              placeholder="Вставь сюда текст задания, например: По алгебре решить номера 12–18 к пятнице и подготовиться к самостоятельной..."
              disabled={isSubmitting || isAiParsing}
            />

            <button
              type="button"
              onClick={handleAiParseAndBuildSteps}
              disabled={isSubmitting || isAiParsing}
              className="inline-flex items-center rounded-2xl bg-violet-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isAiParsing ? (
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              {isAiParsing ? 'ИИ обрабатывает...' : 'Распознать через ИИ'}
            </button>
          </div>

          {aiError && (
            <div className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              {aiError}
            </div>
          )}
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="text-sm font-medium">Название</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-2 h-12 w-full rounded-2xl border px-4 focus:border-slate-400 focus:outline-none"
              placeholder="Например: Домашнее задание"
              disabled={isSubmitting || isAiParsing}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Предмет</label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="mt-2 h-12 w-full rounded-2xl border px-4 focus:border-slate-400 focus:outline-none"
              placeholder="Математика"
              disabled={isSubmitting || isAiParsing}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Дедлайн</label>
            <input
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="mt-2 h-12 w-full rounded-2xl border px-4 focus:border-slate-400 focus:outline-none"
              disabled={isSubmitting || isAiParsing}
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-sm font-medium">Приоритет</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high')}
              className="mt-2 h-12 w-full rounded-2xl border px-4 focus:border-slate-400 focus:outline-none"
              disabled={isSubmitting || isAiParsing}
            >
              <option value="low">Низкий</option>
              <option value="medium">Средний</option>
              <option value="high">Высокий</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="text-sm font-medium">Описание</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-2 min-h-[100px] w-full rounded-2xl border p-4 focus:border-slate-400 focus:outline-none"
              placeholder="Подробности..."
              disabled={isSubmitting || isAiParsing}
            />

            {stepsError && (
              <div className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                {stepsError}
              </div>
            )}

            {steps.length > 0 && (
              <div className="mt-4 rounded-[24px] border border-violet-200 bg-violet-50 p-4">
                <div>
                  <p className="text-sm font-semibold text-violet-900">Этапы от ИИ</p>
                  <p className="text-xs text-violet-700">
                    Источник: {stepsSource === 'gigachat' ? 'GigaChat' : 'резервный сценарий'}
                  </p>
                </div>

                <div className="mt-3 space-y-2">
                  {steps.map((step, index) => (
                    <div
                      key={`${step.title}-${index}`}
                      className="rounded-2xl bg-white px-4 py-3 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm text-slate-800">
                          <span className="font-semibold">{index + 1}.</span> {step.title}
                        </p>
                        <span className="whitespace-nowrap rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                          ~{step.minutes} мин
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="text-sm font-medium">Прикрепить файлы</label>
            <div className="mt-2">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
                disabled={isSubmitting || isAiParsing}
              />

              <label
                htmlFor="file-upload"
                className="inline-flex h-11 cursor-pointer items-center justify-center rounded-2xl bg-slate-100 px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-200"
              >
                <Paperclip className="mr-2 h-4 w-4" />
                Выбрать файлы
              </label>

              {files.length > 0 && (
                <div className="mt-3 space-y-2">
                  {files.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2"
                    >
                      <span className="text-sm text-slate-700">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-rose-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting || isAiParsing}
            className="rounded-2xl bg-slate-100 px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-200 disabled:opacity-60"
          >
            Отмена
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || isAiParsing}
            className="inline-flex items-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? 'Создание...' : 'Создать задачу'}
          </button>
        </div>
      </div>
    </div>
  );
}

export const AddTaskModal = React.memo(AddTaskModalComponent);
