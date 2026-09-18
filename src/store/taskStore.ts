import { create } from 'zustand';
import * as Crypto from 'expo-crypto';

import { HistoryItem, Task, TaskStatus } from '../types';
import { storageService } from '../services/storage/storageService';
import { syncService } from '../services/sync/syncService';

interface TaskStore {
  tasks: Task[];
  history: HistoryItem[];
  isLoading: boolean;
  error: string | null;

  loadData: () => Promise<void>;

  createTask: (task: Task) => Promise<void>;
  updateTask: (task: Task) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  changeStatus: (
    taskId: string,
    status: TaskStatus,
  ) => Promise<void>;

  syncTasks: () => Promise<void>;
  clearError: () => void;
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  history: [],
  isLoading: false,
  error: null,

  loadData: async () => {
    set({
      isLoading: true,
      error: null,
    });

    try {
      const [tasks, history] = await Promise.all([
        storageService.getTasks(),
        storageService.getHistory(),
      ]);

      set({
        tasks,
        history,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error(
        'Failed to load local data:',
        error,
      );

      set({
        isLoading: false,
        error: 'Failed to load local data.',
      });
    }
  },

  syncTasks: async () => {
    try {
      await syncService.sync(async () => {
        const [tasks, history] = await Promise.all([
          storageService.getTasks(),
          storageService.getHistory(),
        ]);

        set({
          tasks,
          history,
        });
      });
    } catch (error) {
      console.error(
        'Failed to sync tasks:',
        error,
      );

      set({
        error: 'Failed to synchronize tasks.',
      });
    }
  },

  createTask: async (task) => {
    try {
      set({ error: null });

      const historyItems: HistoryItem[] = [
        {
          id: Crypto.randomUUID(),
          taskId: task.id,
          action: 'TASK_CREATED',
          description: `Task "${task.title}" was created`,
          timestamp: new Date().toISOString(),
        },
      ];

      if (task.attachments.length > 0) {
        historyItems.push({
          id: Crypto.randomUUID(),
          taskId: task.id,
          action: 'ATTACHMENT_ADDED',
          description: 'Attachment was added',
          timestamp: new Date().toISOString(),
        });
      }

      const tasks = [
        ...get().tasks,
        {
          ...task,
          remoteExists: false,
        },
      ];

      const history = [
        ...get().history,
        ...historyItems,
      ];

      await storageService.saveTasks(tasks);
      await storageService.saveHistory(history);

      set({
        tasks,
        history,
      });

      await get().syncTasks();
    } catch (error) {
      console.error(
        'Failed to create task:',
        error,
      );

      set({
        error: 'Failed to create task.',
      });

      throw error;
    }
  },

  updateTask: async (updatedTask) => {
    try {
      set({ error: null });

      const currentTask = get().tasks.find(
        (task) => task.id === updatedTask.id,
      );

      if (!currentTask) {
        return;
      }

      const taskToSave: Task = {
        ...updatedTask,
        remoteExists: currentTask.remoteExists,
        syncStatus: 'PENDING',
        updatedAt: new Date().toISOString(),
      };

      const tasks = get().tasks.map((task) =>
        task.id === taskToSave.id
          ? taskToSave
          : task,
      );

      let history = [...get().history];

      const attachmentWasAdded =
        currentTask.attachments.length === 0 &&
        taskToSave.attachments.length > 0;

      const attachmentWasRemoved =
        currentTask.attachments.length > 0 &&
        taskToSave.attachments.length === 0;

      const attachmentWasChanged =
        currentTask.attachments.length > 0 &&
        taskToSave.attachments.length > 0 &&
        currentTask.attachments[0].id !==
          taskToSave.attachments[0].id;

      if (attachmentWasAdded) {
        history.push({
          id: Crypto.randomUUID(),
          taskId: taskToSave.id,
          action: 'ATTACHMENT_ADDED',
          description: 'Attachment was added',
          timestamp: new Date().toISOString(),
        });
      }

      if (attachmentWasRemoved) {
        history.push({
          id: Crypto.randomUUID(),
          taskId: taskToSave.id,
          action: 'ATTACHMENT_REMOVED',
          description: 'Attachment was removed',
          timestamp: new Date().toISOString(),
        });
      }

      if (attachmentWasChanged) {
        history.push({
          id: Crypto.randomUUID(),
          taskId: taskToSave.id,
          action: 'ATTACHMENT_REMOVED',
          description: 'Previous attachment was removed',
          timestamp: new Date().toISOString(),
        });

        history.push({
          id: Crypto.randomUUID(),
          taskId: taskToSave.id,
          action: 'ATTACHMENT_ADDED',
          description: 'New attachment was added',
          timestamp: new Date().toISOString(),
        });
      }

      history.push({
        id: Crypto.randomUUID(),
        taskId: taskToSave.id,
        action: 'TASK_UPDATED',
        description: `Task "${taskToSave.title}" was updated`,
        timestamp: new Date().toISOString(),
      });

      await storageService.saveTasks(tasks);
      await storageService.saveHistory(history);

      set({
        tasks,
        history,
      });

      await get().syncTasks();
    } catch (error) {
      console.error(
        'Failed to update task:',
        error,
      );

      set({
        error: 'Failed to update task.',
      });

      throw error;
    }
  },

  deleteTask: async (taskId) => {
    try {
      set({ error: null });

      const task = get().tasks.find(
        (item) => item.id === taskId,
      );

      if (!task) {
        return;
      }

      if (task.remoteExists) {
        await storageService.addDeletedTaskId(taskId);
      }

      const historyItem: HistoryItem = {
        id: Crypto.randomUUID(),
        taskId,
        action: 'TASK_DELETED',
        description: `Task "${task.title}" was deleted`,
        timestamp: new Date().toISOString(),
      };

      const tasks = get().tasks.filter(
        (item) => item.id !== taskId,
      );

      const history = [
        ...get().history,
        historyItem,
      ];

      await storageService.saveTasks(tasks);
      await storageService.saveHistory(history);

      set({
        tasks,
        history,
      });

      await get().syncTasks();
    } catch (error) {
      console.error(
        'Failed to delete task:',
        error,
      );

      set({
        error: 'Failed to delete task.',
      });

      throw error;
    }
  },

  changeStatus: async (taskId, status) => {
    try {
      set({ error: null });

      const task = get().tasks.find(
        (item) => item.id === taskId,
      );

      if (!task || task.status === status) {
        return;
      }

      const updatedTask: Task = {
        ...task,
        status,
        updatedAt: new Date().toISOString(),
        syncStatus: 'PENDING',
      };

      const tasks = get().tasks.map((item) =>
        item.id === taskId
          ? updatedTask
          : item,
      );

      const historyItem: HistoryItem = {
        id: Crypto.randomUUID(),
        taskId,
        action: 'STATUS_CHANGED',
        description: `Status changed from ${task.status} to ${status}`,
        timestamp: new Date().toISOString(),
      };

      const history = [
        ...get().history,
        historyItem,
      ];

      await storageService.saveTasks(tasks);
      await storageService.saveHistory(history);

      set({
        tasks,
        history,
      });

      await get().syncTasks();
    } catch (error) {
      console.error(
        'Failed to change task status:',
        error,
      );

      set({
        error: 'Failed to change task status.',
      });

      throw error;
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));