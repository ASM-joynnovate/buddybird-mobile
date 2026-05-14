import { StyleSheet, Text, View } from 'react-native';

import { SectionKicker } from '@/components/ui/section-kicker';
import { useI18n } from '@/features/i18n/i18n-context';
import type { WordEntry } from '@/features/word-library/word-library-types';

import { PresetWordCard } from './preset-word-card';

interface PresetWordPickerProps {
  entries: WordEntry[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  getSessionCount: (id: string) => number;
}

export function PresetWordPicker({ entries, selectedId, onSelect, getSessionCount }: PresetWordPickerProps) {
  const { t } = useI18n();
  if (entries.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>{t('sessionSetupExtra.emptyLibrary')}</Text>
      </View>
    );
  }
  return (
    <View style={styles.section}>
      <View style={styles.head}>
        <SectionKicker>학습할 단어</SectionKicker>
      </View>
      {entries.map((entry) => (
        <PresetWordCard
          key={entry.id}
          entry={entry}
          active={selectedId === entry.id}
          onSelect={() => onSelect(entry.id)}
          sessionCount={getSessionCount(entry.id)}
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
  empty: {
    alignItems: 'center',
    backgroundColor: 'rgba(31,58,61,0.04)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  emptyText: {
    color: 'rgba(31,58,61,0.55)',
    fontSize: 13,
    textAlign: 'center',
  },
});
