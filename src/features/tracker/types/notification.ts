import type { TrackerRole } from './user';

export type NotificationSeverity = 'info' | 'warning' | 'critical' | 'success';

export interface StudyNotification {
  id: string;
  role: TrackerRole | 'all';
  title: string;
  message: string;
  severity: NotificationSeverity;
}

export interface AiInsight {
  id: string;
  role: TrackerRole | 'all';
  label: string;
  text: string;
  tone: 'blue' | 'amber' | 'rose' | 'emerald';
}

export interface AnalyticsSummary {
  weakestSubject: string;
  busiestWeekday: string;
  tomorrowCount: number;
  overdueSubjects: string[];
  reviewQueueCount: number;
}
