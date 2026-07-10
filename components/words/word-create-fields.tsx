import { StyleSheet, View } from 'react-native';
import { TextInput } from '@/components/ui/app-text';

import { Chip, type ChipTone } from '@/components/ui/chip';
import { FormField } from '@/components/ui/form-field';
import { BuddyBirdColors, Fonts, Radii, Spacing } from '@/constants/theme';
import { WORD_TAGS, type WordTag } from '@/features/word-library/word-library-types';

interface WordCreateFieldsProps {
  wordLabel: string;
  categoryLabel: string;
  label: string;
  placeholder: string;
  tag: WordTag;
  onChangeLabel: (label: string) => void;
  onChangeTag: (tag: WordTag) => void;
}

export function WordCreateFields({
  wordLabel,
  categoryLabel,
  label,
  placeholder,
  tag,
  onChangeLabel,
  onChangeTag,
}: WordCreateFieldsProps) {
  return (
    <View style={styles.block}>
      <FormField label={wordLabel}>
        <TextInput
          autoCapitalize="none"
          onChangeText={onChangeLabel}
          placeholder={placeholder}
          placeholderTextColor={BuddyBirdColors.placeholderMuted}
          returnKeyType="done"
          style={styles.input}
          value={label}
        />
      </FormField>

      <FormField label={categoryLabel}>
        <View style={styles.chipRow}>
          {WORD_TAGS.map((wordTag) => (
            <Chip
              active={tag === wordTag}
              key={wordTag}
              label={wordTag}
              onPress={() => onChangeTag(wordTag)}
              tone={toneByTag[wordTag]}
            />
          ))}
        </View>
      </FormField>
    </View>
  );
}

const toneByTag: Record<WordTag, ChipTone> = {
  인사: 'primary',
  음식: 'blue',
  이름: 'purple',
  기타: 'primary',
};

const styles = StyleSheet.create({
  block: {
    gap: 14,
  },
  input: {
    backgroundColor: BuddyBirdColors.surface,
    borderColor: BuddyBirdColors.borderMuted,
    borderRadius: Radii.field,
    borderWidth: 2,
    color: BuddyBirdColors.ink,
    fontFamily: Fonts.bodyBold,
    fontSize: 16,
    fontWeight: '700',
    minHeight: 50,
    paddingHorizontal: Spacing.fieldPaddingX,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});
