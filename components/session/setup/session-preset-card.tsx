import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { PetHubColors, Radii, Spacing } from '@/constants/theme';
import type { SessionPresetKey } from '@/features/training/session-config';
import { SESSION_PRESETS } from '@/features/training/session-config';

import { SliderField } from './slider-field';

const HOUR_OPTIONS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const MINUTE_OPTIONS = [15, 30, 45, 60];

type FocusedField = 'hour' | 'minute' | null;

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
  const [focusedField, setFocusedField] = useState<FocusedField>(null);

  const selectedHours = Math.floor(sessionMins / 60);
  const selectedMins = sessionMins % 60;

  function handleHourTap() {
    setFocusedField((prev) => (prev === 'hour' ? null : 'hour'));
  }

  function handleMinuteTap() {
    setFocusedField((prev) => (prev === 'minute' ? null : 'minute'));
  }

  function handleSelectHour(h: number) {
    onChangeSessionMins(h * 60 + selectedMins);
    setFocusedField(null);
  }

  function handleSelectMinute(m: number) {
    onChangeSessionMins(selectedHours * 60 + m);
    setFocusedField(null);
  }

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
                {`(${preset.learnSecs / 60}분+${preset.restSecs / 60}분) × ${preset.cycles}회`}
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
            직접 입력
          </Text>
        </TouchableOpacity>
      </View>

      {presetKey === 'custom' && (
        <View style={styles.sliders}>
          <View style={styles.durationPicker}>
            <View style={styles.durationDisplay}>
              <TouchableOpacity
                style={[styles.fieldBadge, focusedField === 'hour' && styles.fieldBadgeFocused]}
                onPress={handleHourTap}
                activeOpacity={0.75}
              >
                <Text style={[styles.fieldValue, focusedField === 'hour' && styles.fieldValueFocused]}>
                  {selectedHours}
                </Text>
              </TouchableOpacity>
              <Text style={styles.fieldUnit}>시간</Text>
              <TouchableOpacity
                style={[styles.fieldBadge, focusedField === 'minute' && styles.fieldBadgeFocused]}
                onPress={handleMinuteTap}
                activeOpacity={0.75}
              >
                <Text style={[styles.fieldValue, focusedField === 'minute' && styles.fieldValueFocused]}>
                  {selectedMins}
                </Text>
              </TouchableOpacity>
              <Text style={styles.fieldUnit}>분</Text>
            </View>

            {focusedField === 'hour' && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipRow}
              >
                {HOUR_OPTIONS.map((h) => (
                  <TouchableOpacity
                    key={h}
                    style={[styles.chip, selectedHours === h && styles.chipSelected]}
                    onPress={() => handleSelectHour(h)}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.chipText, selectedHours === h && styles.chipTextSelected]}>
                      {h}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {focusedField === 'minute' && (
              <View style={styles.chipRow}>
                {MINUTE_OPTIONS.map((m) => (
                  <TouchableOpacity
                    key={m}
                    style={[styles.chip, selectedMins === m && styles.chipSelected]}
                    onPress={() => handleSelectMinute(m)}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.chipText, selectedMins === m && styles.chipTextSelected]}>
                      {m}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <SliderField
            label="학습 시간"
            value={`${learnSecs / 60}분`}
            min={1}
            max={60}
            step={1}
            current={learnSecs / 60}
            color={PetHubColors.secondary}
            onChange={(v) => onChangeLearnSecs(Math.round(v) * 60)}
          />
          <SliderField
            label="휴식 시간"
            value={`${restSecs / 60}분`}
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
  durationPicker: {
    backgroundColor: 'rgba(31,58,61,0.04)',
    borderRadius: Radii.field,
    gap: Spacing.sectionHeadGap,
    padding: 12,
  },
  durationDisplay: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  fieldBadge: {
    backgroundColor: PetHubColors.surface,
    borderColor: 'rgba(31,58,61,0.15)',
    borderRadius: Radii.field,
    borderWidth: 1.5,
    minWidth: 48,
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  fieldBadgeFocused: {
    backgroundColor: PetHubColors.primary,
    borderColor: PetHubColors.primary,
  },
  fieldValue: {
    color: PetHubColors.primary,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  fieldValueFocused: {
    color: '#FAF6F0',
  },
  fieldUnit: {
    color: 'rgba(31,58,61,0.6)',
    fontSize: 16,
    fontWeight: '500',
    marginRight: 4,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    borderColor: 'rgba(31,58,61,0.12)',
    borderRadius: Radii.full,
    borderWidth: 1.5,
    minWidth: 44,
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  chipSelected: {
    backgroundColor: PetHubColors.primary,
    borderColor: PetHubColors.primary,
  },
  chipText: {
    color: PetHubColors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  chipTextSelected: {
    color: '#FAF6F0',
  },
  cycleMono: {
    color: 'rgba(31,58,61,0.45)',
    fontSize: 10,
    letterSpacing: 0.3,
    textAlign: 'center',
  },
});
