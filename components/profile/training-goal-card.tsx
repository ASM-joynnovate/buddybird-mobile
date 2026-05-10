import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PetHubColors, Radii, Spacing, Typography } from '@/constants/theme';
import { useI18n } from '@/features/i18n/i18n-context';
import type { TrainingGoal } from '@/features/profile/profile-types';

interface TrainingGoalCardProps {
  goal: TrainingGoal;
  selected: boolean;
  onPress: () => void;
}

export function TrainingGoalCard({ goal, selected, onPress }: TrainingGoalCardProps) {
  const { t } = useI18n();

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={({ pressed }) => [styles.card, selected ? styles.selected : undefined, pressed ? styles.pressed : undefined]}>
      <View style={[styles.iconTile, selected ? styles.selectedIconTile : undefined]}>
        <MaterialIcons color={selected ? PetHubColors.surface : PetHubColors.secondary} name={goal.icon} size={22} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.label}>{goal.label}</Text>
        <Text style={styles.sample}>{goal.sample}</Text>
      </View>
      <Text style={[styles.check, selected ? styles.checkSelected : undefined]}>{selected ? t('common.selected') : t('common.add')}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    backgroundColor: PetHubColors.surface,
    borderColor: 'rgba(31,58,61,0.08)',
    borderRadius: Radii.sectionCard,
    borderWidth: 1,
    flexDirection: 'row',
    gap: Spacing.cardPaddingSm,
    padding: Spacing.cardPaddingSm,
  },
  selected: {
    backgroundColor: PetHubColors.secondaryTint,
    borderColor: PetHubColors.secondary,
  },
  pressed: {
    transform: [{ scale: 0.99 }],
  },
  iconTile: {
    alignItems: 'center',
    backgroundColor: 'rgba(42,157,143,0.10)',
    borderRadius: Radii.iconSquare,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  selectedIconTile: {
    backgroundColor: PetHubColors.secondary,
  },
  copy: {
    flex: 1,
    gap: 3,
  },
  label: {
    ...Typography.body,
    color: PetHubColors.primary,
    fontWeight: '700',
  },
  sample: {
    ...Typography.caption,
    color: 'rgba(31,58,61,0.62)',
  },
  check: {
    ...Typography.caption,
    color: 'rgba(31,58,61,0.44)',
    fontWeight: '700',
  },
  checkSelected: {
    color: PetHubColors.secondaryDeep,
  },
});
