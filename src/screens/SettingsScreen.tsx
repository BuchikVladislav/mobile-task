import { useEffect, useState } from 'react';
import {
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';

import { notificationService } from '../services/notifications/notificationService';
import { useTheme } from '../theme/ThemeContext';

const CANDIDATE_CODE = 'SA-RN-4827';

export default function SettingsScreen() {
  const { isDark, colors, toggleTheme } = useTheme();

  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      const demoMode =
        await notificationService.getDemoMode();

      setIsDemoMode(demoMode);
    };

    loadSettings();
  }, []);

  const handleDemoModeChange = async (
    enabled: boolean,
  ) => {
    try {
      await notificationService.setDemoMode(enabled);
      setIsDemoMode(enabled);
    } catch {
      // The service already logs the error.
    }
  };

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
        Settings
      </Text>

      <View
        style={[
          styles.settingRow,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
          },
        ]}
      >
        <View style={styles.textContainer}>
          <Text
            style={[
              styles.settingTitle,
              { color: colors.text },
            ]}
          >
            Dark mode
          </Text>

          <Text
            style={[
              styles.settingDescription,
              { color: colors.secondaryText },
            ]}
          >
            Switch application theme
          </Text>
        </View>

        <Switch
          value={isDark}
          onValueChange={toggleTheme}
          accessibilityLabel="Toggle dark mode"
          accessibilityRole="switch"
        />
      </View>

      <View
        style={[
          styles.settingRow,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
          },
        ]}
      >
        <View style={styles.textContainer}>
          <Text
            style={[
              styles.settingTitle,
              { color: colors.text },
            ]}
          >
            Demo notifications
          </Text>

          <Text
            style={[
              styles.settingDescription,
              { color: colors.secondaryText },
            ]}
          >
            Trigger task reminders after about 30 seconds
            for demonstration
          </Text>
        </View>

        <Switch
          value={isDemoMode}
          onValueChange={handleDemoModeChange}
          accessibilityLabel="Toggle demo notifications"
          accessibilityRole="switch"
        />
      </View>

      <View
        style={[
          styles.codeContainer,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
          },
        ]}
      >
        <Text
          style={[
            styles.codeLabel,
            { color: colors.secondaryText },
          ]}
        >
          Candidate Code
        </Text>

        <Text
          style={[
            styles.code,
            { color: colors.text },
          ]}
        >
          {CANDIDATE_CODE}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },

  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 24,
  },

  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    marginBottom: 12,
    borderRadius: 10,
    borderWidth: 1,
  },

  textContainer: {
    flex: 1,
    paddingRight: 12,
  },

  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
  },

  settingDescription: {
    marginTop: 4,
    fontSize: 14,
    lineHeight: 20,
  },

  codeContainer: {
    padding: 16,
    marginTop: 8,
    borderRadius: 10,
    borderWidth: 1,
  },

  codeLabel: {
    fontSize: 14,
    marginBottom: 4,
  },

  code: {
    fontSize: 18,
    fontWeight: '700',
  },
});