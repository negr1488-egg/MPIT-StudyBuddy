import React, { useEffect, useState } from 'react';
import { Copy, Link2, RefreshCcw, ShieldCheck } from 'lucide-react';
import { getParentStudentLink, getStudentInviteCode, refreshStudentInviteCode } from '../utils/parentLinking';

export function StudentInviteCodeCard() {
  const [inviteCode, setInviteCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [isLinked, setIsLinked] = useState(false);

  useEffect(() => {
    setInviteCode(getStudentInviteCode());
    setIsLinked(Boolean(getParentStudentLink()));
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  const handleRefresh = () => {
    setInviteCode(refreshStudentInviteCode());
    setCopied(false);
  };

  return (
    <section className="rounded-[30px] border border-white/70 bg-white/85 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.07)] backdrop-blur md:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Привязка родителя</p>
          <h2 className="mt-3 text-xl font-semibold text-slate-950 md:text-2xl">Код для родителя</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Передайте этот код родителю. После ввода кода в родительском кабинете появится ваш прогресс и сигналы по задачам.
          </p>
        </div>
        <div className={`rounded-2xl px-3 py-2 text-xs font-semibold ${isLinked ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
          {isLinked ? 'Родитель подключён' : 'Ожидает привязки'}
        </div>
      </div>

      <div className="mt-5 rounded-[28px] border border-slate-200 bg-slate-50 p-5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex min-h-14 items-center rounded-2xl bg-slate-950 px-5 text-2xl font-semibold tracking-[0.35em] text-white">
            {inviteCode || '------'}
          </div>
          <button type="button" onClick={() => void handleCopy()} className="inline-flex h-11 items-center justify-center rounded-2xl bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-100">
            <Copy className="mr-2 h-4 w-4" />
            {copied ? 'Скопировано' : 'Скопировать'}
          </button>
          <button type="button" onClick={handleRefresh} className="inline-flex h-11 items-center justify-center rounded-2xl bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-100">
            <RefreshCcw className="mr-2 h-4 w-4" />
            Обновить код
          </button>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
            <div className="flex items-center gap-2 font-medium text-slate-800"><Link2 className="h-4 w-4" />Как это работает</div>
            <p className="mt-2 leading-6">Родитель вводит код в своём кабинете и получает доступ к вашему прогрессу, просрочкам и задачам риска.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
            <div className="flex items-center gap-2 font-medium text-slate-800"><ShieldCheck className="h-4 w-4" />Безопасная привязка</div>
            <p className="mt-2 leading-6">При необходимости код можно обновить. Новый код заменит старый для следующей привязки.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
