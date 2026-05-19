import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { SelectableRowCard } from '@/components/ui/selectable-row-card';
import { WheelPicker } from '@/components/ui/wheel-picker';
import { BuddyBirdColors, Radii, Spacing } from '@/constants/theme';
import { formatDurationMins } from '@/features/shared/duration-format';
import type { SessionPresetKey } from '@/features/training/session-config';
import { SESSION_PRESETS } from '@/features/training/session-config';


const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => i);
const MINUTE_OPTIONS = Array.from({ length: 60 }, (_, i) => i);

interface SessionPresetCardProps {
  presetKey: SessionPresetKey;
  onSelectPreset: (key: SessionPresetKey) => void;
  sessionMins: number;
  onChangeSessionMins: (v: number) => void;
}

export function SessionPresetCard({
  presetKey,
  onSelectPreset,
  sessionMins,
  onChangeSessionMins,
}: SessionPresetCardProps) {
  const selectedHours = Math.floor(sessionMins / 60);
  const selectedMins = sessionMins % 60;

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
    color: BuddyBirdColors.primary,
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
    color: BuddyBirdColors.primary,
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: -0.3,
    width: 44,
  },
});
