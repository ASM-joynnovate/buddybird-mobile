import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card } from '@/components/ui/card';
import { PillButton } from '@/components/ui/pill-button';
import { PetHubColors, Radii, Spacing, Typography } from '@/constants/theme';

const catColors: Record<string, string> = {
  인사: '#2A9D8F',
  음식: '#F4A261',
  이름: '#E76F51',
  기타: '#7C9885',
};

const INITIAL_WORDS = [
  { id: 1, word: '안녕', cat: '인사' },
  { id: 2, word: '사과', cat: '음식' },
  { id: 3, word: '망고야', cat: '이름' },
  { id: 4, word: '잘 자', cat: '인사' },
  { id: 5, word: '엄마', cat: '이름' },
  { id: 6, word: '물', cat: '음식' },
  { id: 7, word: '빠빠이', cat: '인사' },
  { id: 8, word: '아빠', cat: '이름' },
];

const CATS = ['전체', '인사', '음식', '이름', '기타'] as const;

export default function WordsScreen() {
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<string>('전체');
  const [words, setWords] = useState(INITIAL_WORDS);
  const [showAdd, setShowAdd] = useState(false);
  const [newWord, setNewWord] = useState('');
  const [newCat, setNewCat] = useState('인사');

  const visible = filter === '전체' ? words : words.filter((w) => w.cat === filter);

  const addWord = () => {
    if (!newWord.trim()) return;
    setWords((ws) => [...ws, { id: Date.now(), word: newWord.trim(), cat: newCat }]);
    setNewWord('');
    setShowAdd(false);
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.kicker}>WORDS</Text>
          <Text style={styles.title}>단어 관리</Text>
        </View>
        <Pressable style={styles.addBtn} onPress={() => setShowAdd(true)}>
          <Text style={styles.addBtnIcon}>+</Text>
        </Pressable>
      </View>

      {/* category filter */}
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
        {/* add word form */}
        {showAdd && (
          <Card style={styles.addCard}>
            <Text style={styles.addCardTitle}>새 단어 추가</Text>
            <TextInput
              style={styles.input}
              value={newWord}
              onChangeText={setNewWord}
              placeholder="단어 입력 (예: 사랑해)"
              placeholderTextColor="rgba(31,58,61,0.35)"
              returnKeyType="done"
              onSubmitEditing={addWord}
            />
            <View style={styles.catChips}>
              {(['인사', '음식', '이름', '기타'] as const).map((c) => (
                <Pressable
                  key={c}
                  style={[
                    styles.filterChip,
                    newCat === c
                      ? { backgroundColor: `${catColors[c]}18`, borderColor: catColors[c] }
                      : styles.filterChipInactive,
                  ]}
                  onPress={() => setNewCat(c)}
                >
                  <Text style={[styles.filterChipText, newCat === c && { color: catColors[c] }]}>{c}</Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.addActions}>
              <PillButton full label="취소" variant="ghost" onPress={() => { setShowAdd(false); setNewWord(''); }} />
              <PillButton full label="추가" variant="teal" onPress={addWord} />
            </View>
          </Card>
        )}

        {/* word list */}
        {visible.map((w) => {
          const col = catColors[w.cat] ?? PetHubColors.secondary;
          return (
            <View key={w.id} style={styles.wordCard}>
              <View style={[styles.badge, { backgroundColor: `${col}18` }]}>
                <Text style={[styles.badgeText, { color: col }]}>{w.word[0]}</Text>
              </View>
              <View style={styles.wordInfo}>
                <Text style={styles.wordText}>{w.word}</Text>
                <View style={[styles.catPill, { backgroundColor: `${col}18` }]}>
                  <Text style={[styles.catPillText, { color: col }]}>{w.cat}</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.playBtn}
                activeOpacity={0.7}
                onPress={() => router.push('/session-setup')}
              >
                <Text style={styles.playBtnIcon}>▶</Text>
              </TouchableOpacity>
            </View>
          );
        })}

        {visible.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🦜</Text>
            <Text style={styles.emptyText}>단어가 없어요. 위의 + 버튼으로 추가해 보세요!</Text>
          </View>
        )}
      </ScrollView>
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
  addCard: {
    gap: 12,
  },
  addCardTitle: {
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
  catChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  addActions: {
    flexDirection: 'row',
    gap: 8,
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
    alignItems: 'baseline',
    flex: 1,
    flexDirection: 'row',
    gap: 8,
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
    textAlign: 'center',
  },
});
