import React, { useEffect, useRef, useState } from 'react';
import { X, LoaderCircle, Paperclip, Trash2, Sparkles, Mic, MicOff } from 'lucide-react';
import type { CreateTaskInput } from '../hooks/useTasks';
import type { TaskRoleOwner } from '../types/task';
// ✅ Импорт из нового AI-слоя (путь исправлен: ../../../services/ai)
import { parseTask, getTaskSteps } from '../../../services/ai';


type SpeechRecognitionResultItem = {
  transcript: string;
};

type SpeechRecognitionResultLike = {
  isFinal: boolean;
  0: SpeechRecognitionResultItem;
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: SpeechRecognitionResultLike;
  };
};

type SpeechRecognitionErrorEventLike = {
  error?: string;
};

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

type SpeechWindow = Window & {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
};

interface AiTaskStep {
  title: string;
  minutes: number;
}

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
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [steps, setSteps] = useState<AiTaskStep[]>([]);
  const [stepsError, setStepsError] = useState('');
  const [stepsSource, setStepsSource] = useState<'mistral' | 'fallback' | ''>('');

  const [isAiParsing, setIsAiParsing] = useState(false);
  const [aiError, setAiError] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState('');

  const isTeacher = defaultCreatedBy === 'teacher';
  const rawInputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const speechBaseRef = useRef('');
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
      setVoiceError('');
      setIsAiParsing(false);
      setIsListening(false);
      recognitionRef.current?.stop();
      recognitionRef.current = null;

      if (isTeacher) {
        const initialStudentId = selectedStudentId || (students.length > 0 ? students[0].id : '');
        setStudentId(initialStudentId);
        setSelectedStudentIds(initialStudentId ? [initialStudentId] : []);
      } else {
        setStudentId('');
        setSelectedStudentIds([]);
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


  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
      recognitionRef.current = null;
    };
  }, []);

  const getSpeechRecognitionConstructor = () => {
    if (typeof window === 'undefined') return null;

    const speechWindow = window as SpeechWindow;
    return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition ?? null;
  };

  const handleVoiceInput = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    if (typeof window !== 'undefined' && !window.isSecureContext && window.location.hostname !== 'localhost') {
      setVoiceError('Голосовой ввод работает только на HTTPS или localhost.');
      return;
    }

    const RecognitionClass = getSpeechRecognitionConstructor();

    if (!RecognitionClass) {
      setVoiceError('Голосовой ввод не поддерживается этим браузером. Попробуйте Chrome или Edge.');
      return;
    }

    setVoiceError('');

    const recognition = new RecognitionClass();
    let finalTranscript = '';

    speechBaseRef.current = rawInput.trimEnd();
    recognition.lang = 'ru-RU';
    recognition.continuous = !/Android|iPhone|iPad/i.test(navigator.userAgent);
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      let interimTranscript = '';

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const transcript = event.results[index][0]?.transcript ?? '';

        if (event.results[index].isFinal) {
          finalTranscript = `${finalTranscript} ${transcript}`.trim();
        } else {
          interimTranscript = `${interimTranscript} ${transcript}`.trim();
        }
      }

      const parts = [speechBaseRef.current, finalTranscript, interimTranscript].filter(Boolean);
      setRawInput(parts.join(' '));
    };

    recognition.onerror = (event) => {
      if (event.error === 'not-allowed') {
        setVoiceError('Браузер запретил доступ к микрофону. Разрешите микрофон в настройках сайта.');
      } else if (event.error === 'no-speech') {
        setVoiceError('Речь не распознана. Попробуйте сказать задание ещё раз.');
      } else {
        setVoiceError('Не удалось распознать речь. Попробуйте ещё раз.');
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    try {
      recognitionRef.current = recognition;
      recognition.start();
      setIsListening(true);
    } catch {
      recognitionRef.current = null;
      setIsListening(false);
      setVoiceError('Не удалось запустить голосовой ввод. Попробуйте ещё раз.');
    }
  };

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

  // ✅ Функция парсинга через ИИ — дедлайн больше не трогаем
  const handleAiParseAndBuildSteps = async () => {
    if (!rawInput.trim()) {
      setAiError('Сначала вставь текст задания');
      return;
    }

    setAiError('');
    setStepsError('');
    setIsAiParsing(true);

    try {
      const parsed = await parseTask(rawInput.trim());

      const parsedTitle = parsed.title?.trim() || '';
      const parsedSubject = parsed.subject?.trim() || '';
      const parsedDescription =
        parsed.description?.trim() || rawInput.trim();
      const parsedPriority = parsed.priority ?? 'medium';
      // ❗️❗️ Дедлайн не обновляем автоматически — пользователь вписывает его сам
      // Игнорируем parsed.deadline полностью

      setTitle(parsedTitle);
      setSubject(parsedSubject);
      setDescription(parsedDescription);
      setPriority(parsedPriority);
      // deadline не меняем!

      const stepsResult = await getTaskSteps({
        title: parsedTitle,
        subject: parsedSubject,
        description: parsedDescription,
        deadline: deadline || '', // передаём текущий дедлайн (если есть)
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

    if (isTeacher && selectedStudentIds.length === 0) {
      setError('Выберите хотя бы одного ученика');
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
        studentId: isTeacher ? selectedStudentIds[0] : undefined,
        studentIds: isTeacher ? selectedStudentIds : undefined,
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
    <div className="fixed inset-0 z-[10000] flex items-start justify-center overflow-y-auto bg-slate-950/40 p-4 backdrop-blur-sm">
      <div className="relative z-[10001] my-6 w-full max-w-2xl rounded-[32px] border border-white/70 bg-white p-6 shadow-[0_30px_80px_rgba(15,23,42,0.18)]">
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
            <label className="text-sm font-medium">Ученики</label>
            <p className="mt-1 text-xs text-slate-500">Можно назначить одно задание сразу нескольким ученикам.</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {students.length > 0 ? (
                students.map((s) => {
                  const checked = selectedStudentIds.includes(s.id);

                  return (
                    <label
                      key={s.id}
                      className={`flex cursor-pointer items-center gap-2 rounded-2xl border px-4 py-3 text-sm transition ${
                        checked
                          ? 'border-slate-900 bg-slate-900 text-white'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {
                          setSelectedStudentIds((current) => {
                            const next = current.includes(s.id)
                              ? current.filter((id) => id !== s.id)
                              : [...current, s.id];
                            setStudentId(next[0] ?? '');
                            return next;
                          });
                        }}
                        disabled={isSubmitting || isAiParsing}
                      />
                      <span>{s.full_name ?? 'Ученик'}</span>
                    </label>
                  );
                })
              ) : (
                <div className="rounded-2xl bg-white p-4 text-sm text-slate-500 sm:col-span-2">
                  Нет привязанных учеников
                </div>
              )}
            </div>
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
              onClick={handleVoiceInput}
              disabled={isSubmitting || isAiParsing}
              className={`inline-flex items-center rounded-2xl px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${
                isListening
                  ? 'bg-rose-600 text-white hover:bg-rose-700'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {isListening ? (
                <MicOff className="mr-2 h-4 w-4" />
              ) : (
                <Mic className="mr-2 h-4 w-4" />
              )}
              {isListening ? 'Остановить запись' : 'Голосовой ввод'}
            </button>

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

          {voiceError && (
            <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
              {voiceError}
            </div>
          )}

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
              placeholder="2026-04-25 18:00"
            />
            <p className="mt-1 text-xs text-slate-500">
              Введи полную дату с годом, например: <strong>2026-04-25 18:00</strong>
            </p>
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
                    {stepsSource === 'mistral' ? 'Mistral AI' : 'резервный сценарий'}
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
