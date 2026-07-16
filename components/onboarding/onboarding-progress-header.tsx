import { Pressable, StyleSheet, View, type DimensionValue } from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { BuddyBirdColors, Radii, Spacing } from '@/constants/theme';
import { useI18n } from '@/features/i18n/i18n-context';

interface OnboardingProgressHeaderProps {
  step: number;
  total: number;
  onBack: () => void;
}

export function OnboardingProgressHeader({ step, total, onBack }: OnboardingProgressHeaderProps) {
  const { t } = useI18n();
  const progress = `${Math.max(0, Math.min(1, step / total)) * 100}%` as DimensionValue;

  return (
    <View style={styles.wrap}>
      <Pressable
        accessibilityLabel={t('common.closeA11y')}
        accessibilityRole="button"
        hitSlop={12}
        onPress={onBack}
        style={styles.closeButton}
      >
        <IconSymbol color={BuddyBirdColors.inkMuted} name="xmark" size={26} />
      </Pressable>
      <View accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: total, now: step }} style={styles.track}>
        <View style={[styles.fill, { width: progress }]}>
          <View pointerEvents="none" style={styles.shine} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.md,
    paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.buttonPaddingMd,
    paddingTop: Spacing.sm,
  },
  closeButton: {
    alignItems: 'center',
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  track: {
    backgroundColor: BuddyBirdColors.surface2,
    borderRadius: Radii.full,
    flex: 1,
    height: 16,
    overflow: 'hidden',
  },
  fill: {
    backgroundColor: BuddyBirdColors.primary,
    borderRadius: Radii.full,
    height: '100%',
    position: 'relative',
  },
  shine: {
    backgroundColor: BuddyBirdColors.shineWhite,
    borderRadius: Radii.full,
    height: 4,
    left: Spacing.xs,
    position: 'absolute',
    right: Spacing.xs,
    top: 3,
  },
});
