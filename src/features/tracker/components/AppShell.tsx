import React, { useState, useRef, useEffect } from 'react'
import { AppSidebar } from './AppSidebar'
import { PushNotificationToggle } from './PushNotificationToggle'
import type { BrowserPushNotification } from '../hooks/usePushNotifications'
import type { MockSession } from '../types/auth'
import type { TrackerRole } from '../types/user'

interface AppShellProps {
  session: MockSession
  role: TrackerRole
  title: string
  subtitle: string
  onNavigate: (path: string) => void
  onLogout: () => void
  pushNotifications?: BrowserPushNotification[]
  children: React.ReactNode
}

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

const roleBadgeTone: Record<TrackerRole, string> = {
  student: 'bg-blue-100 text-blue-700',
  teacher: 'bg-emerald-100 text-emerald-700',
  parent: 'bg-amber-100 text-amber-700',
}

export function AppShell({
  session,
  role,
  title,
  subtitle,
  onNavigate,
  onLogout,
  pushNotifications = [],
  children,
}: AppShellProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
      <AppSidebar session={session} onNavigate={onNavigate} onLogout={onLogout} />

      <div className="min-w-0">
        {/* 🔥 ВАЖНО: высокий z-index */}
        <header className="relative z-50 mb-6 rounded-[30px] border border-white/70 bg-white/90 p-5 shadow-lg backdrop-blur md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-slate-950 md:text-3xl">
                {title}
              </h1>
              <p className="mt-2 text-sm text-slate-600">{subtitle}</p>
            </div>

            <div className="flex items-center gap-3 relative" ref={ref}>
              <span className={cn('rounded-full px-3 py-1 text-sm font-semibold', roleBadgeTone[role])}>
                {role === 'student' ? 'Ученик' : role === 'teacher' ? 'Учитель' : 'Родитель'}
              </span>

              <PushNotificationToggle notifications={pushNotifications} />

              {/* 🔔 */}
              <button
                onClick={() => setOpen(!open)}
                className="relative rounded-full bg-slate-100 p-2 hover:bg-slate-200"
              >
                🔔
                {pushNotifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1 rounded-full">
                    {pushNotifications.length}
                  </span>
                )}
              </button>

              <div className="rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-700">
                {session.name}
              </div>
            </div>
          </div>
        </header>

        {/* 🔥 ВАЖНО: fixed + высокий слой */}
        {open && (
          <div className="fixed top-20 right-6 z-[9999] w-80 max-h-[70vh] overflow-y-auto bg-white border rounded-xl shadow-2xl">
            {pushNotifications.length === 0 ? (
              <div className="p-4 text-sm text-slate-500">
                Нет уведомлений
              </div>
            ) : (
              pushNotifications.map((n) => (
                <div
                  key={n.id}
                  className="p-3 border-b last:border-b-0 hover:bg-slate-50"
                >
                  <div className="text-sm font-medium">{n.title}</div>
                  <div className="text-xs text-slate-500">{n.body}</div>
                </div>
              ))
            )}
          </div>
        )}

        {/* 🔥 Контент ниже всегда под уведомлениями */}
        <div className="relative z-0">
          {children}
        </div>
      </div>
    </div>
  )
}
