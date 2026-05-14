import Slider from '@react-native-community/slider';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { FreqBandViz } from '@/components/ui/freq-band-viz';
import { SectionKicker } from '@/components/ui/section-kicker';
import { PetHubColors, Radii } from '@/constants/theme';
import { PERSONAS, type PersonaId } from '@/features/training/session-config';

interface FrequencyTuningFormCardProps {
  target: number;
  persona: PersonaId;
  onChangeTarget: (v: number) => void;
  onChangePersona: (id: PersonaId) => void;
}

export function FrequencyTuningFormCard({ target, persona, onChangeTarget, onChangePersona }: FrequencyTuningFormCardProps) {
  return (
    <Card style={styles.card}>
      <SectionKicker>고주파 톤 매핑 · 목표 주파수</SectionKicker>
      <FreqBandViz low={1} high={target} color={PetHubColors.secondary} label={`${target.toFixed(1)} kHz`} />
      <Slider
        style={styles.slider}
        minimumValue={1.5}
        maximumValue={4.0}
        step={0.1}
        value={target}
        minimumTrackTintColor={PetHubColors.secondary}
        maximumTrackTintColor="rgba(31,58,61,0.12)"
        thumbTintColor={PetHubColors.secondary}
        onValueChange={(v) => onChangeTarget(Math.round(v * 10) / 10)}
      />
      <View style={styles.row}>
        {PERSONAS.map((p) => (
          <TouchableOpacity
            key={p.id}
            activeOpacity={0.75}
            style={[styles.btn, persona === p.id && styles.btnActive]}
            onPress={() => onChangePersona(p.id)}
          >
            <Text style={[styles.label, persona === p.id && styles.labelActive]}>{p.label}</Text>
            <Text style={styles.range}>{p.range}</Text>
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
  slider: {
    height: 36,
    width: '100%',
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
