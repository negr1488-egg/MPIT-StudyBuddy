export type TrackerRole = 'student' | 'teacher' | 'parent';

export interface TrackerUser {
  id: string;
  name: string;
  role: TrackerRole;
  subtitle: string;
}
