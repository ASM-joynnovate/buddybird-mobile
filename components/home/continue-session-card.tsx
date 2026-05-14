import { Pressable, StyleSheet, Text, View } from 'react-native';

import { WaveformBars } from '@/components/ui/waveform-bars';
import { PetHubColors, Radii, Typography } from '@/constants/theme';

interface ContinueSessionCardProps {
  words: string[];
  totalWordsCount: number;
  cycles: number;
  mins: number;
  onContinue: () => void;
}

export function ContinueSessionCard({ words, totalWordsCount, cycles, mins, onContinue }: ContinueSessionCardProps) {
  return (
    <View>
      <View style={styles.headRow}>
        <Text style={styles.kicker}>마지막 세션</Text>
        <Text style={styles.title}>이어서 학습하기</Text>
      </View>
      <View style={styles.card}>
        <View style={styles.inner}>
          <View style={styles.chipRow}>
            {words.map((w) => (
              <View key={w} style={styles.wordChip}>
                <Text style={styles.wordChipText}>{w}</Text>
              </View>
            ))}
            <View style={styles.moreChip}>
              <Text style={styles.moreChipText}>{totalWordsCount - words.length}개 더</Text>
            </View>
          </View>
          <WaveformBars color="#7DD3C0" height={36} barCount={44} />
          <Text style={styles.sessionMeta}>
            {cycles} 사이클 · {mins}분 · 60초 학습 + 30초 휴식
          </Text>
        </View>
        <Pressable style={styles.btn} onPress={onContinue}>
          <Text style={styles.btnText}>▶ 이어서 학습하기</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headRow: {
    gap: 4,
    marginBottom: 10,
  },
  kicker: {
    color: 'rgba(31,58,61,0.55)',
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.6,
  },
  title: {
    ...Typography.screenTitle,
    color: PetHubColors.primary,
    fontSize: 22,
  },
  card: {
    backgroundColor: PetHubColors.primary,
    borderRadius: Radii.card,
    overflow: 'hidden',
    shadowColor: 'rgba(31,58,61,1)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
  },
  inner: {
    gap: 12,
    padding: 18,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  wordChip: {
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: Radii.full,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  wordChipText: {
    color: PetHubColors.neutral,
    fontSize: 13,
    fontWeight: '600',
  },
  moreChip: {
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: Radii.full,
    borderWidth: 0.5,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  moreChipText: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 13,
  },
  sessionMeta: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 0.4,
  },
  btn: {
    alignItems: 'center',
    backgroundColor: PetHubColors.secondary,
    height: 52,
    justifyContent: 'center',
  },
  btnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
});
