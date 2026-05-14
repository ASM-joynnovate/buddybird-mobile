import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { PetHubColors, Radii } from '@/constants/theme';
import { catColors } from '@/features/training/session-words-mock';

interface WordListItemProps {
  word: string;
  cat: string;
  onPlay: () => void;
}

export function WordListItem({ word, cat, onPlay }: WordListItemProps) {
  const col = catColors[cat] ?? PetHubColors.secondary;
  return (
    <View style={styles.card}>
      <View style={[styles.badge, { backgroundColor: `${col}18` }]}>
        <Text style={[styles.badgeText, { color: col }]}>{word[0]}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.word}>{word}</Text>
        <View style={[styles.catPill, { backgroundColor: `${col}18` }]}>
          <Text style={[styles.catPillText, { color: col }]}>{cat}</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.playBtn} activeOpacity={0.7} onPress={onPlay}>
        <Text style={styles.playBtnIcon}>▶</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
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
  info: {
    alignItems: 'baseline',
    flex: 1,
    flexDirection: 'row',
    gap: 8,
  },
  word: {
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
});
