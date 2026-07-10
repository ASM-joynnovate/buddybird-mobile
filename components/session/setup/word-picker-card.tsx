import { useCallback } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Text } from '@/components/ui/app-text';

import { Pressable3D } from '@/components/ui/ledge-surface';
import { StrokeIcon } from '@/components/ui/stroke-icon';
import {
  BuddyBirdColors,
  Fonts,
  Radii,
  Spacing,
  categoryColor,
  categoryTint,
  withAlpha,
  withAlphaOverCanvas,
  type BuddyBirdCategory,
} from '@/constants/theme';

interface WordPickerCardProps {
  id: string;
  label: string;
  tag: string;
  active: boolean;
  onSelect: (id: string) => void;
  style?: StyleProp<ViewStyle>;
}

export function WordPickerCard({ id, label, tag, active, onSelect, style }: WordPickerCardProps) {
  const color = categoryColor[tag as BuddyBirdCategory] ?? BuddyBirdColors.primary;
  const tint = categoryTint[tag as BuddyBirdCategory] ?? withAlphaOverCanvas(color, 0.08);
  const initial = label.trim().charAt(0) || '?';
  const handlePress = useCallback(() => onSelect(id), [id, onSelect]);

  return (
    <Pressable3D
      accessibilityLabel={`${label} 선택`}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      baseStyle={[styles.base, active ? { backgroundColor: color } : styles.baseDefault]}
      depth="card"
      faceStyle={[
        styles.tile,
        active
          ? { backgroundColor: tint, borderColor: color }
          : undefined,
      ]}
      onPress={handlePress}
      style={style}>
      <View style={[styles.iconBox, { backgroundColor: active ? color : withAlpha(color, 0.12) }]}>
        <Text style={[styles.iconText, active ? styles.iconTextActive : styles.iconTextInactive]}>{initial}</Text>
      </View>
      <Text numberOfLines={1} style={styles.label}>{label}</Text>
      {active ? (
        <View style={[styles.badge, { backgroundColor: color }]}>
          <StrokeIcon color={BuddyBirdColors.onPrimary} name="check" size={10} strokeWidth={3.4} />
        </View>
      ) : null}
    </Pressable3D>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radii.md,
  },
  baseDefault: {
    backgroundColor: BuddyBirdColors.borderMuted,
  },
  tile: {
    alignItems: 'center',
    backgroundColor: BuddyBirdColors.surface,
    borderColor: BuddyBirdColors.borderMuted,
    borderRadius: Radii.md,
    borderWidth: 2,
    gap: Spacing.chipGap,
    paddingHorizontal: 6,
    paddingVertical: 12,
  },
  iconBox: {
    alignItems: 'center',
    borderRadius: Radii.iconSquare,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  iconText: {
    fontFamily: Fonts.bodyBlack,
    fontSize: 16,
    fontWeight: '900',
  },
  iconTextActive: {
    color: BuddyBirdColors.onPrimary,
  },
  iconTextInactive: {
    color: BuddyBirdColors.ink,
  },
  label: {
    color: BuddyBirdColors.ink,
    fontFamily: Fonts.bodyBlack,
    fontSize: 12.5,
    fontWeight: '900',
    lineHeight: 16,
    textAlign: 'center',
  },
  badge: {
    alignItems: 'center',
    borderRadius: Radii.full,
    height: 16,
    justifyContent: 'center',
    position: 'absolute',
    right: 6,
    top: 6,
    width: 16,
  },
});
