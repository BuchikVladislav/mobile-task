import NetInfo from '@react-native-community/netinfo';

import { useTaskStore } from '../../store/taskStore';

const RETRY_DELAY = 5000;

let unsubscribe: (() => void) | null = null;
let retryTimeout: ReturnType<typeof setTimeout> | null = null;

const scheduleRetry = () => {
  if (retryTimeout) {
    return;
  }

  retryTimeout = setTimeout(() => {
    retryTimeout = null;

    void useTaskStore.getState().syncTasks();
  }, RETRY_DELAY);
};

export const networkSyncService = {
  start(): void {
    if (unsubscribe) {
      return;
    }

    unsubscribe = NetInfo.addEventListener((state) => {
      if (state.isConnected) {
        void useTaskStore.getState().syncTasks();
      } else {
        scheduleRetry();
      }
    });
  },

  stop(): void {
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }

    if (retryTimeout) {
      clearTimeout(retryTimeout);
      retryTimeout = null;
    }
  },

  retry(): void {
    scheduleRetry();
  },
};