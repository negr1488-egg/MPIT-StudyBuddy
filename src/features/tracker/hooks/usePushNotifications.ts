import { useEffect, useRef } from 'react'

const PUSH_ENABLED_KEY = 'studybuddy.push.enabled'

export function disablePush() {
  localStorage.setItem(PUSH_ENABLED_KEY, 'false')

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then((registration) => {
      registration.getNotifications().then((items) => {
        items.forEach((item) => item.close())
      })
    })
  }
}

export default function usePushNotifications(notifications) {
  const shownRef = useRef(new Set())

  useEffect(() => {
    const enabled = localStorage.getItem(PUSH_ENABLED_KEY) === 'true'

    if (!enabled) return
    if (!notifications || notifications.length === 0) return
    if (Notification.permission !== 'granted') return
    if (!('serviceWorker' in navigator)) return

    navigator.serviceWorker.ready.then((registration) => {
      notifications.forEach((item) => {
        if (shownRef.current.has(item.id)) return

        shownRef.current.add(item.id)

        registration.showNotification(item.title, {
          body: item.body,
          tag: item.tag,
          icon: '/vite.svg'
        })
      })
    })
  }, [notifications])
}
