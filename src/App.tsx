import React, { useEffect, useMemo, useState } from 'react';
import { LandingPage } from './features/tracker/pages/LandingPage';
import { LoginPage } from './features/tracker/pages/LoginPage';
import { RegisterPage } from './features/tracker/pages/RegisterPage';
import { RoleSelectPage } from './features/tracker/pages/RoleSelectPage';
import { StudentDashboardPage } from './features/tracker/pages/StudentDashboardPage';
import { TeacherDashboardPage } from './features/tracker/pages/TeacherDashboardPage';
import { ParentDashboardPage } from './features/tracker/pages/ParentDashboardPage';
import { PublicNavbar } from './features/tracker/components/PublicNavbar';
import { AppShell } from './features/tracker/components/AppShell';
import { useTasks } from './features/tracker/hooks/useTasks';
import { useSupabaseSession } from './features/tracker/hooks/useSupabaseSession';
import type { TrackerRole } from './features/tracker/types/user';
import type { BrowserPushNotification } from './features/tracker/hooks/usePushNotifications';
import { AppProviders } from './app/providers/AppProviders';
import { allRoutes, appRoutes, routes } from './shared/constants/routes';

function getPathname() {
  if (typeof window === 'undefined') return routes.landing;
  return window.location.pathname || routes.landing;
}

