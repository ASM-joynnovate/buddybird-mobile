import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui/app-text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { InlineError } from '@/components/ui/inline-error';
import { Pressable3D } from '@/components/ui/ledge-surface';
import { WordCreateModal } from '@/components/words/word-create-modal';
import { WordEditModal } from '@/components/words/word-edit-modal';
import { WordFilterBar } from '@/components/words/word-filter-bar';
import { WordRow } from '@/components/words/word-row';
import { BuddyBirdColors, Fonts, Radii, Spacing, Typography } from '@/constants/theme';
import { useAnalytics } from '@/features/analytics/analytics-context';
import { useScreenTracking } from '@/features/analytics/hooks/use-screen-tracking';
import { useI18n } from '@/features/i18n/i18n-context';
import { CATS, type WordCategory } from '@/features/training/session-words-mock';
import { useWordLibrary } from '@/features/word-library/word-library-context';
import type { WordEntry } from '@/features/word-library/word-library-types';

export default function WordsScreen() {
  const { t } = useI18n();
  const { track } = useAnalytics();
  const insets = useSafeAreaInsets();
  const { entries, errorMessage } = useWordLibrary();
  useScreenTracking('words');

  const [filter, setFilter] = useState<WordCategory>('all');
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

  const visible = filter === 'all' ? entries : entries.filter((e) => e.tag === filter);

  const handleFilterChange = useCallback(
    (next: WordCategory) => {
      if (next === filter) return;
      const nextVisibleCount =
        next === 'all' ? entries.length : entries.filter((e) => e.tag === next).length;
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
        <Pressable3D
          accessibilityLabel="단어 추가"
          accessibilityRole="button"
          baseStyle={styles.addBtnBase}
          depth="selectedCard"
          faceStyle={styles.addBtn}
          onPress={handleCreate}>
          <IconSymbol name="plus" size={24} color={BuddyBirdColors.onDark} />
        </Pressable3D>
      </View>

      <View style={styles.errorWrapper}>
        <InlineError message={errorMessage} />
      </View>
      <WordFilterBar cats={CATS} active={filter} onChange={handleFilterChange} />

      <ScrollView
        style={styles.list}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + Spacing.screenBottomTabs }]}
      >
        {visible.map((e) => (
          <WordRow key={e.id} entry={e} onEdit={handleEdit} onBecameActive={handleBecameActive} />
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
    paddingTop: 12,
  },
  errorWrapper: {
    paddingHorizontal: Spacing.screenX,
  },
  title: {
    ...Typography.screenTitle,
    color: BuddyBirdColors.ink,
  },
  addBtnBase: {
    backgroundColor: BuddyBirdColors.primaryShadow,
    borderRadius: Radii.md,
  },
  addBtn: {
    alignItems: 'center',
    backgroundColor: BuddyBirdColors.primary,
    borderRadius: Radii.md,
    height: 46,
    justifyContent: 'center',
    width: 46,
  },
  list: {
    flex: 1,
  },
  listContent: {
    gap: 8,
    paddingHorizontal: Spacing.screenX,
    paddingTop: 8,
  },
  empty: {
    alignItems: 'center',
    backgroundColor: BuddyBirdColors.surface,
    borderColor: BuddyBirdColors.borderMuted,
    borderRadius: Radii.sectionCard,
    borderWidth: 2,
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyEmoji: {
    fontSize: 36,
    marginBottom: 8,
  },
  emptyText: {
    color: BuddyBirdColors.ink,
    fontFamily: Fonts.bodyExtraBold,
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
  },
  emptyHint: {
    color: BuddyBirdColors.inkMuted,
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
  },
});
