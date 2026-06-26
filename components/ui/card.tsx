import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { BuddyBirdColors, Radii, Spacing } from '@/constants/theme';

import { LedgeView } from './ledge-surface';

interface CardProps {
  accentColor?: string;
  children: React.ReactNode;
  raised?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Card({ accentColor, children, raised = false, style }: CardProps) {
  return (
    <LedgeView
      baseStyle={[styles.base, accentColor ? { backgroundColor: accentColor } : undefined]}
      depth={raised ? 'selectedCard' : 'card'}
      faceStyle={[styles.card, accentColor ? { borderColor: accentColor } : undefined, style]}>
      {children}
    </LedgeView>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: BuddyBirdColors.borderMuted,
    borderRadius: Radii.card,
  },
  card: {
    backgroundColor: BuddyBirdColors.surface,
    borderColor: BuddyBirdColors.borderMuted,
    borderRadius: Radii.card,
    borderWidth: 2,
    padding: Spacing.fieldPaddingX,
  },
});
