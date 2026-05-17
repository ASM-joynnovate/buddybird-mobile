import { StyleSheet, Text, View } from 'react-native';

import { SectionKicker } from '@/components/ui/section-kicker';
import { BuddyBirdColors, Spacing, Typography } from '@/constants/theme';

interface ScreenHeaderProps {
  kicker: string;
  title: string;
  body?: string;
}

export function ScreenHeader({ kicker, title, body }: ScreenHeaderProps) {
  return (
    <View style={styles.header}>
      <SectionKicker tone="strong">{kicker}</SectionKicker>
      <Text style={styles.title}>{title}</Text>
      {body ? <Text style={styles.body}>{body}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: Spacing.sectionHeadGap,
  },
  title: {
    ...Typography.screenTitle,
    color: BuddyBirdColors.primary,
  },
  body: {
    ...Typography.body,
    color: 'rgba(31,58,61,0.68)',
  },
});
