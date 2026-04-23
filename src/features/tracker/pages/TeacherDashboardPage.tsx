import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  ClipboardCheck,
  Link2,
  Plus,
  Unlink,
  Users,
} from 'lucide-react';
import { AddTaskModal } from '../components/AddTaskModal';
import { AIChat } from '../components/AIChat';
import { InsightsPanel } from '../components/InsightsPanel';
import { NotificationFeed } from '../components/NotificationFeed';
import { TaskList } from '../components/TaskList';
import type { StudyNotification } from '../types/notification';
import type { UseTasksResult, RoleNotification } from '../hooks/useTasks';
import type { Task } from '../types/task';
import { useTeacherLinks } from '../hooks/useTeacherLinks';
import { supabase, isSupabaseEnabled } from '../../../shared/lib/supabase';

interface TeacherDashboardPageProps {
  tasksApi: UseTasksResult;
}

export function TeacherDashboardPage({ tasksApi }: TeacherDashboardPageProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [studentCode, setStudentCode] = useState('');
  const [linkMessage, setLinkMessage] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');

  const {
    students,
    hasStudents,
    isLoading: isLinksLoading,
    error: linksError,
    resetError,
    linkTeacherToStudent,
    unlinkTeacherFromStudent,
  } = useTeacherLinks();

  const selectedStudent = useMemo(
    () => students.find((student) => student.id === selectedStudentId) ?? null,
    [students, selectedStudentId]
  );

  const teacherTasks = useMemo(
    () => tasksApi.tasks.filter((task: Task) => task.createdBy === 'teacher'),
    [tasksApi.tasks]
  );

  const reviewQueue = useMemo(
    () => teacherTasks.filter((task: Task) => task.status === 'done' && !task.checkedAt),
    [teacherTasks]
  );

  const activeTeacherTasks = useMemo(
    () => teacherTasks.filter((task: Task) => task.status !== 'done'),
    [teacherTasks]
  );

  const completedTeacherTasks = useMemo(
    () => teacherTasks.filter((task: Task) => task.status === 'done' && Boolean(task.checkedAt)),
    [teacherTasks]
  );

  const teacherNotifications = tasksApi.getNotificationsForRole('teacher');
  const teacherFeedItems: StudyNotification[] = useMemo(
    () =>
      teacherNotifications.map((item: RoleNotification) => ({
        id: item.id,
        title: item.title,
        message: item.description,
        role: 'teacher',
        severity:
          item.type === 'overdue'
            ? 'critical'
            : item.type === 'done'
            ? 'success'
            : item.type === 'in_progress'
            ? 'warning'
            : 'info',
      })),
    [teacherNotifications]
  );

  const teacherInsights = tasksApi.getAiInsightsForRole('teacher');

  const handleOpenTaskModal = () => {
    if (!selectedStudentId && students.length > 0) {
      setSelectedStudentId(students[0].id);
    }
    setModalOpen(true);
  };

  const handleLinkStudent = async () => {
    setLinkMessage('');
    resetError();
    const normalizedCode = studentCode.trim();

    if (!normalizedCode) {
      setLinkMessage('Введите код ученика.');
      return;
    }
    if (!isSupabaseEnabled || !supabase) {
      setLinkMessage('Supabase не подключен.');
      return;
    }

    const { data: studentProfile, error } = await supabase
      .from('profiles')
      .select('id, full_name, role')
      .eq('invite_code', normalizedCode)
      .eq('role', 'student')
      .maybeSingle();

    if (error) {
      setLinkMessage(error.message);
      return;
    }
    if (!studentProfile) {
      setLinkMessage('Ученик с таким кодом не найден.');
      return;
    }

    const linked = await linkTeacherToStudent(studentProfile.id);
    if (!linked) {
      setLinkMessage('Не удалось привязать ученика.');
      return;
    }
    setSelectedStudentId(studentProfile.id);
    setStudentCode('');
    setLinkMessage(`Ученик ${studentProfile.full_name ?? 'без имени'} привязан.`);
  };

  const handleUnlinkStudent = async (studentId: string) => {
    setLinkMessage('');
    const ok = await unlinkTeacherFromStudent(studentId);
    if (!ok) {
      setLinkMessage('Не удалось отвязать ученика.');
      return;
    }
    if (selectedStudentId === studentId) {
      setSelectedStudentId('');
    }
    setLinkMessage('Ученик отвязан.');
  };

  return (
    <>
      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-[30px] border border-white/70 bg-white/85 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.07)] backdrop-blur md:p-6">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Teacher Dashboard</p>
          <h2 className="mt-3 text-2xl font-semibold text-slate-950 md:text-3xl">
            Кабинет учителя
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-600 md:text-base">
            Здесь видно, какие задания созданы, кто их выполняет и где нужны комментарии или проверка.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Создано</p>
              <p className="mt-2 text-3xl font-semibold text-slate-950">{teacherTasks.length}</p>
            </div>
            <div className="rounded-3xl bg-amber-50 p-4">
              <p className="text-sm text-amber-700">Нужно проверить</p>
              <p className="mt-2 text-3xl font-semibold text-amber-900">{reviewQueue.length}</p>
            </div>
            <div className="rounded-3xl bg-emerald-50 p-4">
              <p className="text-sm text-emerald-700">Проверено</p>
              <p className="mt-2 text-3xl font-semibold text-emerald-900">
                {completedTeacherTasks.length}
              </p>
            </div>
          </div>

          {/* Блок привязки учеников */}
          <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
            <div className="flex items-center gap-2">
              <Link2 className="h-4 w-4 text-slate-700" />
              <h3 className="text-base font-semibold text-slate-900">Привязка ученика</h3>
            </div>
            <p className="mt-2 text-sm text-slate-600">
              Введите код ученика, чтобы привязать его к себе и назначать ему задания.
            </p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <input
                value={studentCode}
                onChange={(e) => setStudentCode(e.target.value)}
                placeholder="Введите код ученика"
                className="h-11 flex-1 rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-slate-400"
              />
              <button
                onClick={handleLinkStudent}
                disabled={isLinksLoading}
                className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-950 px-4 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Link2 className="mr-2 h-4 w-4" />
                Привязать
              </button>
            </div>
            {(linkMessage || linksError) && (
              <div className="mt-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                {linksError || linkMessage}
              </div>
            )}
          </div>

          <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-slate-700" />
              <h3 className="text-base font-semibold text-slate-900">Мои ученики</h3>
            </div>
            {!hasStudents ? (
              <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-5 text-sm text-slate-500">
                Пока нет привязанных учеников. Сначала привяжите ученика по коду.
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {students.map((student) => {
                  const isSelected = selectedStudentId === student.id;
                  return (
                    <div
                      key={student.id}
                      className={`rounded-2xl border px-4 py-4 transition ${
                        isSelected
                          ? 'border-slate-900 bg-slate-900 text-white'
                          : 'border-slate-200 bg-white text-slate-900'
                      }`}
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="text-sm font-semibold">
                            {student.full_name ?? 'Ученик без имени'}
                          </p>
                          <p className={`mt-1 text-xs ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                            {student.role ?? 'student'}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => setSelectedStudentId(student.id)}
                            className={`inline-flex h-10 items-center justify-center rounded-2xl px-4 text-sm font-medium transition ${
                              isSelected
                                ? 'bg-white text-slate-950 hover:bg-slate-100'
                                : 'bg-slate-950 text-white hover:bg-slate-800'
                            }`}
                          >
                            Выбрать
                          </button>
                          <button
                            onClick={() => handleUnlinkStudent(student.id)}
                            className={`inline-flex h-10 items-center justify-center rounded-2xl px-4 text-sm font-medium transition ${
                              isSelected
                                ? 'border border-white/20 bg-transparent text-white hover:bg-white/10'
                                : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <Unlink className="mr-2 h-4 w-4" />
                            Отвязать
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={handleOpenTaskModal}
              disabled={!hasStudents}
              className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-950 px-4 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus className="mr-2 h-4 w-4" />
              Создать задание
            </button>
            {selectedStudent && (
              <div className="inline-flex h-11 items-center rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-700">
                Выбран ученик:
                <span className="ml-1 font-semibold">{selectedStudent.full_name}</span>
              </div>
            )}
          </div>
        </section>

        <NotificationFeed
          title="Уведомления учителя"
          description="StudyBuddy подсказывает, где уже нужен контроль, а где можно сосредоточиться на новых назначениях."
          items={teacherFeedItems}
          isLoading={tasksApi.isLoading}
        />
      </div>

      <div className="mt-6 space-y-6">
        <InsightsPanel
          title="AI-аналитика для учителя"
          description="Подсказки помогают понять, какой предмет или блок задач сейчас дает больше риска."
          insights={teacherInsights}
          isLoading={tasksApi.isLoading}
        />

        {/* AI‑чат */}
        <section className="rounded-[30px] border border-white/70 bg-white/80 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.07)] backdrop-blur">
          <AIChat />
        </section>

        <section className="rounded-[30px] border border-amber-200 bg-amber-50/60 p-1">
          <div className="mb-2 flex items-center gap-2 px-4 pt-4 text-amber-900">
            <ClipboardCheck className="h-5 w-5" />
            <span className="text-sm font-semibold">Самое важное сейчас</span>
          </div>
          <TaskList
            title="Нужно проверить"
            description="Задачи уже выполнены учеником и ожидают проверки учителя."
            tasks={reviewQueue}
            emptyText="Сейчас нет задач, ожидающих проверки."
            isLoading={tasksApi.isLoading}
            onStatusChange={tasksApi.updateTaskStatus}
            onReview={tasksApi.reviewTask}
            onEdit={tasksApi.editTask}
            onDelete={tasksApi.removeTask}
            showStudentMeta
          />
        </section>

        <TaskList
          title="Активные задания"
          description="Текущие задания, которые еще не завершены."
          tasks={activeTeacherTasks}
          emptyText="Активных задач пока нет."
          isLoading={tasksApi.isLoading}
          onStatusChange={tasksApi.updateTaskStatus}
          onReview={tasksApi.reviewTask}
          onEdit={tasksApi.editTask}
          onDelete={tasksApi.removeTask}
          showStudentMeta
        />

        <section className="rounded-[30px] border border-emerald-200 bg-emerald-50/60 p-1">
          <div className="mb-2 flex items-center gap-2 px-4 pt-4 text-emerald-900">
            <CheckCircle2 className="h-5 w-5" />
            <span className="text-sm font-semibold">Проверенные работы</span>
          </div>
          <TaskList
            title="Проверенные"
            description="Полностью завершенные и уже проверенные задания."
            tasks={completedTeacherTasks}
            emptyText="Проверенных заданий пока нет."
            isLoading={tasksApi.isLoading}
            onStatusChange={tasksApi.updateTaskStatus}
            onReview={tasksApi.reviewTask}
            onEdit={tasksApi.editTask}
            onDelete={tasksApi.removeTask}
            showStudentMeta
          />
        </section>
      </div>

      <AddTaskModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onAddTask={tasksApi.addTask}
        defaultCreatedBy="teacher"
        selectedStudentId={selectedStudentId}
        students={students}
      />
    </>
  );
}
