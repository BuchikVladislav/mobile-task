import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

const CHANNEL_ID = 'task-reminders';
const REMINDER_MINUTES = 30;
const DEMO_MODE_STORAGE_KEY = '@lifeos/demo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const notificationService = {
  async initialize(): Promise<boolean> {
    try {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync(
          CHANNEL_ID,
          {
            name: 'Task reminders',
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 250, 250, 250],
          },
        );
      }

      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();

      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } =
          await Notifications.requestPermissionsAsync();

        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn(
          'Notification permission was not granted.',
        );

        return false;
      }

      return true;
    } catch (error) {
      console.error(
        'Failed to initialize notifications:',
        error,
      );

      return false;
    }
  },

  async getDemoMode(): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(
        DEMO_MODE_STORAGE_KEY,
      );

      return value === 'true';
    } catch (error) {
      console.error(
        'Failed to load notification demo mode:',
        error,
      );

      return false;
    }
  },

  async setDemoMode(enabled: boolean): Promise<void> {
    try {
      await AsyncStorage.setItem(
        DEMO_MODE_STORAGE_KEY,
        String(enabled),
      );
    } catch (error) {
      console.error(
        'Failed to save notification demo mode:',
        error,
      );

      throw error;
    }
  },

  async scheduleTaskReminder(
    taskId: string,
    title: string,
    dueDate: string,
  ): Promise<string | null> {
    try {
      const hasPermission = await this.initialize();

      if (!hasPermission) {
        return null;
      }

      const dueTimestamp = new Date(dueDate).getTime();

      if (Number.isNaN(dueTimestamp)) {
        console.warn(
          `Reminder for task "${taskId}" cannot be scheduled because due date is invalid.`,
        );

        return null;
      }

      const demoMode = await this.getDemoMode();

      let triggerTimestamp: number;

      if (demoMode) {
        // Demo mode: notification approximately 30 seconds later.
        triggerTimestamp = Date.now() + 30 * 1000;
      } else {
        // Normal mode: notification 30 minutes before deadline.
        triggerTimestamp =
          dueTimestamp - REMINDER_MINUTES * 60 * 1000;
      }

      if (triggerTimestamp <= Date.now()) {
        console.warn(
          `Reminder for task "${taskId}" cannot be scheduled because the reminder time has already passed.`,
        );

        return null;
      }

      const notificationId =
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Task reminder',
            body: `"${title}" is due soon.`,
            data: {
              taskId,
            },
          },

          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: new Date(triggerTimestamp),
            ...(Platform.OS === 'android'
              ? { channelId: CHANNEL_ID }
              : {}),
          },
        });

      console.log(
        `Notification scheduled: ${notificationId} for task ${taskId}`,
      );

      return notificationId;
    } catch (error) {
      console.error(
        `Failed to schedule notification for task ${taskId}:`,
        error,
      );

      return null;
    }
  },

  async cancelNotification(
    notificationId: string,
  ): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(
        notificationId,
      );

      console.log(
        `Notification cancelled: ${notificationId}`,
      );
    } catch (error) {
      console.error(
        `Failed to cancel notification ${notificationId}:`,
        error,
      );
    }
  },

  async cancelTaskReminder(
    taskId: string,
    notificationId?: string,
  ): Promise<void> {
    try {
      if (notificationId) {
        await this.cancelNotification(notificationId);
        return;
      }

      const scheduledNotifications =
        await Notifications.getAllScheduledNotificationsAsync();

      const taskNotifications =
        scheduledNotifications.filter(
          (notification) =>
            notification.content.data?.taskId === taskId,
        );

      for (const notification of taskNotifications) {
        await this.cancelNotification(
          notification.identifier,
        );
      }

      console.log(
        `Found ${taskNotifications.length} notification(s) for task ${taskId}`,
      );
    } catch (error) {
      console.error(
        `Failed to cancel notification for task ${taskId}:`,
        error,
      );
    }
  },

  async getScheduledNotifications() {
    return Notifications.getAllScheduledNotificationsAsync();
  },
};