import { StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui/app-text';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { Pressable3D, LedgeView } from '@/components/ui/ledge-surface';
import { WaveformBars } from '@/components/ui/waveform-bars';
import {
  BuddyBirdColors,
  Fonts,
  Radii,
  Typography,
  categoryColor,
  categoryShadow,
} from '@/constants/theme';
import type { RecordingLifecycle } from '@/features/audio/audio-types';
import type { WordTag } from '@/features/word-library/word-library-types';

interface RecorderColorCardProps {
  tag: WordTag;
  wordLabel: string;
  emptyLabel: string;
  kicker: string;
  statusLabel: string;
  lifecycle: RecordingLifecycle;
  onToggle: () => void;
}

export function RecorderColorCard({
  tag,
  wordLabel,
  emptyLabel,
  kicker,
  statusLabel,
  lifecycle,
  onToggle,
}: RecorderColorCardProps) {
  const color = categoryColor[tag];
  const shadowColor = categoryShadow[tag];
  const isRecording = lifecycle === 'recording';
  const isBusy = lifecycle === 'requesting-permission';
  const displayLabel = wordLabel.trim().length > 0 ? `"${wordLabel.trim()}"` : emptyLabel;

  return (
    <LedgeView
      baseStyle={[styles.cardBase, { backgroundColor: shadowColor }]}
      depth="buttonSm"
      faceStyle={[styles.cardFace, { backgroundColor: color }]}>
      <Text style={styles.kicker}>{kicker}</Text>
      <Text adjustsFontSizeToFit minimumFontScale={0.7} numberOfLines={1} style={styles.word}>
        {displayLabel}
      </Text>
      <View style={styles.waveform}>
        <WaveformBars animated={isRecording} barCount={48} color={BuddyBirdColors.onDark} fill height={48} />
      </View>
      <Pressable3D
        accessibilityLabel={isRecording ? '음성 녹음 중지' : '음성 녹음'}
        accessibilityRole="button"
        accessibilityState={{ busy: isBusy }}
        baseStyle={[
          styles.recordButtonBase,
          { backgroundColor: isRecording ? BuddyBirdColors.accentRedShadow : BuddyBirdColors.ledgeOnColorSoft },
        ]}
        depth="buttonSm"
        disabled={isBusy}
        faceStyle={[
          styles.recordButtonFace,
          { backgroundColor: isRecording ? BuddyBirdColors.accentRed : BuddyBirdColors.onDark },
        ]}
        onPress={onToggle}
        style={styles.recordButton}>
        {isRecording ? (
          <View style={styles.stopGlyph} />
        ) : (
          <IconSymbol color={color} name="mic" size={34} />
        )}
      </Pressable3D>
      <Text style={styles.status}>{statusLabel}</Text>
    </LedgeView>
  );
}

const styles = StyleSheet.create({
  cardBase: {
    borderRadius: Radii.xl,
  },
  cardFace: {
    alignItems: 'center',
    borderRadius: Radii.xl,
    padding: 24,
  },
  kicker: {
    ...Typography.label,
    color: BuddyBirdColors.onColorMuted,
    fontSize: 12,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  word: {
    color: BuddyBirdColors.onDark,
    fontFamily: Fonts.bodyBlack,
    fontSize: 34,
    fontWeight: '900',
    lineHeight: 40,
    marginBottom: 16,
    marginTop: 4,
    textAlign: 'center',
  },
  waveform: {
    marginBottom: 20,
    width: '100%',
  },
  recordButton: {
    height: 80,
    width: 80,
  },
  recordButtonBase: {
    borderRadius: Radii.full,
  },
  recordButtonFace: {
    alignItems: 'center',
    borderRadius: Radii.full,
    height: 80,
    justifyContent: 'center',
    width: 80,
  },
  stopGlyph: {
    backgroundColor: BuddyBirdColors.onDark,
    borderRadius: 7,
    height: 26,
    width: 26,
  },
  status: {
    color: BuddyBirdColors.onColorStrong,
    fontFamily: Fonts.bodyExtraBold,
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 18,
    marginTop: 14,
    textAlign: 'center',
  },
});
