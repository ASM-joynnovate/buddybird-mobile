import { StyleSheet, View } from 'react-native';

import { BuddyBirdColors } from '@/constants/theme';

import { StrokeIcon } from './stroke-icon';

interface RadioMarkProps {
  active: boolean;
}

export function RadioMark({ active }: RadioMarkProps) {
  return (
    <View style={[styles.radio, active && styles.radioActive]}>
      {active ? <StrokeIcon color={BuddyBirdColors.onPrimary} name="check" size={14} strokeWidth={3} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  radio: {
    alignItems: 'center',
    borderColor: BuddyBirdColors.borderMuted,
    borderRadius: 999,
    borderWidth: 2.5,
    flexShrink: 0,
    height: 22,
    justifyContent: 'center',
    width: 22,
  },
  radioActive: {
    backgroundColor: BuddyBirdColors.primary,
    borderColor: BuddyBirdColors.primary,
    borderWidth: 0,
  },
});
