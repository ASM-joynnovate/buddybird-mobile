import { Pressable, StyleSheet, Text, View } from 'react-native';

import { WaveformBars } from '@/components/ui/waveform-bars';
import { BuddyBirdColors, Radii, Typography } from '@/constants/theme';
import { IconSymbol } from '../ui/icon-symbol';

interface ContinueSessionCardProps {
  lastWord?: string;
  cycles?: number;
  mins?: number;
  learnMins?: number;
  restMins?: number;
  onContinue: () => void;
}

export function ContinueSessionCard({ lastWord, cycles, mins, learnMins, restMins, onContinue }: ContinueSessionCardProps) {
  const hasHistory = lastWord !== undefined;

  return (
    <View>
      <View style={styles.headRow}>
        {hasHistory && <Text style={styles.kicker}>마지막 세션</Text>}
        <Text style={styles.title}>{hasHistory ? '이어서 학습하기' : '세션에서 설정하기'}</Text>
      </View>
      <View style={styles.card}>
        {hasHistory && (
          <View style={styles.inner}>
            <View style={styles.chipRow}>
              <View style={styles.wordChip}>
                <Text style={styles.wordChipText}>{lastWord}</Text>
              </View>
            </View>
            <WaveformBars color="#7DD3C0" height={36} barCount={44} />
            <Text style={styles.sessionMeta}>
              {cycles}사이클 · 총 {mins}분 · {learnMins}분 학습 · {restMins}분 휴식
            </Text>
          </View>
        )}
        <Pressable style={styles.btn} onPress={onContinue}>
          <IconSymbol name="play.fill" size={16} color="#fff" />
          <Text style={styles.btnText}>{hasHistory ? '이어서 학습하기' : '세션에서 설정하기'}</Text>
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
    color: BuddyBirdColors.kickerMuted,
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.6,
  },
  title: {
    ...Typography.screenTitle,
    color: BuddyBirdColors.primary,
    fontSize: 22,
  },
  card: {
    backgroundColor: BuddyBirdColors.primary,
    borderRadius: Radii.card,
    overflow: 'hidden',
    shadowColor: BuddyBirdColors.primary,
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
    color: BuddyBirdColors.neutral,
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
    color: BuddyBirdColors.kickerMutedOnDark,
    fontSize: 13,
  },
  sessionMeta: {
    color: BuddyBirdColors.kickerMutedOnDark,
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 0.4,
  },
  btn: {
    alignItems: 'center',
    backgroundColor: BuddyBirdColors.secondary,
    flexDirection: 'row',
    gap: 6,
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
