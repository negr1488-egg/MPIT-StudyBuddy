import React from 'react';
import { AlertTriangle, BellRing } from 'lucide-react';

interface ReminderBannerProps {
  overdueCount: number;
  todayCount: number;
  title?: string;
  description?: string;
}

export function ReminderBanner({ overdueCount, todayCount, title, description }: ReminderBannerProps) {
  const hasRisk = overdueCount > 0;
  return (
    <div className={`rounded-[30px] border p-5 shadow-[0_18px_40px_rgba(15,23,42,0.05)] ${hasRisk ? 'border-rose-200 bg-rose-50' : 'border-emerald-200 bg-emerald-50'}`}>
      <div className="flex items-start gap-3">
        <div className={`rounded-2xl p-3 ${hasRisk ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>{hasRisk ? <AlertTriangle className="h-5 w-5" /> : <BellRing className="h-5 w-5" />}</div>
        <div>
          <p className="text-sm font-semibold text-slate-900">{title ?? (hasRisk ? `Нужно вмешаться: просрочено ${overdueCount}` : `Хороший темп: на сегодня задач ${todayCount}`)}</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">{description ?? (hasRisk ? 'Трекер сразу поднимает просрочки наверх, чтобы ученик, родитель и учитель видели риск вовремя.' : 'Напоминания помогают держать фокус на ближайших дедлайнах и не терять темп по учебе.')}</p>
        </div>
      </div>
    </div>
  );
}
