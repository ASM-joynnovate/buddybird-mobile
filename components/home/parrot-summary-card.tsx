import { StyleSheet, Text, View } from 'react-native';

import { PetHubColors, Radii } from '@/constants/theme';
import { formatAge, speciesLabel } from '@/features/profile/profile-display';
import type { ParrotProfile } from '@/features/profile/profile-types';

interface ParrotSummaryCardProps {
  profile: ParrotProfile;
}

export function ParrotSummaryCard({ profile }: ParrotSummaryCardProps) {
  const species = speciesLabel(profile.species, profile.customSpecies);
  const age = formatAge(profile.ageMonths);

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarEmoji}>{profile.photoUri ? '' : '🦜'}</Text>
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
    backgroundColor: PetHubColors.secondary,
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
    backgroundColor: PetHubColors.feather,
    borderColor: 'rgba(255,255,255,0.4)',
    borderRadius: Radii.full,
    borderWidth: 3,
    height: 64,
    justifyContent: 'center',
    width: 64,
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
