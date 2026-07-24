import { StyleSheet, View, type StyleProp, type TextStyle } from 'react-native';
import { Text } from '@/components/ui/app-text';

import { BuddyBirdColors, Spacing, Typography } from '@/constants/theme';

interface FormFieldProps {
  label: string;
  error?: string;
  labelStyle?: StyleProp<TextStyle>;
  // 라벨 우측에 배치할 요소(예: 생년월일 '모름' 토글).
  labelAccessory?: React.ReactNode;
  children: React.ReactNode;
}

export function FormField({ label, error, labelStyle, labelAccessory, children }: FormFieldProps) {
  return (
    <View style={styles.field}>
      {labelAccessory ? (
        <View style={styles.labelRow}>
          <Text style={[styles.label, labelStyle]}>{label}</Text>
          {labelAccessory}
        </View>
      ) : (
        <Text style={[styles.label, labelStyle]}>{label}</Text>
      )}
      {children}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: Spacing.tabPaddingY,
  },
  labelRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
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
