import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Bell, CheckCheck, X } from 'lucide-react';
import { AppSidebar } from './AppSidebar';
import { PushNotificationToggle } from './PushNotificationToggle';
import type { BrowserPushNotification } from '../hooks/usePushNotifications';
import type { MockSession } from '../types/auth';
import type { TrackerRole } from '../types/user';

interface AppShellProps {
  session: MockSession;
  role: TrackerRole;
  title: string;
  subtitle: string;
  onNavigate: (path: string) => void;
  onLogout: () => void;
  pushNotifications?: BrowserPushNotification[];
  children: React.ReactNode;
}

const READ_NOTIFICATIONS_KEY = 'studybuddy.notifications.read';

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function readStoredNotificationIds() {
  try {
    const raw = localStorage.getItem(READ_NOTIFICATIONS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

function saveStoredNotificationIds(ids: string[]) {
  localStorage.setItem(READ_NOTIFICATIONS_KEY, JSON.stringify(ids));
}

function playNotificationSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const context = new AudioContextClass();
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, context.currentTime);
    oscillator.frequency.setValueAtTime(660, context.currentTime + 0.09);
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.08, context.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.22);

    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.24);
  } catch {
    return;
  }
}

const roleBadgeTone: Record<TrackerRole, string> = {
  student: 'bg-blue-100 text-blue-700',
  teacher: 'bg-emerald-100 text-emerald-700',
  parent: 'bg-amber-100 text-amber-700',
};

export function AppShell({ session, role, title, subtitle, onNavigate, onLogout, pushNotifications = [], children }: AppShellProps) {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [readIds, setReadIds] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    return readStoredNotificationIds();
  });
  const previousUnreadCountRef = useRef(0);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const readIdSet = useMemo(() => new Set(readIds), [readIds]);
  const unreadNotifications = useMemo(
    () => pushNotifications.filter((item) => !readIdSet.has(item.id)),
    [pushNotifications, readIdSet]
  );
  const unreadCount = unreadNotifications.length;

  useEffect(() => {
    if (unreadCount > previousUnreadCountRef.current) {
      playNotificationSound();
    }

    previousUnreadCountRef.current = unreadCount;
  }, [unreadCount]);

  useEffect(() => {
    if (!isNotificationsOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!dropdownRef.current) return;
      if (dropdownRef.current.contains(event.target as Node)) return;
      setIsNotificationsOpen(false);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsNotificationsOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isNotificationsOpen]);

  const markAllAsRead = () => {
    const nextIds = Array.from(new Set([...readIds, ...pushNotifications.map((item) => item.id)]));
    setReadIds(nextIds);
    saveStoredNotificationIds(nextIds);
  };

  const markAsRead = (id: string) => {
    if (readIds.includes(id)) return;

    const nextIds = [...readIds, id];
    setReadIds(nextIds);
    saveStoredNotificationIds(nextIds);
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
      <AppSidebar session={session} onNavigate={onNavigate} onLogout={onLogout} />

      <div className="min-w-0">
        {/* 🔥 подняли слой */}
        <header className="relative z-[100] mb-6 rounded-[30px] border border-white/70 bg-white/85 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)] backdrop-blur md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm text-slate-500">StudyBuddy workspace</p>
              <h1 className="mt-2 text-2xl font-semibold text-slate-950 md:text-3xl">{title}</h1>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">{subtitle}</p>
            </div>

            {/* 🔥 подняли слой */}
            <div className="relative z-[200] flex flex-wrap items-center gap-3">
              <span className={cn('rounded-full px-3 py-1 text-sm font-semibold', roleBadgeTone[role])}>
                {role === 'student' ? 'Ученик' : role === 'teacher' ? 'Учитель' : 'Родитель'}
              </span>

              <PushNotificationToggle notifications={pushNotifications} />

              {/* 🔥 подняли слой */}
              <div className="relative z-[300]" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsNotificationsOpen((value) => !value)}
                  className={cn(
                    'relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50',
                    unreadCount > 0 && 'animate-pulse border-red-200 bg-red-50 text-red-600'
                  )}
                >
                  <Bell className="h-5 w-5" />

                  {unreadCount > 0 && (
                    <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-red-500 px-1.5 py-0.5 text-[11px] font-bold text-white">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>

                {isNotificationsOpen && (
                  <div className="absolute right-0 z-[9999] mt-3 w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.18)]">
                    <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-950">Уведомления</p>
                        <p className="text-xs text-slate-500">
                          {unreadCount > 0 ? `Новых: ${unreadCount}` : 'Новых уведомлений нет'}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {pushNotifications.length > 0 && (
                          <button
                            type="button"
                            onClick={markAllAsRead}
                            className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                          >
                            <CheckCheck className="h-3.5 w-3.5" />
                            Прочитано
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setIsNotificationsOpen(false)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="max-h-96 overflow-y-auto p-2">
                      {pushNotifications.length === 0 ? (
                        <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">Нет уведомлений</div>
                      ) : (
                        pushNotifications.map((item) => {
                          const isRead = readIdSet.has(item.id);

                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => markAsRead(item.id)}
                              className={cn(
                                'mb-2 w-full rounded-2xl border p-3 text-left hover:bg-slate-50',
                                isRead ? 'border-slate-100 bg-white opacity-70' : 'border-blue-100 bg-blue-50/70'
                              )}
                            >
                              <p className="text-sm font-semibold">{item.title}</p>
                              <p className="text-xs text-slate-600">{item.body}</p>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-700">{session.name}</div>
            </div>
          </div>
        </header>

        {children}
      </div>
    </div>
  );
}
