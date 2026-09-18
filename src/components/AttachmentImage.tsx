import { useState } from 'react';
import {
  Image,
  StyleSheet,
  Text,
  View,
} from 'react-native';

interface AttachmentImageProps {
  uri: string;
  width?: number | string;
  height?: number;
}

export default function AttachmentImage({
  uri,
  width = '100%',
  height = 240,
}: AttachmentImageProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError || !uri) {
    return (
      <View
        style={[
          styles.errorContainer,
          {
            width,
            height,
          },
        ]}
      >
        <Text style={styles.errorTitle}>
          Image unavailable
        </Text>

        <Text style={styles.errorDescription}>
          This attachment could not be loaded.
        </Text>
      </View>
    );
  }

  return (
    <Image
      source={{ uri }}
      style={{
        width,
        height,
        borderRadius: 10,
      }}
      onError={() => setHasError(true)}
    />
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    borderRadius: 10,
    backgroundColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },

  errorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#444',
  },

  errorDescription: {
    marginTop: 4,
    fontSize: 13,
    color: '#777',
    textAlign: 'center',
  },
});