import { trackerParent, trackerStudent } from '../mocks/users';

const STUDENT_INVITE_CODE_KEY = 'studybuddy.parent-link.student-code';
const PARENT_LINK_KEY = 'studybuddy.parent-link.active';

export interface ParentStudentLink {
  parentId: string;
  studentId: string;
  studentName: string;
  linkedAt: string;
  codeUsed: string;
}

function randomCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
}

export function getStudentInviteCode() {
  if (typeof window === 'undefined') {
    return `${trackerStudent.id}-CODE`;
  }

  const existing = window.localStorage.getItem(STUDENT_INVITE_CODE_KEY);
  if (existing) return existing;
  const next = randomCode();
  window.localStorage.setItem(STUDENT_INVITE_CODE_KEY, next);
  return next;
}

export function refreshStudentInviteCode() {
  const next = randomCode();
  if (typeof window !== 'undefined') window.localStorage.setItem(STUDENT_INVITE_CODE_KEY, next);
  return next;
}

export function getParentStudentLink(): ParentStudentLink | null {
  if (typeof window === 'undefined') return null;
  const rawValue = window.localStorage.getItem(PARENT_LINK_KEY);
  if (!rawValue) return null;
  try {
    return JSON.parse(rawValue) as ParentStudentLink;
  } catch {
    return null;
  }
}

export function linkParentToStudent(code: string) {
  const safeCode = code.trim().toUpperCase();
  const studentCode = getStudentInviteCode();

  if (!safeCode) {
    return { ok: false as const, message: 'Введите код ребёнка, чтобы выполнить привязку.' };
  }
  if (safeCode !== studentCode) {
    return { ok: false as const, message: 'Код не найден. Проверьте символы и попробуйте ещё раз.' };
  }

  const link: ParentStudentLink = {
    parentId: trackerParent.id,
    studentId: trackerStudent.id,
    studentName: trackerStudent.name,
    linkedAt: new Date().toISOString(),
    codeUsed: safeCode,
  };
  if (typeof window !== 'undefined') window.localStorage.setItem(PARENT_LINK_KEY, JSON.stringify(link));
  return { ok: true as const, link, message: 'Ребёнок успешно привязан к кабинету родителя.' };
}

export function unlinkParentFromStudent() {
  if (typeof window !== 'undefined') window.localStorage.removeItem(PARENT_LINK_KEY);
}
