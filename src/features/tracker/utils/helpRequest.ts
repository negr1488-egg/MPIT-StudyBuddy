export interface TaskHelpRequestState {
  request: string;
  requestedAt: string;
  response?: string;
  answeredAt?: string;
}

const HELP_REQUEST_PREFIX = 'studybuddy-help:';

export function parseTaskHelpRequest(value?: string | null): TaskHelpRequestState | null {
  if (!value || !value.startsWith(HELP_REQUEST_PREFIX)) return null;

  try {
    const parsed = JSON.parse(value.slice(HELP_REQUEST_PREFIX.length)) as Partial<TaskHelpRequestState>;
    if (!parsed.request || !parsed.requestedAt) return null;

    return {
      request: String(parsed.request),
      requestedAt: String(parsed.requestedAt),
      response: parsed.response ? String(parsed.response) : undefined,
      answeredAt: parsed.answeredAt ? String(parsed.answeredAt) : undefined,
    };
  } catch {
    return null;
  }
}

export function buildTaskHelpRequest(state: TaskHelpRequestState) {
  return `${HELP_REQUEST_PREFIX}${JSON.stringify(state)}`;
}
