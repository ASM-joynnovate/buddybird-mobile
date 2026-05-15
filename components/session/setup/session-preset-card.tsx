import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { PetHubColors, Radii, Spacing } from '@/constants/theme';
import { SESSION_PRESETS, STEP_SESSION_MINS } from '@/features/training/session-config';
import type { SessionPresetKey } from '@/features/training/session-config';

import { SliderField } from './slider-field';

interface SessionPresetCardProps {
  presetKey: SessionPresetKey;
  onSelectPreset: (key: SessionPresetKey) => void;
  sessionMins: number;
  learnSecs: number;
  restSecs: number;
  onChangeSessionMins: (v: number) => void;
  onChangeLearnSecs: (v: number) => void;
  onChangeRestSecs: (v: number) => void;
}

export function SessionPresetCard({
  presetKey,
  onSelectPreset,
  sessionMins,
  learnSecs,
  restSecs,
  onChangeSessionMins,
  onChangeLearnSecs,
  onChangeRestSecs,
}: SessionPresetCardProps) {
  return (
    <Card style={styles.card}>
      <View style={styles.grid}>
        {SESSION_PRESETS.map((preset) => {
          const selected = presetKey === preset.key;
          return (
            <TouchableOpacity
              key={preset.key}
              style={[styles.option, selected && styles.optionSelected]}
              onPress={() => onSelectPreset(preset.key)}
              activeOpacity={0.75}
            >
              <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>
                {preset.label}
              </Text>
              <Text style={[styles.optionDesc, selected && styles.optionDescSelected]}>
                {`${preset.learnSecs / 60}분+${preset.restSecs / 60}분 × ${preset.cycles}회`}
              </Text>
            </TouchableOpacity>
          );
        })}
        <TouchableOpacity
          style={[styles.option, presetKey === 'custom' && styles.optionSelected]}
          onPress={() => onSelectPreset('custom')}
          activeOpacity={0.75}
        >
          <Text style={[styles.optionLabel, presetKey === 'custom' && styles.optionLabelSelected]}>
            직접 설정
          </Text>
          <Text style={[styles.optionDesc, presetKey === 'custom' && styles.optionDescSelected]}>
            슬라이더로 직접 입력
          </Text>
        </TouchableOpacity>
      </View>

      {presetKey === 'custom' && (
        <View style={styles.sliders}>
          <SliderField
            label="총 세션 시간"
            value={`${sessionMins}분`}
            min={5}
            max={60}
            step={STEP_SESSION_MINS}
            current={sessionMins}
            color={PetHubColors.primary}
            onChange={(v) => onChangeSessionMins(Math.round(v / STEP_SESSION_MINS) * STEP_SESSION_MINS)}
          />
          <SliderField
            label="학습 시간"
            value={`${learnSecs / 60}분`}
            min={1}
            max={30}
            step={1}
            current={learnSecs / 60}
            color={PetHubColors.secondary}
            onChange={(v) => onChangeLearnSecs(Math.round(v) * 60)}
          />
          <SliderField
            label="휴식 시간"
            value={`${restSecs / 60}분`}
            min={1}
            max={15}
            step={1}
            current={restSecs / 60}
            color={PetHubColors.accentCoral}
            onChange={(v) => onChangeRestSecs(Math.round(v) * 60)}
          />
          <Text style={styles.cycleMono}>
            1사이클 = {learnSecs / 60}분 학습 + {restSecs / 60}분 휴식 ({(learnSecs + restSecs) / 60}분)
          </Text>
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.sectionHeadGap,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  option: {
    borderColor: 'rgba(31,58,61,0.12)',
    borderRadius: Radii.field,
    borderWidth: 1.5,
    gap: 3,
    paddingHorizontal: 12,
    paddingVertical: 10,
    width: '48%',
  },
  optionSelected: {
    backgroundColor: PetHubColors.primary,
    borderColor: PetHubColors.primary,
  },
  optionLabel: {
    color: PetHubColors.primary,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  optionLabelSelected: {
    color: '#FAF6F0',
  },
  optionDesc: {
    color: 'rgba(31,58,61,0.5)',
    fontSize: 11,
    fontWeight: '500',
  },
  optionDescSelected: {
    color: 'rgba(250,246,240,0.65)',
  },
  sliders: {
    gap: Spacing.sectionHeadGap,
  },
  cycleMono: {
    color: 'rgba(31,58,61,0.45)',
    fontSize: 10,
    letterSpacing: 0.3,
    textAlign: 'center',
  },
});
