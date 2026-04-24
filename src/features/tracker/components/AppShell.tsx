import React, { useState } from 'react'
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

  return (
    <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
      <AppSidebar session={session} onNavigate={onNavigate} onLogout={onLogout} />

      <div className="min-w-0">
        {/* 🔥 Подняли слой всей шапки */}
        <header className="relative z-[100] mb-6 rounded-[30px] border border-white/70 bg-white/85 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)] backdrop-blur md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm text-slate-500">StudyBuddy workspace</p>
              <h1 className="mt-2 text-2xl font-semibold text-slate-950 md:text-3xl">
                {title}
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">
                {subtitle}
              </p>
            </div>

            {/* 🔥 Подняли слой блока с колокольчиком */}
            <div className="flex flex-wrap items-center gap-3 relative z-[200]">
              <span className={cn('rounded-full px-3 py-1 text-sm font-semibold', roleBadgeTone[role])}>
                {role === 'student' ? 'Ученик' : role === 'teacher' ? 'Учитель' : 'Родитель'}
              </span>

              <PushNotificationToggle notifications={pushNotifications} />

              {/* 🔔 Колокольчик */}
              <div className="relative">
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

                {/* 🔥 Только увеличили z-index */}
                {open && (
                  <div className="absolute right-0 mt-2 w-72 bg-white border rounded-xl shadow-lg z-[9999]">
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
              </div>

              <div className="rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-700">
                {session.name}
              </div>
            </div>
          </div>
        </header>

        {/* Контент остаётся без изменений */}
        {children}
      </div>
    </div>
  )
}
