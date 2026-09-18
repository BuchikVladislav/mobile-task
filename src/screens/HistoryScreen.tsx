import { useMemo } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useTaskStore } from '../store/taskStore';
import { useTheme } from '../theme/ThemeContext';

const ACTION_LABELS: Record<string, string> = {
  TASK_CREATED: 'Task created',
  TASK_UPDATED: 'Task updated',
  STATUS_CHANGED: 'Status changed',
  ATTACHMENT_ADDED: 'Attachment added',
  ATTACHMENT_REMOVED: 'Attachment removed',
  TASK_DELETED: 'Task deleted',
  SYNC_STARTED: 'Sync started',
  SYNC_SUCCESS: 'Sync completed',
  SYNC_FAILED: 'Sync failed',
};

export default function HistoryScreen() {
  const { colors } = useTheme();

  const history = useTaskStore((state) => state.history);
  const tasks = useTaskStore((state) => state.tasks);

  const sortedHistory = useMemo(
    () =>
      [...history].sort(
        (a, b) =>
          new Date(b.timestamp).getTime() -
          new Date(a.timestamp).getTime(),
      ),
    [history],
  );

  const getTaskTitle = (taskId: string) => {
    const task = tasks.find((item) => item.id === taskId);

    return task?.title ?? '';
  };

  if (sortedHistory.length === 0) {
    return (
      <View
        style={[
          styles.emptyContainer,
          { backgroundColor: colors.background },
        ]}
      >
        <Text
          style={[
            styles.emptyTitle,
            { color: colors.text },
          ]}
        >
          No history yet
        </Text>

        <Text
          style={[
            styles.emptyDescription,
            { color: colors.secondaryText },
          ]}
        >
          Task activity will appear here.
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background },
      ]}
    >
      <Text
        style={[
          styles.title,
          { color: colors.text },
        ]}
      >
        History
      </Text>

      <FlatList
        data={sortedHistory}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View
            style={[
              styles.card,
              { backgroundColor: colors.card },
            ]}
          >
            <View style={styles.header}>
              <Text
                style={[
                  styles.action,
                  { color: colors.text },
                ]}
              >
                {ACTION_LABELS[item.action] ?? item.action}
              </Text>

              <Text
                style={[
                  styles.date,
                  { color: colors.secondaryText },
                ]}
              >
                {new Date(item.timestamp).toLocaleString()}
              </Text>
            </View>

            {item.taskId && (
              <Text
                style={[
                  styles.taskTitle,
                  { color: colors.text },
                ]}
              >
                {getTaskTitle(item.taskId)}
              </Text>
            )}

            <Text
              style={[
                styles.description,
                { color: colors.secondaryText },
              ]}
            >
              {item.description}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 16,
  },

  list: {
    paddingBottom: 20,
  },

  card: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
  },

  header: {
    marginBottom: 8,
  },

  action: {
    fontSize: 16,
    fontWeight: '600',
  },

  date: {
    marginTop: 4,
    fontSize: 12,
  },

  taskTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },

  description: {
    fontSize: 14,
  },

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },

  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },

  emptyDescription: {
    fontSize: 14,
    textAlign: 'center',
  },
});