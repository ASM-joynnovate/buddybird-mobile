import { StyleSheet, Text, View } from 'react-native';

import { WaveformBars } from '@/components/ui/waveform-bars';

interface SessionWaveSectionProps {
  isLearning: boolean;
}

export function SessionWaveSection({ isLearning }: SessionWaveSectionProps) {
  return (
    <View style={styles.section}>
      <View
        style={[
          styles.badge,
          {
            backgroundColor: isLearning ? 'rgba(94,234,212,0.15)' : 'rgba(255,255,255,0.05)',
            borderColor: isLearning ? 'rgba(94,234,212,0.35)' : 'rgba(255,255,255,0.1)',
          },
        ]}
      >
        <Text style={[styles.text, { color: isLearning ? '#5EEAD4' : '#FDBA74' }]}>
          {isLearning ? '소리 자동 재생 중' : '휴식 중 · 다음 학습 준비'}
        </Text>
      </View>
      <WaveformBars color={isLearning ? '#5EEAD4' : 'rgba(255,255,255,0.2)'} height={40} barCount={44} />
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 10,
    paddingBottom: 14,
    paddingHorizontal: 22,
  },
  badge: {
    alignItems: 'center',
    alignSelf: 'center',
    borderRadius: 999,
    borderWidth: 0.5,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  text: {
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 0.4,
  },
});
