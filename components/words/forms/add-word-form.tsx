import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { PillButton } from '@/components/ui/pill-button';
import { PetHubColors, Radii, Spacing, Typography } from '@/constants/theme';

import { FilterChip } from '../word-filter-bar';

interface AddWordFormProps {
  cats: readonly string[];
  onCancel: () => void;
  onAdd: (word: string, cat: string) => void;
}

export function AddWordForm({ cats, onCancel, onAdd }: AddWordFormProps) {
  const [newWord, setNewWord] = useState('');
  const [newCat, setNewCat] = useState(cats[0] ?? '인사');

  function submit(): void {
    if (!newWord.trim()) return;
    onAdd(newWord.trim(), newCat);
    setNewWord('');
  }

  return (
    <Card style={styles.card}>
      <Text style={styles.title}>새 단어 추가</Text>
      <TextInput
        style={styles.input}
        value={newWord}
        onChangeText={setNewWord}
        placeholder="단어 입력 (예: 사랑해)"
        placeholderTextColor="rgba(31,58,61,0.35)"
        returnKeyType="done"
        onSubmitEditing={submit}
      />
      <View style={styles.chips}>
        {cats.map((c) => (
          <FilterChip key={c} cat={c} active={newCat === c} onPress={() => setNewCat(c)} />
        ))}
      </View>
      <View style={styles.actions}>
        <PillButton full label="취소" variant="ghost" onPress={() => { setNewWord(''); onCancel(); }} />
        <PillButton full label="추가" variant="teal" onPress={submit} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 12,
  },
  title: {
    ...Typography.bodySmall,
    color: PetHubColors.primary,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#fff',
    borderColor: 'rgba(31,58,61,0.12)',
    borderRadius: Radii.field,
    borderWidth: 0.5,
    color: PetHubColors.primary,
    fontSize: 15,
    height: 48,
    paddingHorizontal: Spacing.fieldPaddingX,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
});
