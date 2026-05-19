import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { BuddyBirdColors, Radii } from '@/constants/theme';
import { formatAge, speciesLabel } from '@/features/profile/profile-display';
import type { ParrotProfile } from '@/features/profile/profile-types';

interface ParrotSummaryCardProps {
  profile: ParrotProfile;
}

export function ParrotSummaryCard({ profile }: ParrotSummaryCardProps) {
  const species = speciesLabel(profile.species);
  const age = formatAge(profile.ageMonths);

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.avatarCircle}>
          {profile.photoUri ? (
            <Image source={{ uri: profile.photoUri }} style={styles.photo} contentFit="cover" />
          ) : (
            <Text style={styles.avatarEmoji}>🦜</Text>
          )}
        </View>
        <View style={styles.info}>
          <Text style={styles.name}>{profile.name}</Text>
          <Text style={styles.meta}>{species} · {age}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: BuddyBirdColors.secondary,
    borderRadius: Radii.heroCard,
    overflow: 'hidden',
    padding: 18,
    shadowColor: 'rgba(42,157,143,1)',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 30,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 14,
  },
  avatarCircle: {
    alignItems: 'center',
    backgroundColor: BuddyBirdColors.feather,
    borderRadius: Radii.full,
    height: 64,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 64,
  },
  photo: {
    height: '100%',
    width: '100%',
  },
  avatarEmoji: {
    fontSize: 30,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  name: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  meta: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
  },
});
