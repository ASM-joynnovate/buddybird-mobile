import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { SectionKicker } from '@/components/ui/section-kicker';
import { PetHubColors, Radii } from '@/constants/theme';

export type PitchToneChoice = 'original' | 'parrot';

interface FrequencyTuningFormCardProps {
  choice: PitchToneChoice;
  onChangeChoice: (c: PitchToneChoice) => void;
}

const OPTIONS: { id: PitchToneChoice; label: string; sub: string }[] = [
  { id: 'original', label: '원본 녹음 톤 유지', sub: '원본 그대로' },
  { id: 'parrot', label: '앵무새 톤으로 변환', sub: '발음하기 쉬운 음역대로 변환' },
];

export function FrequencyTuningFormCard({ choice, onChangeChoice }: FrequencyTuningFormCardProps) {
  return (
    <Card style={styles.card}>
      <SectionKicker>단어 음성 톤 설정</SectionKicker>
      <View style={styles.row}>
        {OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.id}
            activeOpacity={0.75}
            style={[styles.btn, choice === opt.id && styles.btnActive]}
            onPress={() => onChangeChoice(opt.id)}
          >
            <Text style={[styles.label, choice === opt.id && styles.labelActive]}>{opt.label}</Text>
            <Text style={styles.range}>{opt.sub}</Text>
          </TouchableOpacity>
        ))}
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
  label: {
    color: PetHubColors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  labelActive: {
    color: PetHubColors.secondary,
  },
  range: {
    color: 'rgba(31,58,61,0.55)',
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 0.3,
    marginTop: 2,
  },
});
