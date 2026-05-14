import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { WordCreateModal } from '@/components/word-create-modal';
import { WordEditModal } from '@/components/word-edit-modal';
import { PetHubColors, Radii, Spacing, Typography } from '@/constants/theme';
import { useAudioPreview } from '@/features/audio/use-audio-preview';
import { useI18n } from '@/features/i18n/i18n-context';
import { useWordLibrary } from '@/features/word-library/word-library-context';
import type { WordEntry, WordTag } from '@/features/word-library/word-library-types';

const catColors: Record<string, string> = {
  인사: '#2A9D8F',
  음식: '#F4A261',
  이름: '#E76F51',
  기타: '#7C9885',
};

const CATS = ['전체', '인사', '음식', '이름', '기타'] as const;

interface WordCardProps {
  entry: WordEntry;
  onEdit: () => void;
  t: ReturnType<typeof useI18n>['t'];
}

function WordCard({ entry, onEdit, t }: WordCardProps) {
  const col = catColors[entry.tag] ?? PetHubColors.secondary;
  const { canPreview, playPreview } = useAudioPreview(entry.transformedAudioUri ?? entry.audioUri);

  return (
    <View style={styles.wordCard}>
      <View style={[styles.badge, { backgroundColor: `${col}18` }]}>
        <Text style={[styles.badgeText, { color: col }]}>{entry.label[0]}</Text>
      </View>
      <View style={styles.wordInfo}>
        <Text style={styles.wordText}>{entry.label}</Text>
        <View style={styles.tagsRow}>
          <View style={[styles.sourcePill, entry.sourceType === 'preset' ? styles.sourcePillPreset : styles.sourcePillRecording]}>
            <Text style={[styles.sourcePillText, entry.sourceType === 'preset' ? styles.sourcePillTextPreset : styles.sourcePillTextRecording]}>
              {entry.sourceType === 'preset' ? t('wordLibrary.sourcePreset') : t('wordLibrary.sourceRecording')}
            </Text>
          </View>
          <View style={[styles.catPill, { backgroundColor: `${col}18` }]}>
            <Text style={[styles.catPillText, { color: col }]}>{entry.tag}</Text>
          </View>
        </View>
      </View>
      <TouchableOpacity
        style={styles.editBtn}
        activeOpacity={0.7}
        onPress={onEdit}
      >
        <Text style={styles.editBtnIcon}>✎</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.playBtn, !canPreview && { opacity: 0.4 }]}
        activeOpacity={0.7}
        disabled={!canPreview}
        onPress={() => { void playPreview(); }}
      >
        <Text style={styles.playBtnIcon}>▶</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function WordsScreen() {
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const { entries } = useWordLibrary();

  const [filter, setFilter] = useState<string>('전체');
  const [showCreate, setShowCreate] = useState(false);
  const [editEntry, setEditEntry] = useState<WordEntry | null>(null);

  const visible = filter === '전체' ? entries : entries.filter((e) => e.tag === (filter as WordTag));

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* 헤더 */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.kicker}>WORDS</Text>
          <Text style={styles.title}>단어 관리</Text>
        </View>
        <Pressable style={styles.addBtn} onPress={() => setShowCreate(true)}>
          <Text style={styles.addBtnIcon}>+</Text>
        </Pressable>
      </View>

      {/* 카테고리 필터 */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
        style={styles.filterScroll}
      >
        {CATS.map((c) => {
          const active = filter === c;
          const color = catColors[c] ?? PetHubColors.secondary;
          return (
            <Pressable
              key={c}
              style={[
                styles.filterChip,
                active
                  ? { backgroundColor: `${color}18`, borderColor: color }
                  : styles.filterChipInactive,
              ]}
              onPress={() => setFilter(c)}
            >
              <Text style={[styles.filterChipText, active && { color }]}>{c}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + Spacing.screenBottomTabs }]}
      >
        {visible.map((e) => (
          <WordCard
            key={e.id}
            entry={e}
            onEdit={() => setEditEntry(e)}
            t={t}
          />
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
  filterScroll: {
    flexGrow: 0,
    marginTop: 14,
  },
  filterRow: {
    gap: 6,
    paddingHorizontal: Spacing.screenX,
  },
  filterChip: {
    borderRadius: Radii.full,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  filterChipInactive: {
    borderColor: 'rgba(31,58,61,0.15)',
  },
  filterChipText: {
    color: 'rgba(31,58,61,0.55)',
    fontSize: 13,
    fontWeight: '500',
  },
  list: {
    gap: 8,
    paddingHorizontal: Spacing.screenX,
    paddingTop: 14,
  },
  wordCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(31,58,61,0.06)',
    borderRadius: Radii.sectionCard,
    borderWidth: 0.5,
    flexDirection: 'row',
    gap: 14,
    padding: 14,
  },
  badge: {
    alignItems: 'center',
    borderRadius: Radii.iconSquare,
    flexShrink: 0,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  badgeText: {
    fontSize: 22,
    fontWeight: '700',
  },
  wordInfo: {
    alignItems: 'flex-start',
    flex: 1,
    flexDirection: 'column',
    gap: 6,
  },
  tagsRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  wordText: {
    color: PetHubColors.primary,
    fontSize: 18,
    fontWeight: '700',
  },
  catPill: {
    borderRadius: Radii.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  catPillText: {
    fontSize: 11,
    fontWeight: '500',
  },
  sourcePill: {
    borderRadius: Radii.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  sourcePillPreset: {
    backgroundColor: 'rgba(31,58,61,0.06)',
  },
  sourcePillRecording: {
    backgroundColor: 'rgba(42,157,143,0.12)',
  },
  sourcePillText: {
    fontSize: 11,
    fontWeight: '500',
  },
  sourcePillTextPreset: {
    color: 'rgba(31,58,61,0.45)',
  },
  sourcePillTextRecording: {
    color: PetHubColors.secondary,
  },
  editBtn: {
    alignItems: 'center',
    backgroundColor: 'rgba(31,58,61,0.06)',
    borderRadius: Radii.full,
    flexShrink: 0,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  editBtnIcon: {
    color: PetHubColors.primary,
    fontSize: 14,
  },
  playBtn: {
    alignItems: 'center',
    backgroundColor: 'rgba(31,58,61,0.06)',
    borderRadius: Radii.full,
    flexShrink: 0,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  playBtnIcon: {
    color: PetHubColors.primary,
    fontSize: 12,
    marginLeft: 2,
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
