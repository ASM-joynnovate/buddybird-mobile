import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';

import { BuddyBirdColors, Radii, Spacing, Typography } from '@/constants/theme';

type PillButtonVariant = 'primary' | 'teal' | 'sun' | 'ghost';
type PillButtonSize = 'md' | 'lg';

interface PillButtonProps {
  label: string;
  variant?: PillButtonVariant;
  size?: PillButtonSize;
  full?: boolean;
  disabled?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

export function PillButton({
  label,
  variant = 'primary',
  size = 'md',
  full = false,
  disabled = false,
  onPress,
  accessibilityLabel,
  style,
}: PillButtonProps) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        size === 'lg' ? styles.large : styles.medium,
        full ? styles.full : undefined,
        styles[variant],
        disabled ? styles.disabled : undefined,
        pressed && !disabled ? styles.pressed : undefined,
        style,
      ]}>
      <Text style={[styles.label, variant === 'sun' || variant === 'ghost' ? styles.darkLabel : styles.lightLabel]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    borderRadius: Radii.full,
    justifyContent: 'center',
  },
  medium: {
    minHeight: 44,
    paddingHorizontal: Spacing.buttonPaddingMd,
  },
  large: {
    minHeight: 54,
    paddingHorizontal: Spacing.buttonPaddingLg,
  },
  full: {
    width: '100%',
  },
  primary: {
    backgroundColor: BuddyBirdColors.primary,
  },
  teal: {
    backgroundColor: BuddyBirdColors.secondary,
  },
  sun: {
    backgroundColor: BuddyBirdColors.tertiary,
  },
  ghost: {
    backgroundColor: 'rgba(31,58,61,0.06)',
  },
  disabled: {
    opacity: 0.42,
  },
  pressed: {
    transform: [{ scale: 0.98 }],
  },
  label: {
    ...Typography.button,
  },
  lightLabel: {
    color: BuddyBirdColors.neutral,
  },
  darkLabel: {
    color: BuddyBirdColors.primary,
  },
});
