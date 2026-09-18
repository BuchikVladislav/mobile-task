import AsyncStorage from '@react-native-async-storage/async-storage';

import { HistoryItem, Task } from '../../types';

const TASKS_STORAGE_KEY = '@mobile-task/tasks';
const HISTORY_STORAGE_KEY = '@mobile-task/history';
const DELETED_TASKS_STORAGE_KEY = '@mobile-task/deleted-task-ids';

export const storageService = {
  async getTasks(): Promise<Task[]> {
    const data = await AsyncStorage.getItem(TASKS_STORAGE_KEY);

    if (!data) {
      return [];
    }

    const tasks: Task[] = JSON.parse(data);

    return tasks.map((task) => ({
      ...task,
      remoteExists:
        task.remoteExists ??
        task.syncStatus === 'SYNCED',
    }));
  },

  async saveTasks(tasks: Task[]): Promise<void> {
    await AsyncStorage.setItem(
      TASKS_STORAGE_KEY,
      JSON.stringify(tasks),
    );
  },

  async getHistory(): Promise<HistoryItem[]> {
    const data = await AsyncStorage.getItem(HISTORY_STORAGE_KEY);

    if (!data) {
      return [];
    }

    return JSON.parse(data);
  },

  async saveHistory(history: HistoryItem[]): Promise<void> {
    await AsyncStorage.setItem(
      HISTORY_STORAGE_KEY,
      JSON.stringify(history),
    );
  },

  async getDeletedTaskIds(): Promise<string[]> {
    const data = await AsyncStorage.getItem(
      DELETED_TASKS_STORAGE_KEY,
    );

    if (!data) {
      return [];
    }

    return JSON.parse(data);
  },

  async addDeletedTaskId(taskId: string): Promise<void> {
    const deletedTaskIds =
      await this.getDeletedTaskIds();

    if (deletedTaskIds.includes(taskId)) {
      return;
    }

    await AsyncStorage.setItem(
      DELETED_TASKS_STORAGE_KEY,
      JSON.stringify([
        ...deletedTaskIds,
        taskId,
      ]),
    );
  },

  async removeDeletedTaskId(taskId: string): Promise<void> {
    const deletedTaskIds =
      await this.getDeletedTaskIds();

    const updatedDeletedTaskIds =
      deletedTaskIds.filter(
        (id) => id !== taskId,
      );

    await AsyncStorage.setItem(
      DELETED_TASKS_STORAGE_KEY,
      JSON.stringify(updatedDeletedTaskIds),
    );
  },
};