import React, { useEffect, useMemo, useState } from 'react';
import usePushNotifications, { disablePush } from '../hooks/usePushNotifications';
import type { BrowserPushNotification } from '../hooks/usePushNotifications';

const PUSH_ENABLED_KEY = 'studybuddy.push.enabled';

type PushStatus = 'idle' | 'enabled' | 'disabled' | 'unsupported' | 'blocked' | 'insecure' | 'ios-install';

interface PushNotificationToggleProps {
  notifications?: BrowserPushNotification[];
}

function isIosDevice() {
  if (typeof navigator === 'undefined') return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

function isStandaloneMode() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(display-mode: standalone)').matches || (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
}

function getInitialStatus(): PushStatus {
  if (typeof window === 'undefined') return 'idle';
  if (!('Notification' in window) || !('serviceWorker' in navigator)) return 'unsupported';
  if (!window.isSecureContext) return 'insecure';
  if (isIosDevice() && !isStandaloneMode()) return 'ios-install';
  if (Notification.permission === 'denied') return 'blocked';
  return localStorage.getItem(PUSH_ENABLED_KEY) === 'true' ? 'enabled' : 'disabled';
}

export function PushNotificationToggle({ notifications = [] }: PushNotificationToggleProps) {
  const [enabled, setEnabled] = useState(false);
  const [status, setStatus] = useState<PushStatus>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const initialStatus = getInitialStatus();
    setStatus(initialStatus);
    setEnabled(initialStatus === 'enabled');
  }, []);

  usePushNotifications(notifications);

  const helperText = useMemo(() => {
    if (message) return message;
    if (status === 'unsupported') return 'Этот браузер не поддерживает push-уведомления.';
    if (status === 'insecure') return 'На телефоне уведомления работают только через HTTPS. Локальный IP по http не даст запросить разрешение.';
    if (status === 'ios-install') return 'На iPhone/iPad сначала добавьте сайт на экран Домой, затем откройте его как приложение и включите push.';
    if (status === 'blocked') return 'Разрешение заблокировано в настройках браузера. Разрешите уведомления для сайта вручную.';
    if (status === 'enabled') return 'Push включены.';
    return '';
  }, [message, status]);

  const enablePush = async () => {
    setMessage('');

    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      setStatus('unsupported');
      return;
    }

    if (!window.isSecureContext) {
      setStatus('insecure');
      return;
    }

    if (isIosDevice() && !isStandaloneMode()) {
      setStatus('ios-install');
      return;
    }

    const registration = await navigator.serviceWorker.register('/sw.js');
    await navigator.serviceWorker.ready;

    const permission = await Notification.requestPermission();

    if (permission === 'denied') {
      localStorage.setItem(PUSH_ENABLED_KEY, 'false');
      setEnabled(false);
      setStatus('blocked');
      return;
    }

    if (permission !== 'granted') {
      localStorage.setItem(PUSH_ENABLED_KEY, 'false');
      setEnabled(false);
      setStatus('disabled');
      setMessage('Разрешение не выдано. Нажмите ещё раз и разрешите уведомления в окне браузера.');
      return;
    }

    localStorage.setItem(PUSH_ENABLED_KEY, 'true');
    setEnabled(true);
    setStatus('enabled');

    registration.showNotification('StudyBuddy', {
      body: 'Push-уведомления включены.',
      tag: 'studybuddy-push-enabled',
      icon: '/vite.svg',
      badge: '/vite.svg',
    });
  };

  const turnOffPush = () => {
    disablePush();
    setEnabled(false);
    setStatus('disabled');
    setMessage('Push отключены для этого устройства.');
  };

  return (
    <div className="flex max-w-full flex-col items-start gap-1 sm:items-end">
      <button
        type="button"
        onClick={enabled ? turnOffPush : enablePush}
        className="inline-flex min-h-10 items-center justify-center rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 sm:px-4 sm:text-sm"
      >
        {enabled ? 'Отключить push' : 'Включить push'}
      </button>

      {helperText && (
        <p className="max-w-[260px] text-left text-[11px] leading-4 text-slate-500 sm:text-right">
          {helperText}
        </p>
      )}
    </div>
  );
}
