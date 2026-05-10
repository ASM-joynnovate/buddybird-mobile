import { Pressable, StyleSheet, Text } from 'react-native';

import { PetHubColors, Radii, Spacing } from '@/constants/theme';

type ChipTone = 'teal' | 'sun' | 'coral';

interface ChipProps {
  label: string;
  active?: boolean;
  tone?: ChipTone;
  onPress?: () => void;
}

const activeBackgroundByTone: Record<ChipTone, string> = {
  teal: PetHubColors.secondary,
  sun: PetHubColors.tertiary,
  coral: PetHubColors.accentCoral,
};

export function Chip({ label, active = false, tone = 'teal', onPress }: ChipProps) {
  const activeBackgroundColor = activeBackgroundByTone[tone];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        active ? { backgroundColor: activeBackgroundColor } : styles.inactive,
        pressed ? styles.pressed : undefined,
      ]}>
      <Text style={[styles.label, active ? styles.activeLabel : styles.inactiveLabel]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignItems: 'center',
    borderRadius: Radii.full,
    minHeight: 32,
    justifyContent: 'center',
    paddingHorizontal: Spacing.cardPaddingSm,
  },
  inactive: {
    backgroundColor: 'rgba(31,58,61,0.06)',
  },
  pressed: {
    transform: [{ scale: 0.97 }],
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: -0.13,
  },
  activeLabel: {
    color: PetHubColors.surface,
  },
  inactiveLabel: {
    color: PetHubColors.primary,
  },
});
