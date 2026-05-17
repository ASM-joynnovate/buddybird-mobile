import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { SelectableRowCard } from '@/components/ui/selectable-row-card';
import { WheelPicker } from '@/components/ui/wheel-picker';
import { PetHubColors, Radii, Spacing } from '@/constants/theme';
import { formatDurationMins } from '@/features/shared/duration-format';
import type { SessionPresetKey } from '@/features/training/session-config';
import { SESSION_PRESETS } from '@/features/training/session-config';

import { SliderField } from './slider-field';

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => i);
const MINUTE_OPTIONS = Array.from({ length: 60 }, (_, i) => i);

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
  const selectedHours = Math.floor(sessionMins / 60);
  const selectedMins = sessionMins % 60;

  const minuteOptions = useMemo(
    () => (selectedHours === 0 ? MINUTE_OPTIONS.slice(1) : MINUTE_OPTIONS),
    [selectedHours]
  );

  return (
    <Card style={styles.card}>
      <View style={styles.grid}>
        {SESSION_PRESETS.map((preset) => {
          const selected = presetKey === preset.key;
          const totalMins = (preset.learnSecs + preset.restSecs) * preset.cycles / 60;
          return (
            <SelectableRowCard
              key={preset.key}
              active={selected}
              onPress={() => onSelectPreset(preset.key)}
            >
              <View style={styles.optionLeft}>
                <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>
                  {preset.shortLabel}
                </Text>
                <Text style={[styles.optionDescription, selected && styles.optionDescriptionSelected]}>
                  {preset.description}
                </Text>
              </View>
              <Text style={[styles.optionTime, selected && styles.optionTimeSelected]}>
                {formatDurationMins(totalMins)}
              </Text>
            </SelectableRowCard>
          );
        })}
        <SelectableRowCard
          active={presetKey === 'custom'}
          onPress={() => onSelectPreset('custom')}
        >
          <View style={styles.optionLeft}>
            <Text style={[styles.optionLabel, presetKey === 'custom' && styles.optionLabelSelected]}>
              직접 설정
            </Text>
            <Text style={[styles.optionDescription, presetKey === 'custom' && styles.optionDescriptionSelected]}>
              원하는 시간을 직접 설정
            </Text>
          </View>
        </SelectableRowCard>
      </View>

      {presetKey === 'custom' && (
        <View style={styles.sliders}>
          <View style={styles.durationPicker}>
            <View style={styles.durationPickerRow}>
              <WheelPicker
                options={HOUR_OPTIONS}
                selected={selectedHours}
                onChange={(h) => onChangeSessionMins(Math.max(1, h * 60 + selectedMins))}
              />
              <Text style={styles.pickerUnit}>시간</Text>
              <WheelPicker
                options={minuteOptions}
                selected={selectedMins}
                onChange={(m) => onChangeSessionMins(Math.max(1, selectedHours * 60 + m))}
              />
              <Text style={styles.pickerUnit}>분</Text>
            </View>
          </View>

          <SliderField
            label="학습 시간"
            value={formatDurationMins(learnSecs / 60)}
            min={1}
            max={60}
            step={1}
            current={learnSecs / 60}
            color={PetHubColors.secondary}
            onChange={(v) => onChangeLearnSecs(Math.round(v) * 60)}
          />
          <SliderField
            label="휴식 시간"
            value={formatDurationMins(restSecs / 60)}
            min={1}
            max={60}
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
    flexDirection: 'column',
    gap: 8,
  },
  optionLeft: {
    flex: 1,
    gap: 4,
  },
  optionLabel: {
    color: PetHubColors.primary,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  optionLabelSelected: {
    color: '#FAF6F0',
  },
  optionTime: {
    color: 'rgba(31,58,61,0.55)',
    fontSize: 17,
    fontWeight: '700',
  },
  optionTimeSelected: {
    color: 'rgba(250,246,240,0.75)',
  },
  optionDescription: {
    color: 'rgba(31,58,61,0.5)',
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 17,
  },
  optionDescriptionSelected: {
    color: 'rgba(250,246,240,0.65)',
  },
  sliders: {
    gap: Spacing.sectionHeadGap,
  },
  durationPicker: {
    backgroundColor: 'rgba(31,58,61,0.04)',
    borderRadius: Radii.field,
    padding: 12,
  },
  durationPickerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  pickerUnit: {
    color: PetHubColors.primary,
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: -0.3,
    width: 44,
  },
  cycleMono: {
    color: 'rgba(31,58,61,0.45)',
    fontSize: 10,
    letterSpacing: 0.3,
    textAlign: 'center',
  },
});