function navigate(path: string) {
  if (typeof window === 'undefined') return;
  if (window.location.pathname === path) return;

  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

function getRoleFromAppPath(pathname: string): TrackerRole | null {
  if (pathname === routes.studentApp) return 'student';
  if (pathname === routes.teacherApp) return 'teacher';
  if (pathname === routes.parentApp) return 'parent';
  return null;
}

function isAppPath(pathname: string) {
  return appRoutes.includes(pathname as (typeof appRoutes)[number]);
}

function isKnownPath(pathname: string) {
  return allRoutes.includes(pathname as (typeof allRoutes)[number]);
}

export default function App() {
  const [pathname, setPathname] = useState(getPathname);
  const tasksApi = useTasks();
  const auth = useSupabaseSession();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const syncPath = () => setPathname(getPathname());

    window.addEventListener('popstate', syncPath);

    return () => {
      window.removeEventListener('popstate', syncPath);
    };
  }, []);

  useEffect(() => {
    if (auth.isLoading) return;

    if (!isKnownPath(pathname)) {
      navigate(routes.landing);
      return;
    }

    if (pathname === routes.roleSelect) {
      if (!auth.session) {
        navigate(routes.register);
        return;
      }

      if (auth.session.role) {
        navigate(`/app/${auth.session.role}`);
      }

      return;
    }

    if (isAppPath(pathname)) {
      if (!auth.session) {
        navigate(routes.login);
        return;
      }

      if (!auth.session.role) {
        navigate(routes.roleSelect);
        return;
      }

      const sessionPath = `/app/${auth.session.role}`;
      if (pathname !== sessionPath) {
        navigate(sessionPath);
      }

      return;
    }

    if (auth.session) {
      if (!auth.session.role && pathname !== routes.roleSelect) {
        navigate(routes.roleSelect);
        return;
      }

      if (auth.session.role && (pathname === routes.login || pathname === routes.register)) {
        navigate(`/app/${auth.session.role}`);
      }
    }
  }, [pathname, auth.isLoading, auth.session]);

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const titleMap: Record<string, string> = {
      [routes.landing]: 'StudyBuddy',
      [routes.login]: 'StudyBuddy - Вход',
      [routes.register]: 'StudyBuddy - Регистрация',
      [routes.roleSelect]: 'StudyBuddy - Выбор роли',
      [routes.studentApp]: 'StudyBuddy - Кабинет ученика',
      [routes.teacherApp]: 'StudyBuddy - Кабинет учителя',
      [routes.parentApp]: 'StudyBuddy - Кабинет родителя',
    };

    document.title = titleMap[pathname] ?? 'StudyBuddy';
  }, [pathname]);

  const appRole = useMemo<TrackerRole>(() => {
    return getRoleFromAppPath(pathname) ?? auth.session?.role ?? 'student';
  }, [pathname, auth.session?.role]);

  const appMeta = useMemo(() => {
    switch (appRole) {
      case 'teacher':
        return {
          title: 'Кабинет учителя',
          subtitle:
            'Созданные задания, статусы по ученикам, очередь на проверку и более чистая рабочая зона без лишнего шума.',
        };
      case 'parent':
        return {
          title: 'Кабинет родителя',
          subtitle:
            'Прогресс ребенка, сигналы по рискам, достижения и понятная картина без перегруженного журнала.',
        };
      default:
        return {
          title: 'Кабинет ученика',
          subtitle:
            'Сегодняшние задачи, ближайшие дедлайны, просрочки и личный прогресс в одном рабочем ритме.',
        };
    }
  }, [appRole]);

  const pushNotifications = useMemo<BrowserPushNotification[]>(() => {
    if (!auth.session?.role) return [];

    const roleNotes = tasksApi.getNotificationsForRole(auth.session.role).map((item) => ({
      id: `${auth.session?.role}-${item.id}-${item.title}`,
      title: item.title,
      body: item.description,
      tag: `studybuddy-${auth.session?.role}-${item.id}`,
    }));

    const adaptiveNotes =
      auth.session.role === 'student'
        ? tasksApi.adaptiveReminders.slice(0, 3).map((item) => ({
            id: `student-reminder-${item.taskId}-${item.risk}-${item.nextReminderLabel}`,
            title: item.title,
            body: item.message,
            tag: `studybuddy-task-${item.taskId}`,
          }))
        : [];

    return [...adaptiveNotes, ...roleNotes];
  }, [auth.session?.role, tasksApi]);

  const handleLogout = async () => {
    await auth.logout();
    navigate(routes.landing);
  };

  const renderPublicPage = () => (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.14),transparent_28%),radial-gradient(circle_at_top_right,rgba(124,58,237,0.16),transparent_24%),radial-gradient(circle_at_bottom_left,rgba(245,158,11,0.12),transparent_20%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_48%,#f8fafc_100%)] px-4 py-5 text-slate-900 md:px-8">
      <div className="mx-auto max-w-7xl">
        <PublicNavbar currentPath={pathname} onNavigate={navigate} />

        {pathname === routes.landing && <LandingPage onNavigate={navigate} />}
        {pathname === routes.login && <LoginPage auth={auth} onNavigate={navigate} />}
        {pathname === routes.register && <RegisterPage auth={auth} onNavigate={navigate} />}
        {pathname === routes.roleSelect && <RoleSelectPage auth={auth} onNavigate={navigate} />}
      </div>
    </div>
  );

  const renderAppPage = () => {
    if (!auth.session) return null;

    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.12),transparent_22%),radial-gradient(circle_at_top_right,rgba(245,158,11,0.12),transparent_18%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_46%,#f8fafc_100%)] px-4 py-5 text-slate-900 md:px-6">
        <div className="mx-auto max-w-[1500px]">
          <AppShell
            session={auth.session}
            role={appRole}
            title={appMeta.title}
            subtitle={appMeta.subtitle}
            onNavigate={navigate}
            onLogout={() => {
              void handleLogout();
            }}
            pushNotifications={pushNotifications}
          >
            {pathname === routes.studentApp && (
              <StudentDashboardPage tasksApi={tasksApi} session={auth.session} />
            )}
            {pathname === routes.teacherApp && <TeacherDashboardPage tasksApi={tasksApi} />}
            {pathname === routes.parentApp && <ParentDashboardPage tasksApi={tasksApi} />}
          </AppShell>
        </div>
      </div>
    );
  };

  let content: React.ReactNode;

  if (auth.isLoading) {
    content = (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="rounded-3xl border border-slate-200 bg-white px-6 py-5 text-sm text-slate-600 shadow-[0_18px_50px_rgba(15,23,42,0.07)]">
          StudyBuddy восстанавливает сессию...
        </div>
      </div>
    );
  } else if (isAppPath(pathname)) {
    content = renderAppPage();
  } else {
    content = renderPublicPage();
  }

  return <AppProviders>{content}</AppProviders>;
}
