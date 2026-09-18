export type HistoryAction =
  | 'TASK_CREATED'
  | 'TASK_UPDATED'
  | 'STATUS_CHANGED'
  | 'ATTACHMENT_ADDED'
  | 'ATTACHMENT_REMOVED'
  | 'TASK_DELETED'
  | 'SYNC_STARTED'
  | 'SYNC_SUCCESS'
  | 'SYNC_FAILED';

export interface HistoryItem {
  id: string;
  taskId: string;
  action: HistoryAction;
  description: string;
  timestamp: string;
}