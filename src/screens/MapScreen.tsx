import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { useNavigation } from '@react-navigation/native';

import { useTaskStore } from '../store/taskStore';
import { useTheme } from '../theme/ThemeContext';

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

export default function MapScreen() {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();

  const tasks = useTaskStore((state) => state.tasks);

  const tasksWithCoordinates = useMemo(
    () =>
      tasks.filter(
        (task) =>
          task.location.latitude !== undefined &&
          task.location.longitude !== undefined,
      ),
    [tasks],
  );

  const markers = tasksWithCoordinates
    .map(
      (task) => `
        L.marker([${task.location.latitude}, ${task.location.longitude}])
          .addTo(map)
          .bindPopup(
            '<b>${escapeHtml(task.title)}</b><br/>${escapeHtml(
              task.location.address,
            )}<br/><br/><a href="task://${task.id}">Open task</a>'
          );
      `,
    )
    .join('\n');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0"
        />

        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        />

        <style>
          html, body, #map {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
          }
        </style>
      </head>

      <body>
        <div id="map"></div>

        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>

        <script>
          const map = L.map('map').setView([52.52, 13.405], 12);

          L.tileLayer(
            'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            {
              attribution: '&copy; OpenStreetMap contributors',
              maxZoom: 19
            }
          ).addTo(map);

          ${markers}
        </script>
      </body>
    </html>
  `;

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background },
      ]}
    >
      <WebView
        originWhitelist={['*']}
        source={{ html }}
        style={styles.map}
        onShouldStartLoadWithRequest={(request) => {
          if (request.url.startsWith('task://')) {
            const taskId = request.url.replace('task://', '');

            navigation.navigate('TaskDetails', {
              taskId,
            });

            return false;
          }

          return true;
        }}
      />

      {tasksWithCoordinates.length === 0 && (
        <View
          style={[
            styles.emptyMessage,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          <Text
            style={[
              styles.emptyTitle,
              { color: colors.text },
            ]}
          >
            No tasks on the map
          </Text>

          <Text
            style={[
              styles.emptyDescription,
              { color: colors.secondaryText },
            ]}
          >
            Tasks with coordinates will appear here.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  map: {
    flex: 1,
  },

  emptyMessage: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 30,
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },

  emptyDescription: {
    marginTop: 4,
    fontSize: 14,
    textAlign: 'center',
  },
});