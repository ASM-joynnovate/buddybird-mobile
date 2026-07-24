import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui/app-text';

import { LedgeView } from '@/components/ui/ledge-surface';
import { BuddyBirdColors, Fonts, Radii } from '@/constants/theme';
import { useI18n } from '@/features/i18n/i18n-context';
import { parseBirthDate } from '@/features/profile/profile-age';
import { getSpeciesLabel } from '@/features/profile/profile-options';
import type { ParrotProfile } from '@/features/profile/profile-types';

interface ParrotProfileCardProps {
  profile: ParrotProfile;
}

export function ParrotProfileCard({ profile }: ParrotProfileCardProps) {
  const { locale } = useI18n();
  const speciesLabel = getSpeciesLabel(locale, profile.species);
  const birthDateLabel = profile.birthDate ? formatBirthDateLabel(profile.birthDate) : null;

  return (
    <LedgeView baseStyle={styles.base} depth="buttonSm" faceStyle={styles.card}>
      <View style={styles.row}>
        <View style={styles.avatar}>
          {profile.photoUri ? (
            <Image source={{ uri: profile.photoUri }} style={styles.photo} contentFit="cover" />
          ) : (
            <Text style={styles.avatarEmoji}>🦜</Text>
          )}
        </View>
        <View style={styles.textWrap}>
          <Text numberOfLines={1} style={styles.name}>{profile.name}</Text>
          <Text numberOfLines={1} style={styles.meta}>{speciesLabel}</Text>
          {birthDateLabel ? (
            <Text numberOfLines={1} style={styles.birthDate}>{birthDateLabel}</Text>
          ) : null}
        </View>
      </View>
    </LedgeView>
  );
}

// 생년월일 표시용 'YYYY. M. D.' (로케일 무관 숫자 포맷).
function formatBirthDateLabel(birthDate: string): string {
  const { year, month, day } = parseBirthDate(birthDate);
  return `${year}. ${month}. ${day}.`;
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: BuddyBirdColors.primaryShadow,
    borderRadius: Radii.xl,
  },
  card: {
    backgroundColor: BuddyBirdColors.primary,
    borderRadius: Radii.xl,
    padding: 20,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 16,
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: BuddyBirdColors.surface,
    borderRadius: Radii.full,
    height: 80,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 80,
  },
  photo: {
    height: '100%',
    width: '100%',
  },
  avatarEmoji: {
    fontSize: 36,
  },
  textWrap: {
    flex: 1,
    gap: 3,
  },
  name: {
    color: BuddyBirdColors.onPrimary,
    fontFamily: Fonts.bodyBlack,
    fontSize: 24,
    fontWeight: '900',
    lineHeight: 30,
  },
  meta: {
    color: BuddyBirdColors.onDarkMuted,
    fontFamily: Fonts.bodyBold,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  birthDate: {
    color: BuddyBirdColors.onDarkMuted,
    fontFamily: Fonts.bodyBold,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
  },
});
