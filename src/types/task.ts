import { Attachment } from './attachment';

export type TaskStatus =
  | 'NEW'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export type SyncStatus =
  | 'PENDING'
  | 'SYNCED'
  | 'SYNC_FAILED';

export interface Location {
  address: string;
  latitude?: number;
  longitude?: number;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  location: Location;
  attachments: Attachment[];
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
  syncStatus: SyncStatus;
  remoteExists: boolean;
  notificationId?: string;
}