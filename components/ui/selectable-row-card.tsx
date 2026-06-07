import { StyleSheet, TouchableOpacity, View, type StyleProp, type ViewStyle } from 'react-native';

import { BuddyBirdColors, Radii } from '@/constants/theme';

import { RadioMark } from './radio-mark';

interface SelectableRowCardProps {
  active: boolean;
  onPress: () => void;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function SelectableRowCard({ active, onPress, children, style }: SelectableRowCardProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[styles.card, active && styles.cardActive, style]}
    >
      <View style={styles.row}>
        {children}
        <RadioMark active={active} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(31,58,61,0.08)',
    borderRadius: Radii.listItem,
    borderWidth: 0.5,
    padding: 12,
  },
  cardActive: {
    backgroundColor: BuddyBirdColors.primary,
    borderWidth: 0,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
});
