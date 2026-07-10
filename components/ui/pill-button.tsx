import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Text } from '@/components/ui/app-text';

import { BuddyBirdColors, Fonts, Radii, Spacing, Typography } from '@/constants/theme';

import { IconSymbol, type IconSymbolName } from './icon-symbol';
import { Pressable3D, type LedgeDepth } from './ledge-surface';

type PillButtonVariant = 'primary' | 'blue' | 'teal' | 'yellow' | 'sun' | 'red' | 'danger' | 'white' | 'ghost';
type PillButtonSize = 'sm' | 'md' | 'lg';

interface PillButtonProps {
  label: string;
  variant?: PillButtonVariant;
  size?: PillButtonSize;
  full?: boolean;
  disabled?: boolean;
  onPress?: () => void;
  icon?: IconSymbolName;
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
  icon,
  accessibilityLabel,
  style,
}: PillButtonProps) {
  const isQuietVariant = variant === 'ghost' || variant === 'white';
  const isYellowVariant = variant === 'yellow' || variant === 'sun';
  const isKoreanLabel = /[ㄱ-ㅎㅏ-ㅣ가-힣]/.test(label);
  let labelToneStyle = styles.lightLabel;

  if (disabled) {
    labelToneStyle = styles.disabledLabel;
  } else if (variant === 'white') {
    labelToneStyle = styles.whiteLabel;
  } else if (isQuietVariant) {
    labelToneStyle = styles.ghostLabel;
  } else if (isYellowVariant) {
    labelToneStyle = styles.darkLabel;
  }
  const iconColor = getIconColor({ disabled, isQuietVariant, isYellowVariant, variant });

  return (
    <Pressable3D
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      baseStyle={[styles.base, baseStylesByVariant[disabled ? 'disabled' : variant]]}
      depth={disabled ? 'flat' : depthsBySize[size]}
      disabled={disabled}
      faceStyle={[
        styles.face,
        sizeStylesBySize[size],
        styles[variant],
        disabled ? styles.disabled : undefined,
        full ? styles.full : undefined,
      ]}
      onPress={onPress}
      style={[full ? styles.full : undefined, style]}>
      <View style={styles.content}>
        {icon ? <IconSymbol color={iconColor} name={icon} size={sizeIconBySize[size]} /> : null}
        <Text style={[styles.label, isKoreanLabel ? styles.labelKorean : styles.labelLatin, labelToneStyle]}>
          {label}
        </Text>
      </View>
    </Pressable3D>
  );
}

function getIconColor({
  disabled,
  isQuietVariant,
  isYellowVariant,
  variant,
}: {
  disabled: boolean;
  isQuietVariant: boolean;
  isYellowVariant: boolean;
  variant: PillButtonVariant;
}) {
  if (disabled) return BuddyBirdColors.disabledFg;
  if (variant === 'white') return BuddyBirdColors.primary;
  if (isQuietVariant || isYellowVariant) return BuddyBirdColors.ink;
  return BuddyBirdColors.onPrimary;
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radii.lg,
  },
  face: {
    alignItems: 'center',
    backgroundColor: BuddyBirdColors.primary,
    borderRadius: Radii.lg,
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
  small: {
    minHeight: 42,
    paddingHorizontal: Spacing.cardPaddingSm,
  },
  medium: {
    minHeight: 52,
    paddingHorizontal: Spacing.buttonPaddingMd,
  },
  large: {
    minHeight: 58,
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
  blue: {
    backgroundColor: BuddyBirdColors.secondary,
  },
  sun: {
    backgroundColor: BuddyBirdColors.accentYellow,
  },
  yellow: {
    backgroundColor: BuddyBirdColors.accentYellow,
  },
  danger: {
    backgroundColor: BuddyBirdColors.accentCoral,
  },
  red: {
    backgroundColor: BuddyBirdColors.accentCoral,
  },
  white: {
    backgroundColor: BuddyBirdColors.surface,
    borderColor: BuddyBirdColors.borderMuted,
    borderWidth: 2,
  },
  ghost: {
    backgroundColor: BuddyBirdColors.surface,
    borderColor: BuddyBirdColors.borderMuted,
    borderWidth: 2,
  },
  disabled: {
    backgroundColor: BuddyBirdColors.disabledBg,
  },
  label: {
    ...Typography.button,
    flexShrink: 1,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  labelKorean: {
    fontFamily: Fonts.bodyExtraBold,
  },
  labelLatin: {
    fontFamily: Fonts.displayExtraBold,
  },
  lightLabel: {
    color: BuddyBirdColors.onDark,
  },
  darkLabel: {
    color: BuddyBirdColors.onYellow,
  },
  ghostLabel: {
    color: BuddyBirdColors.inkSoft,
  },
  whiteLabel: {
    color: BuddyBirdColors.ink,
  },
  disabledLabel: {
    color: BuddyBirdColors.disabledFg,
  },
  basePrimary: {
    backgroundColor: BuddyBirdColors.primaryShadow,
  },
  baseSecondary: {
    backgroundColor: BuddyBirdColors.secondaryPressed,
  },
  baseYellow: {
    backgroundColor: BuddyBirdColors.accentYellowShadow,
  },
  baseRed: {
    backgroundColor: BuddyBirdColors.accentCoralPressed,
  },
  baseNeutral: {
    backgroundColor: BuddyBirdColors.borderMuted,
  },
  baseDisabled: {
    backgroundColor: BuddyBirdColors.borderStrong,
  },
});

const depthsBySize: Record<PillButtonSize, LedgeDepth> = {
  sm: 'buttonSm',
  md: 'buttonMd',
  lg: 'buttonLg',
};

const sizeStylesBySize: Record<PillButtonSize, StyleProp<ViewStyle>> = {
  sm: styles.small,
  md: styles.medium,
  lg: styles.large,
};

const sizeIconBySize: Record<PillButtonSize, number> = {
  sm: 18,
  md: 20,
  lg: 21,
};

const baseStylesByVariant: Record<PillButtonVariant | 'disabled', StyleProp<ViewStyle>> = {
  primary: styles.basePrimary,
  blue: styles.baseSecondary,
  teal: styles.baseSecondary,
  yellow: styles.baseYellow,
  sun: styles.baseYellow,
  red: styles.baseRed,
  danger: styles.baseRed,
  white: styles.baseNeutral,
  ghost: styles.baseNeutral,
  disabled: styles.baseDisabled,
};
