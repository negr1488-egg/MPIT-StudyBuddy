import { useEffect, useState } from 'react'
import { disablePush } from '../hooks/usePushNotifications'

const PUSH_ENABLED_KEY = 'studybuddy.push.enabled'

export default function PushNotificationToggle() {
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    setEnabled(localStorage.getItem(PUSH_ENABLED_KEY) === 'true')
  }, [])

  const enablePush = async () => {
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return

    if ('serviceWorker' in navigator) {
      await navigator.serviceWorker.register('/sw.js')
    }

    localStorage.setItem(PUSH_ENABLED_KEY, 'true')
    setEnabled(true)
  }

  const turnOffPush = () => {
    disablePush()
    setEnabled(false)
  }

  return (
    <button onClick={enabled ? turnOffPush : enablePush}>
      {enabled ? 'Отключить push' : 'Включить push'}
    </button>
  )
}
