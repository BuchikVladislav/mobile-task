import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import * as Crypto from 'expo-crypto';

import { useTaskStore } from '../store/taskStore';
import { Attachment } from '../types';
import { notificationService } from '../services/notifications/notificationService';
import { useTheme } from '../theme/ThemeContext';

export default function CreateTaskScreen() {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();

  const createTask = useTaskStore((state) => state.createTask);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [dueDate, setDueDate] = useState(new Date());

  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');

  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const pickImage = async () => {
    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        'Permission required',
        'Photo library permission is required to attach an image.',
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.8,
    });

    if (result.canceled || !result.assets[0]) {
      return;
    }

    const image = result.assets[0];

    setAttachment({
      id: Crypto.randomUUID(),
      uri: image.uri,
      fileName: image.fileName ?? 'image',
      mimeType: image.mimeType ?? 'image/jpeg',
      createdAt: new Date().toISOString(),
    });
  };

  const openDatePicker = () => {
    DateTimePickerAndroid.open({
      value: dueDate,
      mode: 'date',
      minimumDate: new Date(),
      onValueChange: (_event, selectedDate) => {
        if (selectedDate) {
          setDueDate((current) => {
            const updated = new Date(current);

            updated.setFullYear(
              selectedDate.getFullYear(),
              selectedDate.getMonth(),
              selectedDate.getDate(),
            );

            return updated;
          });
        }
      },
    });
  };

  const openTimePicker = () => {
    DateTimePickerAndroid.open({
      value: dueDate,
      mode: 'time',
      onValueChange: (_event, selectedDate) => {
        if (selectedDate) {
          setDueDate((current) => {
            const updated = new Date(current);

            updated.setHours(
              selectedDate.getHours(),
              selectedDate.getMinutes(),
              0,
              0,
            );

            return updated;
          });
        }
      },
    });
  };

  const validate = async (): Promise<boolean> => {
    if (!title.trim()) {
      Alert.alert('Validation error', 'Title is required.');
      return false;
    }

    if (!description.trim()) {
      Alert.alert('Validation error', 'Description is required.');
      return false;
    }

    if (!address.trim()) {
      Alert.alert('Validation error', 'Address is required.');
      return false;
    }

    if (!attachment) {
      Alert.alert(
        'Validation error',
        'At least one image attachment is required.',
      );
      return false;
    }

    const dueTimestamp = dueDate.getTime();
    const now = Date.now();

    if (dueTimestamp <= now) {
      Alert.alert(
        'Validation error',
        'Due date and time must be in the future.',
      );
      return false;
    }

    const demoMode = await notificationService.getDemoMode();

    if (
      !demoMode &&
      dueTimestamp - now < 30 * 60 * 1000
    ) {
      Alert.alert(
        'Validation error',
        'Due date must be at least 30 minutes from now.',
      );
      return false;
    }

    const hasLatitude = latitude.trim() !== '';
    const hasLongitude = longitude.trim() !== '';

    if (hasLatitude !== hasLongitude) {
      Alert.alert(
        'Validation error',
        'Latitude and longitude must be provided together.',
      );
      return false;
    }

    if (hasLatitude && hasLongitude) {
      const parsedLatitude = Number(latitude.replace(',', '.'));
      const parsedLongitude = Number(longitude.replace(',', '.'));

      if (
        !Number.isFinite(parsedLatitude) ||
        !Number.isFinite(parsedLongitude)
      ) {
        Alert.alert(
          'Validation error',
          'Latitude and longitude must be valid numbers.',
        );
        return false;
      }

      if (parsedLatitude < -90 || parsedLatitude > 90) {
        Alert.alert(
          'Validation error',
          'Latitude must be between -90 and 90.',
        );
        return false;
      }

      if (parsedLongitude < -180 || parsedLongitude > 180) {
        Alert.alert(
          'Validation error',
          'Longitude must be between -180 and 180.',
        );
        return false;
      }
    }

    return true;
  };

  const handleCreate = async () => {
    if (!(await validate())) {
      return;
    }

    setIsSaving(true);

    try {
      const now = new Date().toISOString();
      const taskId = Crypto.randomUUID();

      const parsedLatitude =
        latitude.trim() !== ''
          ? Number(latitude.replace(',', '.'))
          : undefined;

      const parsedLongitude =
        longitude.trim() !== ''
          ? Number(longitude.replace(',', '.'))
          : undefined;

      const notificationId =
        await notificationService.scheduleTaskReminder(
          taskId,
          title.trim(),
          dueDate.toISOString(),
        );

      await createTask({
        id: taskId,
        title: title.trim(),
        description: description.trim(),
        dueDate: dueDate.toISOString(),
        location: {
          address: address.trim(),
          latitude: parsedLatitude,
          longitude: parsedLongitude,
        },
        attachments: [attachment!],
        status: 'NEW',
        createdAt: now,
        updatedAt: now,
        syncStatus: 'PENDING',
        notificationId: notificationId ?? undefined,
      });

      navigation.navigate('Main');
    } catch (error) {
      console.error('Failed to create task:', error);

      Alert.alert(
        'Error',
        'Failed to create task. Please try again.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <Text
        style={[
          styles.title,
          { color: colors.text },
        ]}
      >
        Create Task
      </Text>

      <Text
        style={[
          styles.label,
          { color: colors.text },
        ]}
      >
        Title *
      </Text>

      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: colors.input,
            borderColor: colors.border,
            color: colors.text,
          },
        ]}
        placeholder="Task title"
        placeholderTextColor={colors.secondaryText}
        value={title}
        onChangeText={setTitle}
        accessibilityLabel="Task title"
      />

      <Text
        style={[
          styles.label,
          { color: colors.text },
        ]}
      >
        Description *
      </Text>

      <TextInput
        style={[
          styles.input,
          styles.textArea,
          {
            backgroundColor: colors.input,
            borderColor: colors.border,
            color: colors.text,
          },
        ]}
        placeholder="Task description"
        placeholderTextColor={colors.secondaryText}
        value={description}
        onChangeText={setDescription}
        multiline
        accessibilityLabel="Task description"
      />

      <Text
        style={[
          styles.label,
          { color: colors.text },
        ]}
      >
        Due date *
      </Text>

      <TouchableOpacity
        style={[
          styles.input,
          {
            backgroundColor: colors.input,
            borderColor: colors.border,
          },
        ]}
        onPress={openDatePicker}
        accessibilityRole="button"
        accessibilityLabel="Select due date"
      >
        <Text style={{ color: colors.text }}>
          {dueDate.toLocaleDateString()}
        </Text>
      </TouchableOpacity>

      <Text
        style={[
          styles.label,
          { color: colors.text },
        ]}
      >
        Due time *
      </Text>

      <TouchableOpacity
        style={[
          styles.input,
          {
            backgroundColor: colors.input,
            borderColor: colors.border,
          },
        ]}
        onPress={openTimePicker}
        accessibilityRole="button"
        accessibilityLabel="Select due time"
      >
        <Text style={{ color: colors.text }}>
          {dueDate.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </TouchableOpacity>

      <Text
        style={[
          styles.label,
          { color: colors.text },
        ]}
      >
        Address *
      </Text>

      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: colors.input,
            borderColor: colors.border,
            color: colors.text,
          },
        ]}
        placeholder="Task address"
        placeholderTextColor={colors.secondaryText}
        value={address}
        onChangeText={setAddress}
        accessibilityLabel="Task address"
      />

      <Text
        style={[
          styles.label,
          { color: colors.text },
        ]}
      >
        Latitude
      </Text>

      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: colors.input,
            borderColor: colors.border,
            color: colors.text,
          },
        ]}
        placeholder="e.g. 52.5200"
        placeholderTextColor={colors.secondaryText}
        value={latitude}
        onChangeText={setLatitude}
        keyboardType="numeric"
        accessibilityLabel="Latitude"
      />

      <Text
        style={[
          styles.label,
          { color: colors.text },
        ]}
      >
        Longitude
      </Text>

      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: colors.input,
            borderColor: colors.border,
            color: colors.text,
          },
        ]}
        placeholder="e.g. 13.4050"
        placeholderTextColor={colors.secondaryText}
        value={longitude}
        onChangeText={setLongitude}
        keyboardType="numeric"
        accessibilityLabel="Longitude"
      />

      <Text
        style={[
          styles.coordinatesHint,
          { color: colors.secondaryText },
        ]}
      >
        Optional. Enter both coordinates to show the task on the map.
      </Text>

      <Text
        style={[
          styles.label,
          { color: colors.text },
        ]}
      >
        Attachment *
      </Text>

      <TouchableOpacity
        style={[
          styles.attachmentButton,
          { backgroundColor: colors.muted },
        ]}
        onPress={pickImage}
        accessibilityRole="button"
        accessibilityLabel={
          attachment ? 'Change image attachment' : 'Add image attachment'
        }
      >
        <Text
          style={[
            styles.attachmentButtonText,
            { color: colors.text },
          ]}
        >
          {attachment ? 'Change image' : 'Add image'}
        </Text>
      </TouchableOpacity>

      {attachment && (
        <View style={styles.attachmentPreview}>
          <Image
            source={{ uri: attachment.uri }}
            style={styles.image}
            accessibilityLabel="Attached task image"
          />

          <TouchableOpacity
            onPress={() => setAttachment(null)}
            accessibilityRole="button"
            accessibilityLabel="Remove image attachment"
          >
            <Text
              style={[
                styles.removeText,
                { color: colors.danger },
              ]}
            >
              Remove image
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity
        style={[
          styles.createButton,
          { backgroundColor: colors.primary },
          isSaving && styles.disabledButton,
        ]}
        onPress={handleCreate}
        disabled={isSaving}
        accessibilityRole="button"
        accessibilityLabel="Create task"
        accessibilityState={{
          disabled: isSaving,
        }}
      >
        <Text
          style={[
            styles.createButtonText,
            { color: colors.primaryText },
          ]}
        >
          {isSaving ? 'Creating...' : 'Create task'}
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

  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 24,
  },

  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 12,
  },

  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 48,
  },

  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },

  coordinatesHint: {
    marginTop: 6,
    fontSize: 12,
  },

  attachmentButton: {
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },

  attachmentButtonText: {
    fontWeight: '600',
  },

  attachmentPreview: {
    marginTop: 12,
    alignItems: 'center',
  },

  image: {
    width: 200,
    height: 200,
    borderRadius: 8,
  },

  removeText: {
    marginTop: 8,
    fontSize: 14,
  },

  createButton: {
    marginTop: 24,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    minHeight: 52,
    justifyContent: 'center',
  },

  disabledButton: {
    opacity: 0.5,
  },

  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});