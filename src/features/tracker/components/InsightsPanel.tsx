import React from 'react';
import type { AnalyticsSummary } from '../types/notification';

type InsightSeverity = 'low' | 'medium' | 'high';
interface InsightItem { id: string; title: string; description: string; severity: InsightSeverity; }
interface SubjectInsight { weakestSubject: string; strongestSubject: string; overdueCount: number; completedCount: number; }
interface InsightsPanelProps {
  title?: string;
  description?: string;
  insights?: InsightItem[];
  subjectInsight?: Partial<SubjectInsight> | null;
  analytics?: Partial<AnalyticsSummary> | null;
  isLoading?: boolean;
}
const severityStyles: Record<InsightSeverity, string> = {
  low: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  medium: 'border-amber-200 bg-amber-50 text-amber-900',
  high: 'border-rose-200 bg-rose-50 text-rose-900',
};
export function InsightsPanel({ title = 'AI-инсайты', description = 'Краткая аналитика по задачам, прогрессу и зонам внимания.', insights = [], subjectInsight, analytics, isLoading = false }: InsightsPanelProps) {
  const safeSubjectInsight: SubjectInsight = {
    weakestSubject: subjectInsight?.weakestSubject ?? analytics?.weakestSubject ?? 'Пока недостаточно данных',
    strongestSubject: subjectInsight?.strongestSubject ?? 'Пока недостаточно данных',
    overdueCount: subjectInsight?.overdueCount ?? analytics?.overdueSubjects?.length ?? 0,
    completedCount: subjectInsight?.completedCount ?? analytics?.reviewQueueCount ?? 0,
  };
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5"><h2 className="text-lg font-semibold text-slate-900">{title}</h2><p className="mt-1 text-sm text-slate-500">{description}</p></div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="text-xs font-medium uppercase tracking-wide text-slate-500">Слабая зона</p><p className="mt-2 text-base font-semibold text-slate-900">{safeSubjectInsight.weakestSubject}</p><p className="mt-2 text-sm text-slate-600">Просроченных задач: {safeSubjectInsight.overdueCount}</p></div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="text-xs font-medium uppercase tracking-wide text-slate-500">Сильная зона</p><p className="mt-2 text-base font-semibold text-slate-900">{safeSubjectInsight.strongestSubject}</p><p className="mt-2 text-sm text-slate-600">Выполнено задач: {safeSubjectInsight.completedCount}</p></div>
      </div>
      {analytics && <div className="mt-4 grid gap-3 md:grid-cols-3"><div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600"><p className="font-medium text-slate-900">Завтра</p><p className="mt-2">Задач на завтра: {analytics.tomorrowCount ?? 0}</p></div><div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600"><p className="font-medium text-slate-900">Загруженный день</p><p className="mt-2">{analytics.busiestWeekday ?? 'Недостаточно данных'}</p></div><div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600"><p className="font-medium text-slate-900">Очередь на обзор</p><p className="mt-2">{analytics.reviewQueueCount ?? 0}</p></div></div>}
      <div className="mt-6 space-y-3">{isLoading ? Array.from({ length: 2 }).map((_, index) => <div key={index} className="animate-pulse rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="h-4 w-52 rounded bg-slate-200" /><div className="mt-3 h-3 w-full rounded bg-slate-200" /><div className="mt-2 h-3 w-3/4 rounded bg-slate-200" /></div>) : insights.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">Инсайты появятся, когда в системе будет больше данных по задачам и прогрессу.</div> : insights.map((item) => <div key={item.id} className={`rounded-2xl border p-4 ${severityStyles[item.severity]}`}><div className="flex items-start justify-between gap-3"><div><h3 className="text-sm font-semibold">{item.title}</h3><p className="mt-1 text-sm opacity-90">{item.description}</p></div><span className="rounded-full bg-white/70 px-2.5 py-1 text-xs font-medium">{item.severity === 'high' ? 'Высокий приоритет' : item.severity === 'medium' ? 'Средний приоритет' : 'Низкий приоритет'}</span></div></div>)}</div>
    </section>
  );
}
