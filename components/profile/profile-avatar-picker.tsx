import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PetHubColors, Radii, Typography } from '@/constants/theme';
import { useI18n } from '@/features/i18n/i18n-context';

interface ProfileAvatarPickerProps {
  photoUri?: string;
  onPhotoSelected: (photoUri: string) => void;
}

export function ProfileAvatarPicker({ photoUri, onPhotoSelected }: ProfileAvatarPickerProps) {
  const { t } = useI18n();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function pickImage(): Promise<void> {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        mediaTypes: ['images'],
        quality: 0.85,
      });

      if (!result.canceled && result.assets[0]?.uri) {
        onPhotoSelected(result.assets[0].uri);
        setErrorMessage(null);
      }
    } catch {
      setErrorMessage(t('profile.avatarError'));
    }
  }

  return (
    <View style={styles.wrap}>
      <Pressable accessibilityRole="button" onPress={pickImage} style={styles.avatarButton}>
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.photo} contentFit="cover" />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.emoji}>🦜</Text>
            <Text style={styles.placeholderText}>{t('profile.avatarSelect')}</Text>
          </View>
        )}
      </Pressable>
      {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: 8,
  },
  avatarButton: {
    alignSelf: 'center',
    borderRadius: Radii.avatarLg,
    height: 120,
    overflow: 'hidden',
    width: 120,
  },
  photo: {
    height: '100%',
    width: '100%',
  },
  placeholder: {
    alignItems: 'center',
    backgroundColor: PetHubColors.feather,
    flex: 1,
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 42,
  },
  placeholderText: {
    ...Typography.caption,
    color: PetHubColors.primary,
    fontWeight: '700',
  },
  error: {
    ...Typography.caption,
    color: PetHubColors.accentCoral,
    textAlign: 'center',
  },
});
