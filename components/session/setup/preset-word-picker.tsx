import { StyleSheet, View } from 'react-native';

import { SectionKicker } from '@/components/ui/section-kicker';
import { PRESET_WORDS } from '@/features/training/session-config';

import { PresetWordCard } from './preset-word-card';

interface PresetWordPickerProps {
  selectedKey: string;
  onSelect: (key: string) => void;
  getSessionCount: (key: string) => number;
}

export function PresetWordPicker({ selectedKey, onSelect, getSessionCount }: PresetWordPickerProps) {
  return (
    <View style={styles.section}>
      <View style={styles.head}>
        <SectionKicker>학습할 단어</SectionKicker>
      </View>
      {PRESET_WORDS.map((w) => (
        <PresetWordCard
          key={w.key}
          word={w}
          active={selectedKey === w.key}
          onSelect={() => onSelect(w.key)}
          sessionCount={getSessionCount(w.key)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 8,
  },
  head: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
});
