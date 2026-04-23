export const routes = {
  landing: '/',
  login: '/login',
  register: '/register',
  roleSelect: '/onboarding/role',
  studentApp: '/app/student',
  teacherApp: '/app/teacher',
  parentApp: '/app/parent',
} as const;

export const publicRoutes = [routes.landing, routes.login, routes.register, routes.roleSelect] as const;
export const appRoutes = [routes.studentApp, routes.teacherApp, routes.parentApp] as const;
export const allRoutes = [...publicRoutes, ...appRoutes] as const;
