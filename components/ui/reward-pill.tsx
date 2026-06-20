import { StyleSheet, Text, View } from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { BuddyBirdColors, Radii } from '@/constants/theme';

type RewardPillTone = 'streak' | 'xp' | 'listen' | 'success';

interface RewardPillProps {
  icon: Parameters<typeof IconSymbol>[0]['name'];
  label: string;
  tone?: RewardPillTone;
}

export function RewardPill({ icon, label, tone = 'success' }: RewardPillProps) {
  return (
    <View style={[styles.pill, pillStylesByTone[tone]]}>
      <IconSymbol name={icon} size={15} color={iconColorsByTone[tone]} />
      <Text style={[styles.label, labelStylesByTone[tone]]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignItems: 'center',
    borderRadius: Radii.full,
    borderWidth: 1.5,
    flexDirection: 'row',
    gap: 5,
    minHeight: 32,
    paddingHorizontal: 10,
  },
  label: {
    fontSize: 12,
    fontWeight: '800',
  },
  pillStreak: {
    backgroundColor: BuddyBirdColors.tertiaryDeep,
    borderColor: BuddyBirdColors.tertiaryPressed,
  },
  pillXp: {
    backgroundColor: BuddyBirdColors.accentYellow,
    borderColor: BuddyBirdColors.accentYellowShadow,
  },
  pillListen: {
    backgroundColor: BuddyBirdColors.secondaryDeep,
    borderColor: BuddyBirdColors.secondaryPressed,
  },
  pillSuccess: {
    backgroundColor: BuddyBirdColors.primaryDeep,
    borderColor: BuddyBirdColors.primaryPressed,
  },
  labelLight: {
    color: BuddyBirdColors.onDark,
  },
  labelDark: {
    color: BuddyBirdColors.ink,
  },
});

const pillStylesByTone = {
  streak: styles.pillStreak,
  xp: styles.pillXp,
  listen: styles.pillListen,
  success: styles.pillSuccess,
};

const labelStylesByTone = {
  streak: styles.labelLight,
  xp: styles.labelDark,
  listen: styles.labelLight,
  success: styles.labelLight,
};

const iconColorsByTone: Record<RewardPillTone, string> = {
  streak: BuddyBirdColors.onDark,
  xp: BuddyBirdColors.ink,
  listen: BuddyBirdColors.onDark,
  success: BuddyBirdColors.onDark,
};
