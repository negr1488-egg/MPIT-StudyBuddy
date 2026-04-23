import React, { useEffect, useRef, useState } from 'react';
import { X, LoaderCircle, Paperclip, Trash2, Sparkles } from 'lucide-react';
import type { CreateTaskInput } from '../hooks/useTasks';
import type { TaskRoleOwner } from '../types/task';
// ✅ Добавлены новые функции
import { parseTask, getTaskSteps } from '../../services/ai';

// ... интерфейс AiTaskStep должен быть определён, допустим так:
interface AiTaskStep {
  title: string;
  minutes: number;
}

// ... остальные интерфейсы и функции formatStepsForDescription, mergeDescriptionWithSteps, toDatetimeLocalValue остаются без изменений

function AddTaskModalComponent({
  open,
  onClose,
  onAddTask,
  defaultCreatedBy = 'student',
  selectedStudentId = '',
  students = [],
}: AddTaskModalProps) {
  // ... все состояния без изменений

  // ✅ Исправлена функция парсинга и получения шагов
  const handleAiParseAndBuildSteps = async () => {
    if (!rawInput.trim()) {
      setAiError('Сначала вставь текст задания');
      return;
    }

    setAiError('');
    setStepsError('');
    setIsAiParsing(true);

    try {
      // ✅ Вместо gigachatClient.parseTask
      const parsed = await parseTask(rawInput.trim());

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

      // ✅ Вместо gigachatClient.buildTaskSteps
      const stepsResult = await getTaskSteps({
        title: parsedTitle,
        subject: parsedSubject,
        description: parsedDescription,
        deadline: parsed.deadline || (parsedDeadline ? new Date(parsedDeadline).toISOString() : ''),
      });

      setSteps(Array.isArray(stepsResult.steps) ? stepsResult.steps : []);
      // ✅ Теперь источник может быть 'mistral' или 'fallback', меняем тип
      setStepsSource(stepsResult.source ?? '');
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Не удалось распознать задачу через ИИ');
    } finally {
      setIsAiParsing(false);
    }
  };

  // ... внутри JSX, где отображается источник:
  {steps.length > 0 && (
    <div className="mt-4 rounded-[24px] border border-violet-200 bg-violet-50 p-4">
      <div>
        <p className="text-sm font-semibold text-violet-900">Этапы от ИИ</p>
        <p className="text-xs text-violet-700">
          {/* ✅ Показываем источник: Mistral или резервный сценарий */}
          {stepsSource === 'mistral' ? 'Mistral AI' : 'резервный сценарий'}
        </p>
      </div>
      {/* ... остальное */}
    </div>
  )}
  // ...
}
