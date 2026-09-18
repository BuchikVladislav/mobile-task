import { useNavigation } from '@react-navigation/native';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { useTaskStore } from '../store/taskStore';
import { Task } from '../types';
import { useTheme } from '../theme/ThemeContext';

type SortOption = 'CREATED_AT' | 'DUE_DATE' | 'STATUS';

const STATUS_LABELS: Record<Task['status'], string> = {
  NEW: 'New',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

export default function TasksScreen() {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();

  const tasks = useTaskStore((state) => state.tasks);
  const isLoading = useTaskStore((state) => state.isLoading);
  const error = useTaskStore((state) => state.error);
  const loadData = useTaskStore((state) => state.loadData);
  const clearError = useTaskStore((state) => state.clearError);

  const [sortOption, setSortOption] =
    useState<SortOption>('CREATED_AT');

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRetry = async () => {
    clearError();
    await loadData();
  };

  const sortedTasks = useMemo(() => {
    const result = [...tasks];

    switch (sortOption) {
      case 'DUE_DATE':
        return result.sort(
          (a, b) =>
            new Date(a.dueDate).getTime() -
            new Date(b.dueDate).getTime(),
        );

      case 'STATUS':
        return result.sort((a, b) =>
          a.status.localeCompare(b.status),
        );

      case 'CREATED_AT':
      default:
        return result.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() -
            new Date(a.createdAt).getTime(),
        );
    }
  }, [tasks, sortOption]);

  if (isLoading) {
    return (
      <View
        style={[
          styles.center,
          { backgroundColor: colors.background },
        ]}
      >
        <ActivityIndicator
          size="large"
          color={colors.text}
        />

        <Text
          style={[
            styles.loadingText,
            { color: colors.secondaryText },
          ]}
        >
          Loading tasks...
        </Text>
      </View>
    );
  }

  if (error && tasks.length === 0) {
    return (
      <View
        style={[
          styles.center,
          { backgroundColor: colors.background },
        ]}
      >
        <Text
          style={[
            styles.errorTitle,
            { color: colors.text },
          ]}
        >
          Something went wrong
        </Text>

        <Text
          style={[
            styles.errorDescription,
            { color: colors.secondaryText },
          ]}
        >
          {error}
        </Text>

        <TouchableOpacity
          style={[
            styles.retryButton,
            { backgroundColor: colors.primary },
          ]}
          onPress={handleRetry}
        >
          <Text
            style={[
              styles.retryButtonText,
              { color: colors.primaryText },
            ]}
          >
            Retry
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderTask = ({ item }: { item: Task }) => (
    <TouchableOpacity
      style={[
        styles.taskCard,
        { backgroundColor: colors.card },
      ]}
      onPress={() =>
        navigation.navigate('TaskDetails', {
          taskId: item.id,
        })
      }
    >
      <Text
        style={[
          styles.taskTitle,
          { color: colors.text },
        ]}
      >
        {item.title}
      </Text>

      <Text
        style={[
          styles.taskDescription,
          { color: colors.secondaryText },
        ]}
        numberOfLines={2}
      >
        {item.description}
      </Text>

      <View style={styles.taskInfo}>
        <Text
          style={[
            styles.status,
            { color: colors.text },
          ]}
        >
          {STATUS_LABELS[item.status]}
        </Text>

        <Text
          style={[
            styles.dueDate,
            { color: colors.secondaryText },
          ]}
        >
          Due: {new Date(item.dueDate).toLocaleString()}
        </Text>
      </View>

      <Text
        style={[
          styles.address,
          { color: colors.secondaryText },
        ]}
        numberOfLines={1}
      >
        {item.location.address}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background },
      ]}
    >
      <View style={styles.header}>
        <Text
          style={[
            styles.title,
            { color: colors.text },
          ]}
        >
          Tasks
        </Text>

        <View style={styles.headerRight}>
          <Text
            style={[
              styles.taskCount,
              { color: colors.secondaryText },
            ]}
          >
            {tasks.length}{' '}
            {tasks.length === 1 ? 'task' : 'tasks'}
          </Text>

          <TouchableOpacity
            style={[
              styles.createButton,
              { backgroundColor: colors.primary },
            ]}
            onPress={() => navigation.navigate('CreateTask')}
          >
            <Text
              style={[
                styles.createButtonText,
                { color: colors.primaryText },
              ]}
            >
              + Create
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {error && tasks.length > 0 && (
        <View
          style={[
            styles.errorBanner,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          <Text
            style={[
              styles.errorBannerText,
              { color: colors.text },
            ]}
          >
            {error}
          </Text>

          <TouchableOpacity onPress={handleRetry}>
            <Text
              style={[
                styles.errorRetryText,
                { color: colors.text },
              ]}
            >
              Retry
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {tasks.length > 0 && (
        <View style={styles.sortContainer}>
          <Text
            style={[
              styles.sortLabel,
              { color: colors.secondaryText },
            ]}
          >
            Sort by:
          </Text>

          <TouchableOpacity
            style={[
              styles.sortButton,
              { backgroundColor: colors.muted },
              sortOption === 'CREATED_AT' && {
                backgroundColor: colors.primary,
              },
            ]}
            onPress={() => setSortOption('CREATED_AT')}
          >
            <Text
              style={[
                styles.sortButtonText,
                { color: colors.text },
                sortOption === 'CREATED_AT' && {
                  color: colors.primaryText,
                },
              ]}
            >
              Added
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.sortButton,
              { backgroundColor: colors.muted },
              sortOption === 'DUE_DATE' && {
                backgroundColor: colors.primary,
              },
            ]}
            onPress={() => setSortOption('DUE_DATE')}
          >
            <Text
              style={[
                styles.sortButtonText,
                { color: colors.text },
                sortOption === 'DUE_DATE' && {
                  color: colors.primaryText,
                },
              ]}
            >
              Due date
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.sortButton,
              { backgroundColor: colors.muted },
              sortOption === 'STATUS' && {
                backgroundColor: colors.primary,
              },
            ]}
            onPress={() => setSortOption('STATUS')}
          >
            <Text
              style={[
                styles.sortButtonText,
                { color: colors.text },
                sortOption === 'STATUS' && {
                  color: colors.primaryText,
                },
              ]}
            >
              Status
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {tasks.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text
            style={[
              styles.emptyTitle,
              { color: colors.text },
            ]}
          >
            No tasks yet
          </Text>

          <Text
            style={[
              styles.emptyDescription,
              { color: colors.secondaryText },
            ]}
          >
            Create your first task to get started.
          </Text>

          <TouchableOpacity
            style={[
              styles.emptyCreateButton,
              { backgroundColor: colors.primary },
            ]}
            onPress={() => navigation.navigate('CreateTask')}
          >
            <Text
              style={[
                styles.emptyCreateButtonText,
                { color: colors.primaryText },
              ]}
            >
              Create Task
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={sortedTasks}
          keyExtractor={(item) => item.id}
          renderItem={renderTask}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },

  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },

  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },

  errorDescription: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },

  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },

  retryButtonText: {
    fontWeight: '600',
  },

  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },

  errorBannerText: {
    flex: 1,
    fontSize: 13,
    marginRight: 12,
  },

  errorRetryText: {
    fontSize: 13,
    fontWeight: '700',
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },

  headerRight: {
    alignItems: 'flex-end',
    gap: 8,
  },

  title: {
    fontSize: 28,
    fontWeight: '700',
  },

  taskCount: {
    fontSize: 14,
  },

  createButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },

  createButtonText: {
    fontWeight: '600',
  },

  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },

  sortLabel: {
    fontSize: 14,
  },

  sortButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },

  sortButtonText: {
    fontSize: 12,
  },

  list: {
    paddingBottom: 20,
  },

  taskCard: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
  },

  taskTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 6,
  },

  taskDescription: {
    fontSize: 14,
    marginBottom: 12,
  },

  taskInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },

  status: {
    fontSize: 13,
    fontWeight: '600',
  },

  dueDate: {
    fontSize: 12,
  },

  address: {
    fontSize: 13,
  },

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },

  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },

  emptyDescription: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },

  emptyCreateButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },

  emptyCreateButtonText: {
    fontWeight: '600',
  },
});