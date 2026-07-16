import { StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui/app-text';

import { IconSymbol, type IconSymbolName } from '@/components/ui/icon-symbol';
import { LedgeView } from '@/components/ui/ledge-surface';
import { BuddyBirdColors, Fonts, Radii, Typography } from '@/constants/theme';
import { useI18n } from '@/features/i18n/i18n-context';

type AchievementTone = 'streak' | 'primary' | 'secondary' | 'purple';

interface AchievementItem {
  done: boolean;
  icon: IconSymbolName;
  id: string;
  label: string;
  sub: string;
  tone: AchievementTone;
}

interface ProfileAchievementsGridProps {
  streakDays: number;
  todayLearningLabel: string;
  todayLearningSeconds: number;
  totalLearningLabel: string;
  totalLearningSeconds: number;
}

export function ProfileAchievementsGrid({
  streakDays,
  todayLearningLabel,
  todayLearningSeconds,
  totalLearningLabel,
  totalLearningSeconds,
}: ProfileAchievementsGridProps) {
  const { t } = useI18n();
  const items: AchievementItem[] = [
    {
      done: streakDays > 0,
      icon: 'flame.fill',
      id: 'streak',
      label: t('profile.streakAchievementLabel', { days: streakDays }),
      sub: t('profile.streakAchievementSub'),
      tone: 'streak',
    },
    {
      done: todayLearningSeconds > 0,
      icon: 'clock.fill',
      id: 'today',
      label: todayLearningLabel,
      sub: t('profile.todayAchievementSub'),
      tone: 'primary',
    },
    {
      done: totalLearningSeconds > 0,
      icon: 'clock.fill',
      id: 'total',
      label: totalLearningLabel,
      sub: t('profile.totalAchievementSub'),
      tone: 'secondary',
    },
    {
      done: false,
      icon: 'crown.fill',
      id: 'master',
      label: t('profile.masterAchievementLabel'),
      sub: t('profile.masterAchievementSub'),
      tone: 'purple',
    },
  ];

  return (
    <View style={styles.section}>
      <Text style={styles.title}>{t('profile.achievementsTitle')}</Text>
      <View style={styles.grid}>
        {items.map((item) => (
          <AchievementTile key={item.id} item={item} />
        ))}
      </View>
    </View>
  );
}

function AchievementTile({ item }: { item: AchievementItem }) {
  const toneStyle = toneStylesByTone[item.tone];
  const iconName = item.done ? item.icon : 'lock.fill';
  const iconColor = item.done ? toneStyle.color : BuddyBirdColors.inkMuted;

  return (
    <LedgeView
      baseStyle={styles.base}
      depth="card"
      faceStyle={[styles.tile, item.done ? undefined : styles.lockedTile]}
      style={styles.tileRoot}>
      <View style={[styles.iconBox, item.done ? toneStyle.tintStyle : styles.lockedIconBox]}>
        <IconSymbol color={iconColor} name={iconName} size={24} />
      </View>
      <View style={styles.copy}>
        <Text numberOfLines={1} adjustsFontSizeToFit style={styles.label}>
          {item.label}
        </Text>
        <Text numberOfLines={1} adjustsFontSizeToFit style={styles.sub}>
          {item.sub}
        </Text>
      </View>
    </LedgeView>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 12,
  },
  title: {
    ...Typography.section,
    color: BuddyBirdColors.ink,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tileRoot: {
    width: '48.5%',
  },
  base: {
    backgroundColor: BuddyBirdColors.border,
    borderRadius: Radii.sectionCard,
  },
  tile: {
    alignItems: 'center',
    backgroundColor: BuddyBirdColors.surface,
    borderColor: BuddyBirdColors.border,
    borderRadius: Radii.sectionCard,
    borderWidth: 2,
    flexDirection: 'row',
    gap: 12,
    minHeight: 78,
    padding: 14,
  },
  lockedTile: {
    opacity: 0.55,
  },
  iconBox: {
    alignItems: 'center',
    borderRadius: Radii.iconSquare,
    height: 46,
    justifyContent: 'center',
    width: 46,
  },
  lockedIconBox: {
    backgroundColor: BuddyBirdColors.surface1,
  },
  streakTint: {
    backgroundColor: BuddyBirdColors.orangeTint,
  },
  primaryTint: {
    backgroundColor: BuddyBirdColors.orangeTint,
  },
  secondaryTint: {
    backgroundColor: BuddyBirdColors.blueTint,
  },
  purpleTint: {
    backgroundColor: BuddyBirdColors.purpleTint,
  },
  copy: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  label: {
    color: BuddyBirdColors.ink,
    fontFamily: Fonts.bodyBlack,
    fontSize: 14,
    fontWeight: '900',
    lineHeight: 18,
  },
  sub: {
    color: BuddyBirdColors.inkMuted,
    fontFamily: Fonts.bodyBold,
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 14,
  },
});

const toneStylesByTone: Record<AchievementTone, { color: string; tintStyle: object }> = {
  primary: { color: BuddyBirdColors.primary, tintStyle: styles.primaryTint },
  purple: { color: BuddyBirdColors.accentPurple, tintStyle: styles.purpleTint },
  secondary: { color: BuddyBirdColors.secondary, tintStyle: styles.secondaryTint },
  streak: { color: BuddyBirdColors.streak, tintStyle: styles.streakTint },
};
