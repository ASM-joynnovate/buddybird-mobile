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
        placeholderTextColor={BuddyBirdColors.placeholderMuted}
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
    backgroundColor: BuddyBirdColors.neutralDeep,
    borderColor: BuddyBirdColors.borderMuted,
    borderRadius: Radii.field,
    borderWidth: 2,
    color: BuddyBirdColors.ink,
    fontSize: 15,
    fontWeight: '700',
    height: 48,
    paddingHorizontal: Spacing.fieldPaddingX,
  },
});
