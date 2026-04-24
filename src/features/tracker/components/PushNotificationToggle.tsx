import React, { useEffect, useState } from 'react';
import usePushNotifications, { disablePush } from '../hooks/usePushNotifications';
import type { BrowserPushNotification } from '../hooks/usePushNotifications';

const PUSH_ENABLED_KEY = 'studybuddy.push.enabled';

interface PushNotificationToggleProps {
  notifications?: BrowserPushNotification[];
}

export function PushNotificationToggle({ notifications = [] }: PushNotificationToggleProps) {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    setEnabled(localStorage.getItem(PUSH_ENABLED_KEY) === 'true');
  }, []);

  usePushNotifications(notifications);

  const enablePush = async () => {
    if (!('Notification' in window)) {
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return;

    if ('serviceWorker' in navigator) {
      await navigator.serviceWorker.register('/sw.js');
    }

    localStorage.setItem(PUSH_ENABLED_KEY, 'true');
    setEnabled(true);
  };

  const turnOffPush = () => {
    disablePush();
    setEnabled(false);
  };

  return (
    <button onClick={enabled ? turnOffPush : enablePush}>
      {enabled ? 'Отключить push' : 'Включить push'}
    </button>
  );
}
