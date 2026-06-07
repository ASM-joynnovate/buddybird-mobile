import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { BuddyBirdColors, Radii, Spacing } from '@/constants/theme';

interface CardProps {
  children: React.ReactNode;
  raised?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Card({ children, raised = false, style }: CardProps) {
  return <View style={[styles.card, raised ? styles.raised : undefined, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: BuddyBirdColors.surface,
    borderColor: 'rgba(31,58,61,0.06)',
    borderRadius: Radii.card,
    borderWidth: 1,
    padding: Spacing.fieldPaddingX,
  },
  raised: {
    elevation: 3,
    shadowColor: BuddyBirdColors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
  },
});
