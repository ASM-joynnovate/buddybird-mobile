import { StyleSheet, type StyleProp, type TextStyle } from 'react-native';
import { Text } from '@/components/ui/app-text';

import { BuddyBirdColors, Fonts } from '@/constants/theme';

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
    color: BuddyBirdColors.inkMuted,
    fontFamily: Fonts.bodyExtraBold,
    fontWeight: '800',
    letterSpacing: 0,
  },
  strong: {
    color: BuddyBirdColors.secondaryDeep,
    fontFamily: Fonts.bodyExtraBold,
    letterSpacing: 0,
  },
});
