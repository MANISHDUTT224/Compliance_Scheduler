export interface Task {
  id: string;
  heading: string;
  description: string;
  dueDate: Date;
  peopleInvolved: string[];
  reminders: Reminder[];
  notes: string;
  files: TaskFile[];
  status: 'in-progress' | 'complete' | 'overdue';
  priority: 'low' | 'medium' | 'high' | 'critical';
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  category: string;
}

export interface Reminder {
  id: string;
  type: 'email' | 'notification';
  timing: number; // days before due date
  sent: boolean;
}

export interface TaskFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'member';
}

export interface AppSettings {
  darkMode: boolean;
  emailNotifications: boolean;
  defaultView: 'dashboard' | 'table' | 'calendar';
  reminderDefaults: number[];
}

export type ViewType = 'dashboard' | 'table' | 'calendar' | 'reports' | 'settings' | 'team';
export type FilterType = 'all' | 'in-progress' | 'complete' | 'overdue';
export type SortType = 'dueDate' | 'priority' | 'status' | 'heading';