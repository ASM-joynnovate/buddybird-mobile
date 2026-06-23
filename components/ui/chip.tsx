import { StyleSheet, Text, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';

import { BuddyBirdColors, Radii, Spacing } from '@/constants/theme';

import { Pressable3D } from './ledge-surface';

export type ChipTone = 'primary' | 'blue' | 'teal' | 'yellow' | 'sun' | 'red' | 'coral' | 'purple';

interface ChipProps {
  label: string;
  active?: boolean;
  tone?: ChipTone;
  onPress?: () => void;
}

export function Chip({ label, active = false, tone = 'primary', onPress }: ChipProps) {
  return (
    <Pressable3D
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      baseStyle={[styles.base, active ? baseStylesByTone[tone] : styles.baseInactive]}
      depth="chip"
      faceStyle={[styles.chip, active ? faceStylesByTone[tone] : styles.inactive]}
      hitSlop={6}
      onPress={onPress}>
      <Text style={[styles.label, active ? labelStylesByTone[tone] : styles.inactiveLabel]}>{label}</Text>
    </Pressable3D>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radii.full,
  },
  chip: {
    alignItems: 'center',
    borderRadius: Radii.full,
    borderWidth: 2,
    minHeight: 32,
    justifyContent: 'center',
    paddingHorizontal: Spacing.cardPaddingSm,
  },
  inactive: {
    backgroundColor: BuddyBirdColors.surface,
    borderColor: BuddyBirdColors.borderMuted,
  },
  baseInactive: {
    backgroundColor: BuddyBirdColors.borderMuted,
  },
  activePrimary: {
    backgroundColor: BuddyBirdColors.primary,
    borderColor: BuddyBirdColors.primaryShadow,
  },
  activeBlue: {
    backgroundColor: BuddyBirdColors.secondary,
    borderColor: BuddyBirdColors.secondaryPressed,
  },
  activeYellow: {
    backgroundColor: BuddyBirdColors.accentYellow,
    borderColor: BuddyBirdColors.accentYellowShadow,
  },
  activeRed: {
    backgroundColor: BuddyBirdColors.accentCoral,
    borderColor: BuddyBirdColors.accentCoralPressed,
  },
  activePurple: {
    backgroundColor: BuddyBirdColors.accentPurple,
    borderColor: BuddyBirdColors.accentPurplePressed,
  },
  basePrimary: {
    backgroundColor: BuddyBirdColors.primaryShadow,
  },
  baseBlue: {
    backgroundColor: BuddyBirdColors.secondaryPressed,
  },
  baseYellow: {
    backgroundColor: BuddyBirdColors.accentYellowShadow,
  },
  baseRed: {
    backgroundColor: BuddyBirdColors.accentCoralPressed,
  },
  basePurple: {
    backgroundColor: BuddyBirdColors.accentPurplePressed,
  },
  label: {
    fontSize: 13.5,
    fontWeight: '800',
    letterSpacing: 0,
  },
  activeLightLabel: {
    color: BuddyBirdColors.onPrimary,
  },
  activeDarkLabel: {
    color: BuddyBirdColors.ink,
  },
  inactiveLabel: {
    color: BuddyBirdColors.inkMuted,
  },
});

const faceStylesByTone: Record<ChipTone, StyleProp<ViewStyle>> = {
  primary: styles.activePrimary,
  blue: styles.activeBlue,
  teal: styles.activeBlue,
  yellow: styles.activeYellow,
  sun: styles.activeYellow,
  red: styles.activeRed,
  coral: styles.activeRed,
  purple: styles.activePurple,
};

const baseStylesByTone: Record<ChipTone, StyleProp<ViewStyle>> = {
  primary: styles.basePrimary,
  blue: styles.baseBlue,
  teal: styles.baseBlue,
  yellow: styles.baseYellow,
  sun: styles.baseYellow,
  red: styles.baseRed,
  coral: styles.baseRed,
  purple: styles.basePurple,
};

const labelStylesByTone: Record<ChipTone, StyleProp<TextStyle>> = {
  primary: styles.activeLightLabel,
  blue: styles.activeLightLabel,
  teal: styles.activeLightLabel,
  yellow: styles.activeDarkLabel,
  sun: styles.activeDarkLabel,
  red: styles.activeLightLabel,
  coral: styles.activeLightLabel,
  purple: styles.activeLightLabel,
};
