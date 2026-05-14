import { StyleSheet, Text, type StyleProp, type TextStyle } from 'react-native';

import { PetHubColors } from '@/constants/theme';

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
    color: 'rgba(31,58,61,0.55)',
    fontWeight: '500',
    letterSpacing: 0.6,
  },
  strong: {
    color: PetHubColors.secondaryDeep,
    fontWeight: '700',
    letterSpacing: 4,
  },
});
