import { useNavigation, useRoute } from '@react-navigation/native';
import { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import AttachmentImage from '../components/AttachmentImage';
import { notificationService } from '../services/notifications/notificationService';
import { useTaskStore } from '../store/taskStore';
import { Task, TaskStatus } from '../types';
import { useTheme } from '../theme/ThemeContext';

const STATUS_LABELS: Record<TaskStatus, string> = {
  NEW: 'New',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

const SYNC_STATUS_LABELS: Record<Task['syncStatus'], string> = {
  PENDING: 'Pending Sync',
  SYNCED: 'Synced',
  SYNC_FAILED: 'Sync Failed',
};

export default function TaskDetailsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { colors } = useTheme();

  const { taskId } = route.params;

  const task = useTaskStore((state) =>
    state.tasks.find((item) => item.id === taskId),
  );

  const changeStatus = useTaskStore((state) => state.changeStatus);
  const deleteTask = useTaskStore((state) => state.deleteTask);

  const [isDeleting, setIsDeleting] = useState(false);

  if (!task) {
    return (
      <View
        style={[
          styles.center,
          { backgroundColor: colors.background },
        ]}
      >
        <Text
          style={[
            styles.notFoundTitle,
            { color: colors.text },
          ]}
        >
          Task not found
        </Text>

        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: colors.primary },
          ]}
          onPress={() => navigation.navigate('Main')}
          accessibilityRole="button"
          accessibilityLabel="Back to tasks"
        >
          <Text
            style={[
              styles.buttonText,
              { color: colors.primaryText },
            ]}
          >
            Back to tasks
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleStatusChange = async (status: TaskStatus) => {
    await changeStatus(task.id, status);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete task',
      'Are you sure you want to delete this task?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);

            try {
              await notificationService.cancelTaskReminder(
                task.id,
                task.notificationId,
              );

              await deleteTask(task.id);

              navigation.navigate('Main');
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ],
    );
  };

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <Text
        style={[
          styles.title,
          { color: colors.text },
        ]}
      >
        {task.title}
      </Text>

      <View
        style={[
          styles.statusContainer,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
          },
        ]}
      >
        <Text
          style={[
            styles.label,
            { color: colors.text },
          ]}
        >
          Status
        </Text>

        <Text
          style={[
            styles.status,
            { color: colors.text },
          ]}
        >
          {STATUS_LABELS[task.status]}
        </Text>
      </View>

      <View
        style={[
          styles.syncContainer,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
          },
        ]}
      >
        <Text
          style={[
            styles.label,
            { color: colors.text },
          ]}
        >
          Sync status
        </Text>

        <Text
          style={[
            styles.syncStatus,
            { color: colors.secondaryText },
          ]}
        >
          {SYNC_STATUS_LABELS[task.syncStatus]}
        </Text>
      </View>

      <Text
        style={[
          styles.label,
          { color: colors.text },
        ]}
      >
        Description
      </Text>

      <Text
        style={[
          styles.description,
          { color: colors.secondaryText },
        ]}
      >
        {task.description}
      </Text>

      <Text
        style={[
          styles.label,
          { color: colors.text },
        ]}
      >
        Due date
      </Text>

      <Text
        style={[
          styles.value,
          { color: colors.secondaryText },
        ]}
      >
        {new Date(task.dueDate).toLocaleString()}
      </Text>

      <Text
        style={[
          styles.label,
          { color: colors.text },
        ]}
      >
        Address
      </Text>

      <Text
        style={[
          styles.value,
          { color: colors.secondaryText },
        ]}
      >
        {task.location.address}
      </Text>

      <Text
        style={[
          styles.label,
          { color: colors.text },
        ]}
      >
        Created
      </Text>

      <Text
        style={[
          styles.value,
          { color: colors.secondaryText },
        ]}
      >
        {new Date(task.createdAt).toLocaleString()}
      </Text>

      {task.attachments.length > 0 && (
        <>
          <Text
            style={[
              styles.label,
              { color: colors.text },
            ]}
          >
            Attachments
          </Text>

          {task.attachments.map((attachment) => (
            <AttachmentImage
              key={attachment.id}
              uri={attachment.uri}
              style={styles.image}
            />
          ))}
        </>
      )}

      <Text
        style={[
          styles.label,
          { color: colors.text },
        ]}
      >
        Change status
      </Text>

      <View style={styles.statusButtons}>
        {(
          [
            'NEW',
            'IN_PROGRESS',
            'COMPLETED',
            'CANCELLED',
          ] as TaskStatus[]
        ).map((status) => (
          <TouchableOpacity
            key={status}
            style={[
              styles.statusButton,
              { backgroundColor: colors.muted },
              task.status === status && {
                backgroundColor: colors.primary,
              },
            ]}
            onPress={() => handleStatusChange(status)}
            accessibilityRole="button"
            accessibilityLabel={`Change status to ${STATUS_LABELS[status]}`}
            accessibilityState={{
              selected: task.status === status,
            }}
          >
            <Text
              style={[
                styles.statusButtonText,
                { color: colors.text },
                task.status === status && {
                  color: colors.primaryText,
                },
              ]}
            >
              {STATUS_LABELS[status]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[
          styles.button,
          { backgroundColor: colors.primary },
        ]}
        onPress={() =>
          navigation.navigate('EditTask', {
            taskId: task.id,
          })
        }
        accessibilityRole="button"
        accessibilityLabel="Edit task"
      >
        <Text
          style={[
            styles.buttonText,
            { color: colors.primaryText },
          ]}
        >
          Edit task
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.deleteButton,
          { borderColor: colors.danger },
        ]}
        onPress={handleDelete}
        disabled={isDeleting}
        accessibilityRole="button"
        accessibilityLabel="Delete task"
        accessibilityState={{
          disabled: isDeleting,
        }}
      >
        <Text
          style={[
            styles.deleteButtonText,
            { color: colors.danger },
          ]}
        >
          {isDeleting ? 'Deleting...' : 'Delete task'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 40,
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },

  notFoundTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },

  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 20,
  },

  label: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 18,
    marginBottom: 6,
  },

  value: {
    fontSize: 16,
  },

  description: {
    fontSize: 16,
    lineHeight: 24,
  },

  statusContainer: {
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
  },

  syncContainer: {
    marginTop: 10,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
  },

  status: {
    fontSize: 16,
    fontWeight: '600',
  },

  syncStatus: {
    fontSize: 16,
    fontWeight: '600',
  },

  image: {
    width: '100%',
    height: 240,
    borderRadius: 10,
    marginBottom: 12,
  },

  statusButtons: {
    gap: 8,
  },

  statusButton: {
    padding: 12,
    borderRadius: 8,
    minHeight: 48,
    justifyContent: 'center',
  },

  statusButtonText: {
    textAlign: 'center',
    fontWeight: '600',
  },

  button: {
    marginTop: 24,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    minHeight: 52,
    justifyContent: 'center',
  },

  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },

  deleteButton: {
    marginTop: 12,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    minHeight: 52,
    justifyContent: 'center',
  },

  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});