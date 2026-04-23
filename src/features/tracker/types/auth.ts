import type { TrackerRole } from './user';

export interface MockAccount {
  id: string;
  name: string;
  email: string;
  password: string;
  role: TrackerRole | null;
}

export interface MockSession {
  id: string;
  name: string;
  email: string;
  role: TrackerRole | null;
}
