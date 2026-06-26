import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { SelectableRowCard } from '@/components/ui/selectable-row-card';
import { WheelPicker } from '@/components/ui/wheel-picker';
import { BuddyBirdColors, Fonts, Radii, Spacing, Typography, withAlpha } from '@/constants/theme';
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
    <View style={styles.card}>
      <View style={styles.grid}>
        {SESSION_PRESETS.map((preset) => {
          const selected = presetKey === preset.key;
          const totalMins = (preset.learnSecs + preset.restSecs) * preset.cycles / 60;
          return (
            <SelectableRowCard
              key={preset.key}
              active={selected}
              onPress={() => onSelectPreset(preset.key)}
              radioPosition="left">
              <View style={styles.optionLeft}>
                <View style={styles.optionTitleRow}>
                  <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>
                    {preset.shortLabel}
                  </Text>
                  <Text style={styles.optionTime}>
                    {formatDurationMins(totalMins)}
                  </Text>
                </View>
                <Text numberOfLines={1} style={[styles.optionDescription, selected && styles.optionDescriptionSelected]}>
                  {preset.description}
                </Text>
              </View>
            </SelectableRowCard>
          );
        })}
        <SelectableRowCard
          active={presetKey === 'custom'}
          onPress={() => onSelectPreset('custom')}
          radioPosition="left">
          <View style={styles.optionLeft}>
            <View style={styles.optionTitleRow}>
              <Text style={[styles.optionLabel, presetKey === 'custom' && styles.optionLabelSelected]}>
                직접 설정
              </Text>
              <Text style={styles.optionTime}>{formatDurationMins(sessionMins)}</Text>
            </View>
            <Text numberOfLines={1} style={[styles.optionDescription, presetKey === 'custom' && styles.optionDescriptionSelected]}>
              원하는 시간을 직접 정해요
            </Text>
          </View>
        </SelectableRowCard>
      </View>

      {presetKey === 'custom' && (
        <Card style={styles.durationPicker}>
          <Text style={styles.durationTitle}>총 학습 시간</Text>
          <View style={styles.durationWheelFrame}>
            <View pointerEvents="none" style={styles.wheelHighlight} />
            <View style={styles.durationPickerRow}>
              <View style={styles.pickerGroup}>
                <WheelPicker
                  accessibilityLabel="시간 선택"
                  options={HOUR_OPTIONS}
                  selected={selectedHours}
                  onChange={(h) => onChangeSessionMins(h * 60 + selectedMins)}
                />
                <Text style={styles.pickerUnit}>시간</Text>
              </View>
              <View style={styles.pickerGroup}>
                <WheelPicker
                  accessibilityLabel="분 선택"
                  options={MINUTE_OPTIONS}
                  selected={selectedMins}
                  onChange={(m) => onChangeSessionMins(selectedHours * 60 + m)}
                />
                <Text style={styles.pickerUnit}>분</Text>
              </View>
            </View>
          </View>
        </Card>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.cardPaddingSm,
  },
  grid: {
    flexDirection: 'column',
    gap: 8,
  },
  optionLeft: {
    flex: 1,
    gap: 4,
  },
  optionTitleRow: {
    alignItems: 'baseline',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionLabel: {
    color: BuddyBirdColors.ink,
    fontFamily: Fonts.bodyBlack,
    fontSize: 16,
    fontWeight: '900',
    lineHeight: 21,
    letterSpacing: 0,
  },
  optionLabelSelected: {
    color: BuddyBirdColors.ink,
  },
  optionTime: {
    color: BuddyBirdColors.primary,
    fontFamily: Fonts.bodyExtraBold,
    fontSize: 12.5,
    fontWeight: '800',
  },
  optionDescription: {
    color: BuddyBirdColors.inkMuted,
    fontFamily: Fonts.bodyBold,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17,
  },
  optionDescriptionSelected: {
    color: BuddyBirdColors.inkMuted,
  },
  durationPicker: {
    gap: Spacing.sectionHeadGap,
    padding: 12,
  },
  durationTitle: {
    ...Typography.caption,
    color: BuddyBirdColors.ink,
    textAlign: 'center',
  },
  durationWheelFrame: {
    position: 'relative',
  },
  wheelHighlight: {
    backgroundColor: withAlpha(BuddyBirdColors.primary, 0.06),
    borderColor: BuddyBirdColors.primary,
    borderRadius: Radii.iconSquare,
    borderWidth: 2,
    height: 40,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 80,
  },
  durationPickerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'nowrap',
    gap: 12,
    justifyContent: 'center',
  },
  pickerGroup: {
    alignItems: 'center',
    flexDirection: 'row',
    flexShrink: 1,
    gap: 6,
  },
  pickerUnit: {
    color: BuddyBirdColors.ink,
    fontFamily: Fonts.bodyExtraBold,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0,
    minWidth: 34,
  },
});
