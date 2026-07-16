import { StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui/app-text';

import { BuddyBirdColors, Fonts, Radii, Spacing } from '@/constants/theme';
import { useI18n } from '@/features/i18n/i18n-context';

interface SessionPhaseBadgeProps {
  cycle: number;
  totalCycles: number;
}

export function SessionPhaseBadge({ cycle, totalCycles }: SessionPhaseBadgeProps) {
  const { t } = useI18n();
  return (
    <View style={styles.row}>
      <View style={styles.cycleBadge}>
        <Text style={styles.cycleText}>{t('sessionActive.cycleBadge', { cycle, total: totalCycles })}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.sm,
    justifyContent: 'center',
    marginTop: 16,
  },
  cycleBadge: {
    backgroundColor: BuddyBirdColors.surface1,
    borderColor: BuddyBirdColors.borderMuted,
    borderRadius: Radii.full,
    borderWidth: 2,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  cycleText: {
    color: BuddyBirdColors.inkMuted,
    fontFamily: Fonts.bodyExtraBold,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0,
  },
});
