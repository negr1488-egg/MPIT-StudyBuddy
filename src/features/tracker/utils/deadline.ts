function startOfDay(date: Date) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

function endOfDay(date: Date) {
  const value = new Date(date);
  value.setHours(23, 59, 59, 999);
  return value;
}

export function toDate(value: string) {
  return new Date(value);
}

export function isToday(deadline: string, now = new Date()) {
  const date = toDate(deadline);
  return date >= startOfDay(now) && date <= endOfDay(now);
}

export function isTomorrow(deadline: string, now = new Date()) {
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return isToday(deadline, tomorrow);
}

export function isWithinUpcomingDays(deadline: string, days = 7, now = new Date()) {
  const date = toDate(deadline);
  const max = endOfDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() + days));
  return date > endOfDay(now) && date <= max;
}

export function isOverdue(deadline: string, now = new Date()) {
  return toDate(deadline).getTime() < now.getTime();
}

export function formatDeadline(deadline: string, locale = 'ru-RU') {
  const date = toDate(deadline);
  const now = new Date();

  if (isToday(deadline, now)) {
    return `Сегодня, ${date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}`;
  }

  if (isTomorrow(deadline, now)) {
    return `Завтра, ${date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}`;
  }

  return date.toLocaleString(locale, {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function toDateTimeLocalValue(value: string) {
  const date = toDate(value);
  const timezoneOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 16);
}
