import * as Crypto from 'expo-crypto';

import { taskApi } from '../../api/taskApi';
import { storageService } from '../storage/storageService';
import { HistoryItem, Task } from '../../types';

const RETRY_DELAY = 5000;

let retryTimeout: ReturnType<typeof setTimeout> | null = null;

const scheduleRetry = (
  onSyncComplete?: () => Promise<void>,
) => {
  if (retryTimeout) {
    return;
  }

  retryTimeout = setTimeout(async () => {
    retryTimeout = null;

    try {
      const tasks = await storageService.getTasks();
      const deletedTaskIds =
        await storageService.getDeletedTaskIds();

      const hasPendingTasks = tasks.some(
        (task) =>
          task.syncStatus === 'PENDING' ||
          task.syncStatus === 'SYNC_FAILED',
      );

      const hasPendingDeletions =
        deletedTaskIds.length > 0;

      if (
        hasPendingTasks ||
        hasPendingDeletions
      ) {
        await syncService.sync(onSyncComplete);
      }
    } catch (error) {
      console.error(
        'Retry sync failed:',
        error,
      );
    }
  }, RETRY_DELAY);
};

export const syncService = {
  async sync(
    onSyncComplete?: () => Promise<void>,
  ): Promise<void> {
    const tasks = await storageService.getTasks();
    const history = await storageService.getHistory();
    const deletedTaskIds =
      await storageService.getDeletedTaskIds();

    const pendingTasks = tasks.filter(
      (task) =>
        task.syncStatus === 'PENDING' ||
        task.syncStatus === 'SYNC_FAILED',
    );

    if (
      pendingTasks.length === 0 &&
      deletedTaskIds.length === 0
    ) {
      return;
    }

    const syncStartHistory: HistoryItem = {
      id: Crypto.randomUUID(),
      taskId: '',
      action: 'SYNC_STARTED',
      description:
        `Sync started for ${
          pendingTasks.length +
          deletedTaskIds.length
        } operation(s)`,
      timestamp: new Date().toISOString(),
    };

    let updatedTasks = [...tasks];

    let updatedHistory = [
      ...history,
      syncStartHistory,
    ];

    await storageService.saveHistory(
      updatedHistory,
    );

    let hasFailures = false;

    /*
     * Synchronize created and updated tasks.
     */
    for (const task of pendingTasks) {
      try {
        const serverTask =
          await taskApi.getTask(task.id);

        /*
         * Task does not exist on the server.
         * It must be created.
         */
        if (!serverTask) {
          const createdTask =
            await taskApi.createTask(task);

          const taskIndex =
            updatedTasks.findIndex(
              (item) => item.id === task.id,
            );

          if (taskIndex !== -1) {
            updatedTasks[taskIndex] = {
              ...createdTask,
              syncStatus: 'SYNCED',
              remoteExists: true,
            };
          }

          updatedHistory = [
            ...updatedHistory,
            {
              id: Crypto.randomUUID(),
              taskId: task.id,
              action: 'SYNC_SUCCESS',
              description:
                `Task "${task.title}" created on server`,
              timestamp:
                new Date().toISOString(),
            },
          ];

          continue;
        }

        const localUpdatedAt =
          new Date(task.updatedAt).getTime();

        const serverUpdatedAt =
          new Date(
            serverTask.updatedAt,
          ).getTime();

        /*
         * Last Write Wins:
         * the version with the latest updatedAt wins.
         */
        if (serverUpdatedAt > localUpdatedAt) {
          const taskIndex =
            updatedTasks.findIndex(
              (item) => item.id === task.id,
            );

          if (taskIndex !== -1) {
            updatedTasks[taskIndex] = {
              ...serverTask,
              syncStatus: 'SYNCED',
              remoteExists: true,
            };
          }

          updatedHistory = [
            ...updatedHistory,
            {
              id: Crypto.randomUUID(),
              taskId: task.id,
              action: 'SYNC_SUCCESS',
              description:
                `Server version of task "${task.title}" was newer and was applied locally`,
              timestamp:
                new Date().toISOString(),
            },
          ];

          continue;
        }

        /*
         * Local version is newer or timestamps are equal.
         * Send local version to the server.
         */
        const syncedTask =
          await taskApi.updateTask(task);

        const taskIndex =
          updatedTasks.findIndex(
            (item) => item.id === task.id,
          );

        if (taskIndex !== -1) {
          updatedTasks[taskIndex] = {
            ...syncedTask,
            syncStatus: 'SYNCED',
            remoteExists: true,
          };
        }

        updatedHistory = [
          ...updatedHistory,
          {
            id: Crypto.randomUUID(),
            taskId: task.id,
            action: 'SYNC_SUCCESS',
            description:
              `Task "${task.title}" synced successfully`,
            timestamp:
              new Date().toISOString(),
          },
        ];
      } catch (error) {
        hasFailures = true;

        console.error(
          `Failed to sync task ${task.id}:`,
          error,
        );

        const taskIndex =
          updatedTasks.findIndex(
            (item) => item.id === task.id,
          );

        if (taskIndex !== -1) {
          updatedTasks[taskIndex] = {
            ...updatedTasks[taskIndex],
            syncStatus: 'SYNC_FAILED',
          };
        }

        updatedHistory = [
          ...updatedHistory,
          {
            id: Crypto.randomUUID(),
            taskId: task.id,
            action: 'SYNC_FAILED',
            description:
              `Failed to sync task "${task.title}"`,
            timestamp:
              new Date().toISOString(),
          },
        ];
      }
    }

    /*
     * Synchronize offline deletions.
     */
    for (const taskId of deletedTaskIds) {
      try {
        await taskApi.deleteTask(taskId);

        await storageService.removeDeletedTaskId(
          taskId,
        );

        updatedHistory = [
          ...updatedHistory,
          {
            id: Crypto.randomUUID(),
            taskId,
            action: 'SYNC_SUCCESS',
            description:
              'Task deletion synced successfully',
            timestamp:
              new Date().toISOString(),
          },
        ];
      } catch (error) {
        hasFailures = true;

        console.error(
          `Failed to sync deletion of task ${taskId}:`,
          error,
        );

        updatedHistory = [
          ...updatedHistory,
          {
            id: Crypto.randomUUID(),
            taskId,
            action: 'SYNC_FAILED',
            description:
              'Failed to sync task deletion',
            timestamp:
              new Date().toISOString(),
          },
        ];
      }
    }

    await storageService.saveTasks(
      updatedTasks,
    );

    await storageService.saveHistory(
      updatedHistory,
    );

    if (onSyncComplete) {
      await onSyncComplete();
    }

    if (hasFailures) {
      scheduleRetry(onSyncComplete);
    }
  },
};