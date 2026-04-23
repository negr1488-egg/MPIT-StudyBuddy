import type { TrackerUser } from '../types/user';

export const trackerStudent: TrackerUser = {
  id: 'student-artem',
  name: 'Артём',
  role: 'student',
  subtitle: 'Ученик 8Б класса',
};

export const trackerTeacher: TrackerUser = {
  id: 'teacher-sergeeva',
  name: 'Марина Сергеева',
  role: 'teacher',
  subtitle: 'Учитель математики',
};

export const trackerParent: TrackerUser = {
  id: 'parent-petrova',
  name: 'Ольга Петрова',
  role: 'parent',
  subtitle: 'Мама Артёма',
};

export const trackerUsers = {
  student: trackerStudent,
  teacher: trackerTeacher,
  parent: trackerParent,
};
