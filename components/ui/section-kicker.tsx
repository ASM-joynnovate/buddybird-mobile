import { StyleSheet, Text, type StyleProp, type TextStyle } from 'react-native';

import { BuddyBirdColors } from '@/constants/theme';

export type SectionKickerTone = 'default' | 'strong';

interface SectionKickerProps {
  children: React.ReactNode;
  tone?: SectionKickerTone;
  style?: StyleProp<TextStyle>;
}

export function SectionKicker({ children, tone = 'default', style }: SectionKickerProps) {
  return <Text style={[styles.base, tone === 'strong' ? styles.strong : styles.default, style]}>{children}</Text>;
}

const styles = StyleSheet.create({
  base: {
    fontSize: 11,
  },
  default: {
    color: BuddyBirdColors.kickerMuted,
    fontWeight: '500',
    letterSpacing: 0.6,
  },
  strong: {
    color: BuddyBirdColors.secondaryDeep,
    fontWeight: '700',
    letterSpacing: 4,
  },
});
