import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { WordCreateModal } from '@/components/words/word-create-modal';
import { WordEditModal } from '@/components/words/word-edit-modal';
import { WordFilterBar } from '@/components/words/word-filter-bar';
import { WordListItem } from '@/components/words/word-list-item';
import { PetHubColors, Radii, Spacing, Typography } from '@/constants/theme';
import { useAudioPreview } from '@/features/audio/hooks/use-audio-preview';
import { useI18n } from '@/features/i18n/i18n-context';
import { CATS, type WordCategory } from '@/features/training/session-words-mock';
import { useWordLibrary } from '@/features/word-library/word-library-context';
import type { WordEntry } from '@/features/word-library/word-library-types';

export default function WordsScreen() {
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const { entries } = useWordLibrary();

  const [filter, setFilter] = useState<WordCategory>('전체');
  const [showCreate, setShowCreate] = useState(false);
  const [editEntry, setEditEntry] = useState<WordEntry | null>(null);

  const visible = filter === '전체' ? entries : entries.filter((e) => e.tag === filter);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.kicker}>WORDS</Text>
          <Text style={styles.title}>단어 관리</Text>
        </View>
        <Pressable style={styles.addBtn} onPress={() => setShowCreate(true)}>
          <Text style={styles.addBtnIcon}>+</Text>
        </Pressable>
      </View>

      <WordFilterBar cats={CATS} active={filter} onChange={setFilter} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + Spacing.screenBottomTabs }]}
      >
        {visible.map((e) => (
          <WordRow key={e.id} entry={e} onEdit={() => setEditEntry(e)} />
        ))}

        {visible.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🦜</Text>
            <Text style={styles.emptyText}>{t('wordLibrary.empty')}</Text>
            <Text style={styles.emptyHint}>{t('wordLibrary.emptyHint')}</Text>
          </View>
        )}
      </ScrollView>

      <WordCreateModal
        visible={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={() => setShowCreate(false)}
      />

      <WordEditModal
        visible={editEntry !== null}
        entry={editEntry}
        onClose={() => setEditEntry(null)}
        onSaved={() => setEditEntry(null)}
        onDeleted={() => setEditEntry(null)}
      />
    </View>
  );
}

interface WordRowProps {
  entry: WordEntry;
  onEdit: () => void;
}

function WordRow({ entry, onEdit }: WordRowProps) {
  const { t } = useI18n();
  const { canPreview, playPreview } = useAudioPreview(
    entry.transformedAudioUri ?? entry.audioUri,
    entry.pitchTransform?.playbackRate ?? 1.0,
  );
  const isPreset = entry.sourceType === 'preset';
  const sourceLabel = t(isPreset ? 'wordLibrary.sourcePreset' : 'wordLibrary.sourceRecording');

  return (
    <WordListItem
      label={entry.label}
      tag={entry.tag}
      sourceLabel={sourceLabel}
      isPreset={isPreset}
      canPreview={canPreview}
      onEdit={onEdit}
      onPlay={() => { void playPreview(); }}
    />
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: PetHubColors.neutral,
    flex: 1,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.screenX,
    paddingTop: 14,
    paddingBottom: 4,
  },
  kicker: {
    color: 'rgba(31,58,61,0.55)',
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  title: {
    ...Typography.screenTitle,
    color: PetHubColors.primary,
  },
  addBtn: {
    alignItems: 'center',
    backgroundColor: PetHubColors.primary,
    borderRadius: Radii.full,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  addBtnIcon: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '400',
    lineHeight: 26,
  },
  list: {
    gap: 8,
    paddingHorizontal: Spacing.screenX,
    paddingTop: 14,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyEmoji: {
    fontSize: 36,
    marginBottom: 8,
  },
  emptyText: {
    color: 'rgba(31,58,61,0.4)',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyHint: {
    color: 'rgba(31,58,61,0.35)',
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
  },
});
