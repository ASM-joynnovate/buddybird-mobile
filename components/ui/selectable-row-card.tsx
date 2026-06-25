import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { BuddyBirdColors, Radii, Spacing } from '@/constants/theme';

import { Pressable3D } from './ledge-surface';
import { RadioMark } from './radio-mark';

interface SelectableRowCardProps {
  active: boolean;
  onPress: () => void;
  children: React.ReactNode;
  radioPosition?: 'left' | 'right';
  style?: StyleProp<ViewStyle>;
}

export function SelectableRowCard({
  active,
  onPress,
  children,
  radioPosition = 'right',
  style,
}: SelectableRowCardProps) {
  return (
    <Pressable3D
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      baseStyle={[styles.base, active ? styles.baseActive : styles.baseDefault]}
      depth="selectedCard"
      faceStyle={[styles.card, active && styles.cardActive, style]}
      onPress={onPress}>
      <View style={styles.row}>
        {radioPosition === 'left' ? <RadioMark active={active} /> : null}
        {children}
        {radioPosition === 'right' ? <RadioMark active={active} /> : null}
      </View>
    </Pressable3D>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radii.lg,
  },
  baseDefault: {
    backgroundColor: BuddyBirdColors.borderMuted,
  },
  baseActive: {
    backgroundColor: BuddyBirdColors.primary,
  },
  card: {
    backgroundColor: BuddyBirdColors.surface,
    borderColor: BuddyBirdColors.borderMuted,
    borderRadius: Radii.lg,
    borderWidth: 2,
    minHeight: 72,
    padding: Spacing.cardPaddingSm,
  },
  cardActive: {
    backgroundColor: BuddyBirdColors.surface,
    borderColor: BuddyBirdColors.primary,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.sectionHeadGap,
  },
});
