import { StyleSheet, Text } from 'react-native';

import { PetHubColors, Typography } from '@/constants/theme';

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
    color: PetHubColors.accentCoral,
    fontWeight: '700',
  },
});
