import { StyleSheet, Text, View } from 'react-native';

import { PetHubColors, Spacing, Typography } from '@/constants/theme';

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
    ...Typography.bodySmall,
    color: PetHubColors.primary,
    fontWeight: '700',
  },
  error: {
    ...Typography.caption,
    color: PetHubColors.accentCoral,
  },
});
