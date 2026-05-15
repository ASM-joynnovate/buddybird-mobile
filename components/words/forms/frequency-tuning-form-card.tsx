import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { SectionKicker } from '@/components/ui/section-kicker';
import { PetHubColors, Radii } from '@/constants/theme';

export type PitchToneChoice = 'original' | 'parrot';

interface FrequencyTuningFormCardProps {
  choice: PitchToneChoice;
  onChangeChoice: (c: PitchToneChoice) => void;
}

export function FrequencyTuningFormCard({ choice, onChangeChoice }: FrequencyTuningFormCardProps) {
  return (
    <Card style={styles.card}>
      <SectionKicker>단어 음성 톤 설정</SectionKicker>
      <View style={styles.row}>
        <TouchableOpacity
          activeOpacity={0.75}
          style={[styles.btn, choice === 'original' && styles.btnActive]}
          onPress={() => onChangeChoice('original')}
        >
          <Text style={[styles.label, choice === 'original' && styles.labelActive]}>원본 녹음 톤 유지</Text>
          <Text style={styles.range}>원본 그대로</Text>
        </TouchableOpacity>

        <View style={[styles.btn, styles.btnDisabled]}>
          <View style={styles.comingSoonRow}>
            <Text style={styles.labelDisabled}>앵무새 톤으로 변환</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>추후 서비스 예정</Text>
            </View>
          </View>
          <Text style={styles.range}>발음하기 쉬운 음역대로 변환</Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 14,
  },
  row: {
    flexDirection: 'row',
    gap: 6,
  },
  btn: {
    backgroundColor: '#fff',
    borderColor: 'rgba(31,58,61,0.12)',
    borderRadius: Radii.field,
    borderWidth: 0.5,
    flex: 1,
    gap: 2,
    minWidth: 90,
    padding: 10,
  },
  btnActive: {
    backgroundColor: 'rgba(42,157,143,0.08)',
    borderColor: PetHubColors.secondary,
    borderWidth: 1.5,
  },
  btnDisabled: {
    backgroundColor: 'rgba(31,58,61,0.03)',
    borderColor: 'rgba(31,58,61,0.08)',
  },
  label: {
    color: PetHubColors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  labelActive: {
    color: PetHubColors.secondary,
  },
  labelDisabled: {
    color: 'rgba(31,58,61,0.3)',
    fontSize: 13,
    fontWeight: '600',
  },
  range: {
    color: 'rgba(31,58,61,0.55)',
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 0.3,
    marginTop: 2,
  },
  comingSoonRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  badge: {
    backgroundColor: 'rgba(31,58,61,0.07)',
    borderRadius: Radii.full,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: {
    color: 'rgba(31,58,61,0.4)',
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
