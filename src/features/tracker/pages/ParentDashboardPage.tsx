import React, { useMemo } from 'react'
import type { TasksApi } from '../hooks/useTasks'
import { normalizeTask } from '../utils/normalizeTask'

interface Props {
  tasksApi: TasksApi
}

export function ParentDashboardPage({ tasksApi }: Props) {
  const tasks = tasksApi.tasks

  // 🔥 ИСПРАВЛЕНИЕ ЗДЕСЬ
  const normalized = useMemo(
    () => tasks.map((task) => normalizeTask(task)),
    [tasks]
  )

  const overdue = normalized.filter((t) => t.isOverdue)
  const inProgress = normalized.filter((t) => !t.isDone && !t.isOverdue)
  const completed = normalized.filter((t) => t.isDone)

  return (
    <div className="grid gap-6">
      {/* 📊 Статистика */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-2xl bg-red-50 p-4">
          <p className="text-sm text-red-500">Просрочено</p>
          <p className="text-2xl font-bold text-red-700">{overdue.length}</p>
        </div>

        <div className="rounded-2xl bg-yellow-50 p-4">
          <p className="text-sm text-yellow-500">В процессе</p>
          <p className="text-2xl font-bold text-yellow-700">{inProgress.length}</p>
        </div>

        <div className="rounded-2xl bg-green-50 p-4">
          <p className="text-sm text-green-500">Выполнено</p>
          <p className="text-2xl font-bold text-green-700">{completed.length}</p>
        </div>
      </div>

      {/* 📋 Список задач */}
      <div className="rounded-2xl border p-4">
        <h2 className="mb-4 text-lg font-semibold">Задачи ребёнка</h2>

        {normalized.length === 0 ? (
          <p className="text-sm text-gray-500">Нет задач</p>
        ) : (
          normalized.map((task) => (
            <div
              key={task.id}
              className="mb-3 rounded-xl border p-3 last:mb-0"
            >
              <p className="font-semibold">{task.title}</p>
              <p className="text-xs text-gray-500">{task.subject}</p>

              <div className="mt-2 flex justify-between text-xs">
                <span>
                  Дедлайн:{' '}
                  {task.deadline
                    ? new Date(task.deadline).toLocaleDateString()
                    : '—'}
                </span>

                <span
                  className={
                    task.isOverdue
                      ? 'text-red-500'
                      : task.isDone
                      ? 'text-green-500'
                      : 'text-yellow-500'
                  }
                >
                  {task.isDone
                    ? 'Выполнено'
                    : task.isOverdue
                    ? 'Просрочено'
                    : 'В процессе'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
