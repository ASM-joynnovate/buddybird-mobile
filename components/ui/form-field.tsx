import { StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui/app-text';

import { BuddyBirdColors, Spacing, Typography } from '@/constants/theme';

interface FormFieldProps {
  label: string;
  error?: string;
  children: React.ReactNode;
}

export function FormField({ label, error, children }: FormFieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: Spacing.tabPaddingY,
  },
  label: {
    ...Typography.label,
    color: BuddyBirdColors.inkMuted,
    fontSize: 12.5,
    textTransform: 'uppercase',
  },
  error: {
    ...Typography.caption,
    color: BuddyBirdColors.accentCoral,
  },
});
