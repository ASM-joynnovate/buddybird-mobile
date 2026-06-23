import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { IconSymbol, type IconSymbolName } from '@/components/ui/icon-symbol';
import { BuddyBirdColors, Depth, Typography } from '@/constants/theme';
import { reportError } from '@/features/analytics/error-reporter';
import { useI18n } from '@/features/i18n/i18n-context';

interface ProfileAvatarPickerProps {
  actionIcon?: IconSymbolName;
  photoUri?: string;
  onPhotoSelected: (photoUri: string) => void;
}

export function ProfileAvatarPicker({
  actionIcon = 'pencil',
  photoUri,
  onPhotoSelected,
}: ProfileAvatarPickerProps) {
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
    } catch (error: unknown) {
      reportError(error, { scope: 'profile.avatarPick' });
      setErrorMessage(t('profile.avatarError'));
    }
  }

  return (
    <View style={styles.wrap}>
      <Pressable
        accessibilityLabel="프로필 사진 선택"
        accessibilityRole="button"
        onPress={pickImage}
        style={styles.avatarButton}>
        <View style={styles.avatarClip}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.photo} contentFit="cover" />
          ) : (
            <View style={styles.placeholder}>
              <Text style={styles.emoji}>🦜</Text>
            </View>
          )}
        </View>
        <View pointerEvents="none" style={styles.editFabBase} />
        <View pointerEvents="none" style={styles.editFab}>
          <IconSymbol color={BuddyBirdColors.onPrimary} name={actionIcon} size={20} />
        </View>
      </Pressable>
      {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: 10,
  },
  avatarButton: {
    alignSelf: 'center',
    height: 110,
    position: 'relative',
    width: 110,
  },
  avatarClip: {
    borderColor: BuddyBirdColors.border,
    borderRadius: 55,
    borderWidth: 3,
    height: 110,
    overflow: 'hidden',
    width: 110,
  },
  photo: {
    height: '100%',
    width: '100%',
  },
  placeholder: {
    alignItems: 'center',
    backgroundColor: BuddyBirdColors.surface1,
    flex: 1,
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 52,
  },
  editFab: {
    alignItems: 'center',
    backgroundColor: BuddyBirdColors.primary,
    borderColor: BuddyBirdColors.surface,
    borderRadius: 19,
    borderWidth: 3,
    bottom: -2,
    height: 38,
    justifyContent: 'center',
    position: 'absolute',
    right: -2,
    width: 38,
  },
  editFabBase: {
    backgroundColor: BuddyBirdColors.primaryShadow,
    borderRadius: 19,
    bottom: -2 - Depth.cardSelected,
    height: 38,
    position: 'absolute',
    right: -2,
    width: 38,
  },
  error: {
    ...Typography.caption,
    color: BuddyBirdColors.accentCoral,
    textAlign: 'center',
  },
});
