import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { WordCreateModal } from '@/components/words/word-create-modal';
import { WordEditModal } from '@/components/words/word-edit-modal';
import { WordFilterBar } from '@/components/words/word-filter-bar';
import { WordListItem } from '@/components/words/word-list-item';
import { BuddyBirdColors, Radii, Spacing, Typography } from '@/constants/theme';
import { useAnalytics } from '@/features/analytics/analytics-context';
import { useScreenTracking } from '@/features/analytics/hooks/use-screen-tracking';
import { useAudioPreview } from '@/features/audio/hooks/use-audio-preview';
import { useI18n } from '@/features/i18n/i18n-context';
import { CATS, type WordCategory } from '@/features/training/session-words-mock';
import { useWordLibrary } from '@/features/word-library/word-library-context';
import type { WordEntry } from '@/features/word-library/word-library-types';

export default function WordsScreen() {
  const { t } = useI18n();
  const { track } = useAnalytics();
  const insets = useSafeAreaInsets();
  const { entries } = useWordLibrary();
  useScreenTracking('words');

  const [filter, setFilter] = useState<WordCategory>('전체');
  const [showCreate, setShowCreate] = useState(false);
  const [editEntry, setEditEntry] = useState<WordEntry | null>(null);

  const stopCurrentPlayerRef = useRef<(() => void) | null>(null);
  const handleBecameActive = useCallback((stopFn: () => void) => {
    stopCurrentPlayerRef.current?.();
    stopCurrentPlayerRef.current = stopFn;
  }, []);

  const handleEdit = useCallback((entry: WordEntry) => {
    stopCurrentPlayerRef.current?.();
    stopCurrentPlayerRef.current = null;
    setEditEntry(entry);
  }, []);

  const handleCreate = useCallback(() => {
    stopCurrentPlayerRef.current?.();
    stopCurrentPlayerRef.current = null;
    setShowCreate(true);
  }, []);

  useFocusEffect(
    useCallback(() => {
      return () => {
        stopCurrentPlayerRef.current?.();
        stopCurrentPlayerRef.current = null;
      };
    }, []),
  );

  const visible = filter === '전체' ? entries : entries.filter((e) => e.tag === filter);

  const handleFilterChange = useCallback(
    (next: WordCategory) => {
      if (next === filter) return;
      const nextVisibleCount =
        next === '전체' ? entries.length : entries.filter((e) => e.tag === next).length;
      track({
        name: 'word_library_filter_changed',
        params: { from: filter, to: next, visible_words_count: nextVisibleCount },
      });
      setFilter(next);
    },
    [entries, filter, track],
  );

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>단어 관리</Text>
        </View>
        <Pressable style={styles.addBtn} onPress={handleCreate}>
          <Text style={styles.addBtnIcon}>+</Text>
        </Pressable>
      </View>

      <WordFilterBar cats={CATS} active={filter} onChange={handleFilterChange} />

      <ScrollView
        style={styles.list}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + Spacing.screenBottomTabs }]}
      >
        {visible.map((e) => (
          <WordRow key={e.id} entry={e} onEdit={() => handleEdit(e)} onBecameActive={handleBecameActive} />
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
  onBecameActive: (stopFn: () => void) => void;
}

function WordRow({ entry, onEdit, onBecameActive }: WordRowProps) {
  const { t } = useI18n();
  const { track } = useAnalytics();
  const rawAudioUri = entry.transformedAudioUri ?? entry.audioUri;
  const { canPreview, previewState, playPreview, stopPreview } = useAudioPreview(
    rawAudioUri.startsWith('preset://') ? null : rawAudioUri,
    entry.pitchTransform?.playbackRate ?? 1.0,
  );
  const isPreset = entry.sourceType === 'preset';
  const sourceLabel = t(isPreset ? 'wordLibrary.sourcePreset' : 'wordLibrary.sourceRecording');

  function handlePlay() {
    const isPlaying = previewState === 'playing';
    track({
      name: 'word_library_preview_played',
      params: {
        word_id: entry.id,
        word_name: entry.label,
        source_type: isPreset ? 'preset' : 'recording',
        action: isPlaying ? 'stop' : 'play',
      },
    });
    if (isPlaying) {
      stopPreview();
    } else {
      onBecameActive(stopPreview);
      void playPreview();
    }
  }

  return (
    <WordListItem
      label={entry.label}
      tag={entry.tag}
      sourceLabel={sourceLabel}
      isPreset={isPreset}
      canPreview={canPreview}
      isPlaying={previewState === 'playing'}
      onEdit={onEdit}
      onPlay={handlePlay}
    />
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: BuddyBirdColors.neutral,
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
    color: BuddyBirdColors.kickerMuted,
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  title: {
    ...Typography.screenTitle,
    color: BuddyBirdColors.primary,
  },
  addBtn: {
    alignItems: 'center',
    backgroundColor: BuddyBirdColors.primary,
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
    flex: 1,
  },
  listContent: {
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
