import { StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui/app-text';

import { SectionKicker } from '@/components/ui/section-kicker';
import { BuddyBirdColors, Spacing, Typography } from '@/constants/theme';

interface ScreenHeaderProps {
  kicker?: string;
  title: string;
  body?: string;
}

export function ScreenHeader({ kicker, title, body }: ScreenHeaderProps) {
  return (
    <View style={styles.header}>
      {kicker ? <SectionKicker tone="strong">{kicker}</SectionKicker> : null}
      <Text style={styles.title}>{title}</Text>
      {body ? <Text style={styles.body}>{body}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: Spacing.xxs,
  },
  title: {
    ...Typography.screenTitle,
    color: BuddyBirdColors.ink,
  },
  body: {
    ...Typography.bodySmall,
    color: BuddyBirdColors.inkMuted,
    fontSize: 13.5,
    lineHeight: 19,
  },
});
