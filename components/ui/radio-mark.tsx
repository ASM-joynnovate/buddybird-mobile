import { StyleSheet, View } from 'react-native';

import { BuddyBirdColors } from '@/constants/theme';

interface RadioMarkProps {
  active: boolean;
}

export function RadioMark({ active }: RadioMarkProps) {
  return (
    <View style={[styles.radio, active && styles.radioActive]}>
      {active && <View style={styles.radioDot} />}
    </View>
  );
}

const styles = StyleSheet.create({
  radio: {
    alignItems: 'center',
    borderColor: 'rgba(31,58,61,0.2)',
    borderRadius: 999,
    borderWidth: 1.5,
    height: 22,
    justifyContent: 'center',
    width: 22,
  },
  radioActive: {
    backgroundColor: BuddyBirdColors.secondary,
    borderWidth: 0,
  },
  radioDot: {
    backgroundColor: '#fff',
    borderRadius: 999,
    height: 8,
    width: 8,
  },
});
