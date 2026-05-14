import { Pressable, StyleSheet, Text, View } from 'react-native';

import { SectionKicker } from '@/components/ui/section-kicker';
import { PetHubColors, Radii, Spacing } from '@/constants/theme';
import type { AudioSourceChoice } from '@/features/audio/audio-types';

interface AudioSourceToggleProps {
  audioSource: AudioSourceChoice;
  label: string;
  presetLabel: string;
  recordingLabel: string;
  onSelectPreset: () => void;
  onSelectRecording: () => void;
}

export function AudioSourceToggle({
  audioSource,
  label,
  presetLabel,
  recordingLabel,
  onSelectPreset,
  onSelectRecording,
}: AudioSourceToggleProps) {
  return (
    <View style={styles.row}>
      <SectionKicker>{label}</SectionKicker>
      <View style={styles.segmented}>
        <Pressable
          style={[styles.segmentBtn, audioSource === 'preset' && styles.segmentBtnActive]}
          onPress={onSelectPreset}
        >
          <Text style={[styles.segmentLabel, audioSource === 'preset' && styles.segmentLabelActive]}>
            {presetLabel}
          </Text>
        </Pressable>
        <Pressable
          style={[styles.segmentBtn, audioSource === 'recording' && styles.segmentBtnActive]}
          onPress={onSelectRecording}
        >
          <Text style={[styles.segmentLabel, audioSource === 'recording' && styles.segmentLabelActive]}>
            {recordingLabel}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: Spacing.micro,
  },
  segmented: {
    backgroundColor: 'rgba(31,58,61,0.06)',
    borderRadius: Radii.full,
    flexDirection: 'row',
    padding: 3,
  },
  segmentBtn: {
    alignItems: 'center',
    borderRadius: Radii.full,
    flex: 1,
    paddingVertical: 7,
  },
  segmentBtnActive: {
    backgroundColor: PetHubColors.secondary,
  },
  segmentLabel: {
    color: 'rgba(31,58,61,0.6)',
    fontSize: 13,
    fontWeight: '600',
  },
  segmentLabelActive: {
    color: '#FAF6F0',
  },
});
