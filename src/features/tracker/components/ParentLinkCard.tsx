import React, { useState } from 'react';
import { CheckCircle2, Link2, Unplug, X, Plus } from 'lucide-react';
import { useParentLinks } from '../hooks/useParentLinks';
import { supabase } from '../../../shared/lib/supabase';

interface ParentLinkCardProps {
  onLinked?: () => void;
  onUnlinked?: () => void;
  onClose?: () => void;
}

export function ParentLinkCard({ onLinked, onUnlinked, onClose }: ParentLinkCardProps) {
  const [inputCode, setInputCode] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isLinking, setIsLinking] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  const {
    children,
    isLoading,
    error: linkError,
    linkParentToStudent,
    unlinkParentFromStudent,
    loadChildrenForParent,
  } = useParentLinks();

  const handleLink = async () => {
    const normalizedCode = inputCode.trim().toUpperCase();
    if (!normalizedCode) {
      setFeedback({ type: 'error', text: 'Введите код ученика' });
      return;
    }

    setIsLinking(true);
    setFeedback(null);

    try {
      const { data: studentProfile, error } = await supabase!
        .from('profiles')
        .select('id, full_name, role')
        .eq('invite_code', normalizedCode)
        .eq('role', 'student')
        .maybeSingle();

      if (error) throw error;
      if (!studentProfile) {
        setFeedback({ type: 'error', text: 'Код не найден. Проверьте символы и попробуйте ещё раз.' });
        return;
      }

      // Проверяем, не привязан ли уже этот ребёнок
      const alreadyLinked = children.some((child) => child.id === studentProfile.id);
      if (alreadyLinked) {
        setFeedback({ type: 'error', text: 'Этот ребёнок уже привязан к вам.' });
        return;
      }

      const linked = await linkParentToStudent(studentProfile.id);
      if (!linked) {
        setFeedback({ type: 'error', text: linkError || 'Не удалось привязать ученика' });
        return;
      }

      setFeedback({ type: 'success', text: `Ученик ${studentProfile.full_name ?? 'без имени'} привязан` });
      setInputCode('');
      setShowAddForm(false);
      onLinked?.();
      await loadChildrenForParent();
    } catch (err) {
      setFeedback({ type: 'error', text: err instanceof Error ? err.message : 'Ошибка привязки' });
    } finally {
      setIsLinking(false);
    }
  };

  const handleUnlink = async (studentId: string) => {
    const ok = await unlinkParentFromStudent(studentId);
    if (ok) {
      setFeedback({ type: 'success', text: 'Связь с ребёнком удалена' });
      onUnlinked?.();
      await loadChildrenForParent();
    } else {
      setFeedback({ type: 'error', text: linkError || 'Не удалось отвязать' });
    }
  };

  if (isLoading) {
    return (
      <section className="rounded-[30px] border border-white/70 bg-white/85 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.07)] backdrop-blur md:p-6">
        <p className="text-sm text-slate-500">Загрузка привязки...</p>
      </section>
    );
  }

  return (
    <section className="rounded-[30px] border border-white/70 bg-white/85 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.07)] backdrop-blur md:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Привязка детей</p>
          <h2 className="mt-3 text-xl font-semibold text-slate-950 md:text-2xl">Управление детьми</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Вы можете привязать несколько детей, вводя их индивидуальные коды.
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="rounded-2xl p-2 text-slate-500 hover:bg-slate-100"
            aria-label="Закрыть"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Список уже привязанных детей */}
      {children.length > 0 && (
        <div className="mt-5 space-y-3">
          <p className="text-sm font-medium text-slate-700">Привязанные дети:</p>
          {children.map((child) => (
            <div
              key={child.id}
              className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 p-4"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span className="font-medium text-slate-900">{child.full_name ?? 'Ребёнок'}</span>
              </div>
              <button
                onClick={() => handleUnlink(child.id)}
                className="inline-flex h-9 items-center justify-center rounded-xl bg-white px-3 text-sm font-medium text-rose-600 transition hover:bg-rose-50"
              >
                <Unplug className="mr-1.5 h-3.5 w-3.5" />
                Отвязать
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Форма добавления нового ребёнка */}
      {!showAddForm ? (
        <button
          onClick={() => setShowAddForm(true)}
          className="mt-5 inline-flex h-11 items-center justify-center rounded-2xl bg-slate-100 px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-200"
        >
          <Plus className="mr-2 h-4 w-4" />
          Добавить ребёнка
        </button>
      ) : (
        <div className="mt-5 rounded-[28px] border border-slate-200 bg-slate-50 p-5">
          <div className="flex flex-col gap-3 md:flex-row">
            <input
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value.toUpperCase())}
              placeholder="Введите код ученика"
              className="h-12 flex-1 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium tracking-[0.18em] text-slate-900 outline-none transition focus:border-slate-400"
              disabled={isLinking}
            />
            <button
              onClick={handleLink}
              disabled={isLinking}
              className="inline-flex h-12 items-center justify-center rounded-2xl bg-slate-950 px-5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Link2 className="mr-2 h-4 w-4" />
              {isLinking ? 'Привязка...' : 'Привязать'}
            </button>
            <button
              onClick={() => {
                setShowAddForm(false);
                setInputCode('');
                setFeedback(null);
              }}
              className="inline-flex h-12 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Отмена
            </button>
          </div>
          <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-sm leading-6 text-slate-500">
            Код можно найти в кабинете ученика в карточке «Код для родителя».
          </div>
        </div>
      )}

      {feedback && (
        <div
          className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${
            feedback.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-rose-200 bg-rose-50 text-rose-700'
          }`}
        >
          {feedback.text}
        </div>
      )}

      {linkError && !feedback && (
        <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {linkError}
        </div>
      )}
    </section>
  );
}