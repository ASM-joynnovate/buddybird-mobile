import { useEffect, useRef } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { Card } from '@/components/ui/card';
import { PetHubColors, Radii, Spacing } from '@/constants/theme';
import type { SessionPresetKey } from '@/features/training/session-config';
import { SESSION_PRESETS } from '@/features/training/session-config';

import { SliderField } from './slider-field';

const HOUR_OPTIONS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const MINUTE_OPTIONS = [0, 15, 30, 45];
const ITEM_H = 44;

function WheelPicker({
  options,
  selected,
  onChange,
}: {
  options: number[];
  selected: number;
  onChange: (v: number) => void;
}) {
  const ref = useRef<ScrollView>(null);

  useEffect(() => {
    const idx = options.indexOf(selected);
    if (idx >= 0) ref.current?.scrollTo({ y: idx * ITEM_H, animated: false });
  }, []);

  function onMomentumEnd(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const idx = Math.round(e.nativeEvent.contentOffset.y / ITEM_H);
    onChange(options[Math.max(0, Math.min(idx, options.length - 1))]);
  }

  return (
    <ScrollView
      ref={ref}
      style={styles.wheel}
      contentContainerStyle={styles.wheelContent}
      snapToInterval={ITEM_H}
      decelerationRate="fast"
      showsVerticalScrollIndicator={false}
      onMomentumScrollEnd={onMomentumEnd}
    >
      {options.map((opt) => (
        <View key={opt} style={styles.wheelItemWrapper}>
          <Text style={styles.wheelItem}>{opt}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

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
            <View style={styles.durationPickerRow}>
              <WheelPicker
                options={HOUR_OPTIONS}
                selected={selectedHours}
                onChange={(h) => onChangeSessionMins(h * 60 + selectedMins)}
              />
              <Text style={styles.pickerUnit}>시간</Text>
              <WheelPicker
                options={MINUTE_OPTIONS}
                selected={selectedMins}
                onChange={(m) => onChangeSessionMins(selectedHours * 60 + m)}
              />
              <Text style={styles.pickerUnit}>분</Text>
            </View>
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
    padding: 12,
  },
  durationPickerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  wheel: {
    height: ITEM_H * 3,
    width: 64,
  },
  wheelContent: {
    paddingVertical: ITEM_H,
  },
  wheelItemWrapper: {
    alignItems: 'center',
    height: ITEM_H,
    justifyContent: 'center',
  },
  wheelItem: {
    color: PetHubColors.primary,
    fontSize: 22,
    fontWeight: '700',
  },
  pickerUnit: {
    color: PetHubColors.primary,
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  cycleMono: {
    color: 'rgba(31,58,61,0.45)',
    fontSize: 10,
    letterSpacing: 0.3,
    textAlign: 'center',
  },
});
