import React from 'react';
import { AlertCircle, Bell, CheckCircle2, Clock3, Info } from 'lucide-react';

export type StudyNotification = {
  id: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical' | 'success';
};

interface NotificationFeedProps {
  title: string;
  description?: string;
  items: StudyNotification[];
  isLoading?: boolean;
}

function getSeverityIcon(severity: StudyNotification['severity']) {
  switch (severity) {
    case 'critical':
      return <AlertCircle className="h-4 w-4" />;
    case 'warning':
      return <Clock3 className="h-4 w-4" />;
    case 'success':
      return <CheckCircle2 className="h-4 w-4" />;
    default:
      return <Info className="h-4 w-4" />;
  }
}

function getSeverityTone(severity: StudyNotification['severity']) {
  switch (severity) {
    case 'critical':
      return 'border-red-200 bg-red-50 text-red-700';
    case 'warning':
      return 'border-amber-200 bg-amber-50 text-amber-700';
    case 'success':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700';
    default:
      return 'border-slate-200 bg-slate-50 text-slate-700';
  }
}

export function NotificationFeed({
  title,
  description,
  items,
  isLoading = false,
}: NotificationFeedProps) {
  return (
    <section className="rounded-[30px] border border-white/70 bg-white/85 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.07)] backdrop-blur md:p-6">
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
          <Bell className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-950">{title}</h3>
          {description ? (
            <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
          ) : null}
        </div>
      </div>

      {isLoading ? (
        <div className="mt-6 space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="h-20 animate-pulse rounded-3xl bg-slate-100"
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="mt-6 rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
          Пока нет новых уведомлений.
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className={`rounded-3xl border px-4 py-4 ${getSeverityTone(item.severity)}`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">{getSeverityIcon(item.severity)}</div>
                <div>
                  <p className="text-sm font-semibold">{item.title}</p>
                  <p className="mt-1 text-sm leading-6 opacity-90">{item.message}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}