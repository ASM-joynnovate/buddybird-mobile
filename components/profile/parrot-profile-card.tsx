import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { BuddyBirdColors, Radii, Spacing, Typography } from '@/constants/theme';
import { useI18n } from '@/features/i18n/i18n-context';
import { getSpeciesLabel } from '@/features/profile/profile-options';
import type { ParrotProfile } from '@/features/profile/profile-types';
import { formatAgeMonths } from '@/features/profile/profile-validation';

interface ParrotProfileCardProps {
  profile: ParrotProfile;
  compact?: boolean;
}

export function ParrotProfileCard({ profile, compact = false }: ParrotProfileCardProps) {
  const { locale, t } = useI18n();
  const speciesLabel = getSpeciesLabel(locale, profile.species);

  return (
    <Card raised style={styles.card}>
      <View style={styles.row}>
        <View style={[styles.avatar, compact ? styles.compactAvatar : undefined]}>
          {profile.photoUri ? (
            <Image source={{ uri: profile.photoUri }} style={styles.photo} contentFit="cover" />
          ) : (
            <Text style={styles.avatarEmoji}>🦜</Text>
          )}
        </View>
        <View style={styles.textWrap}>
          <Text style={styles.name}>{profile.name}</Text>
          <Text style={styles.meta}>
            {speciesLabel} · {formatAgeMonths(profile.ageMonths, t)}
          </Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: BuddyBirdColors.secondary,
    borderWidth: 0,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.cardPaddingSm,
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: BuddyBirdColors.feather,
    borderRadius: Radii.full,
    height: 64,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 64,
  },
  compactAvatar: {
    height: 54,
    width: 54,
  },
  photo: {
    height: '100%',
    width: '100%',
  },
  avatarEmoji: {
    fontSize: 30,
  },
  textWrap: {
    flex: 1,
    gap: 3,
  },
  name: {
    ...Typography.cardTitle,
    color: BuddyBirdColors.surface,
  },
  meta: {
    ...Typography.bodySmall,
    color: 'rgba(255,255,255,0.88)',
  },
});
