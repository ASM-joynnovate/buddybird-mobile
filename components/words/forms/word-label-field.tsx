import { StyleSheet, TextInput } from 'react-native';

import { Card } from '@/components/ui/card';
import { SectionKicker } from '@/components/ui/section-kicker';
import { BuddyBirdColors, Radii, Spacing } from '@/constants/theme';

interface WordLabelFieldProps {
  sectionKicker: string;
  label: string;
  placeholder: string;
  onChange: (next: string) => void;
}

export function WordLabelField({ sectionKicker, label, placeholder, onChange }: WordLabelFieldProps) {
  return (
    <Card style={styles.card}>
      <SectionKicker>{sectionKicker}</SectionKicker>
      <TextInput
        style={styles.input}
        value={label}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="rgba(31,58,61,0.35)"
        returnKeyType="done"
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.sectionHeadGap,
  },
  input: {
    backgroundColor: '#fff',
    borderColor: 'rgba(31,58,61,0.12)',
    borderRadius: Radii.field,
    borderWidth: 0.5,
    color: BuddyBirdColors.primary,
    fontSize: 15,
    height: 48,
    paddingHorizontal: Spacing.fieldPaddingX,
  },
});
