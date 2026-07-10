import { StyleSheet } from 'react-native';
import { Text } from '@/components/ui/app-text';

import { BuddyBirdColors, Typography } from '@/constants/theme';

interface InlineErrorProps {
  message?: string | null;
}

export function InlineError({ message }: InlineErrorProps) {
  if (!message) return null;
  return <Text style={styles.error}>{message}</Text>;
}

const styles = StyleSheet.create({
  error: {
    ...Typography.bodySmall,
    color: BuddyBirdColors.accentCoral,
    fontWeight: '700',
  },
});
