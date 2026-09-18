import { useEffect } from 'react';

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import TasksScreen from './src/screens/TasksScreen';
import CreateTaskScreen from './src/screens/CreateTaskScreen';
import TaskDetailsScreen from './src/screens/TaskDetailsScreen';
import EditTaskScreen from './src/screens/EditTaskScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import MapScreen from './src/screens/MapScreen';
import SettingsScreen from './src/screens/SettingsScreen';

import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
import { networkSyncService } from './src/services/sync/networkSyncService';

export type RootStackParamList = {
  Main: undefined;
  CreateTask: undefined;
  TaskDetails: { taskId: string };
  EditTask: { taskId: string };
};

export type TabParamList = {
  Tasks: undefined;
  Map: undefined;
  History: undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

function MainTabs() {
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.text,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
        },
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.secondaryText,
      }}
    >
      <Tab.Screen
        name="Tasks"
        component={TasksScreen}
        options={{ title: 'Tasks' }}
      />

      <Tab.Screen
        name="Map"
        component={MapScreen}
        options={{ title: 'Map' }}
      />

      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{ title: 'History' }}
      />

      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const { colors } = useTheme();

  useEffect(() => {
    networkSyncService.start();

    return () => {
      networkSyncService.stop();
    };
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          animation: 'none',
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.text,
          contentStyle: {
            backgroundColor: colors.background,
          },
        }}
      >
        <Stack.Screen
          name="Main"
          component={MainTabs}
          options={{ headerShown: false }}
        />

        <Stack.Screen
          name="CreateTask"
          component={CreateTaskScreen}
          options={{ title: 'Create Task' }}
        />

        <Stack.Screen
          name="TaskDetails"
          component={TaskDetailsScreen}
          options={{ title: 'Task Details' }}
        />

        <Stack.Screen
          name="EditTask"
          component={EditTaskScreen}
          options={{ title: 'Edit Task' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppNavigator />
    </ThemeProvider>
  );
}