import { StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui/app-text';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { Pressable3D, LedgeView } from '@/components/ui/ledge-surface';
import { WaveformBars } from '@/components/ui/waveform-bars';
import {
  BuddyBirdColors,
  Fonts,
  Radii,
  categoryColor,
  categoryShadow,
} from '@/constants/theme';
import type { WordTag } from '@/features/word-library/word-library-types';

interface RecordedPlaybackRowProps {
  tag: WordTag;
  title: string;
  sourceLabel: string;
  isPlaying: boolean;
  elapsedSecondsLabel: string | null;
  onToggle: () => void;
}

export function RecordedPlaybackRow({
  tag,
  title,
  sourceLabel,
  isPlaying,
  elapsedSecondsLabel,
  onToggle,
}: RecordedPlaybackRowProps) {
  const color = categoryColor[tag];
  const shadowColor = categoryShadow[tag];
  const sourceText = isPlaying && elapsedSecondsLabel ? `${sourceLabel} · ${elapsedSecondsLabel}` : sourceLabel;

  return (
    <LedgeView
      baseStyle={styles.rowBase}
      depth="card"
      faceStyle={styles.rowFace}>
      <Pressable3D
        accessibilityRole="button"
        baseStyle={[styles.playButtonBase, { backgroundColor: shadowColor }]}
        depth="card"
        faceStyle={[styles.playButtonFace, { backgroundColor: color }]}
        onPress={onToggle}
        style={styles.playButton}>
        <IconSymbol color={BuddyBirdColors.onDark} name={isPlaying ? 'pause.fill' : 'play.fill'} size={17} />
      </Pressable3D>
      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.source}>{sourceText}</Text>
      </View>
      <View style={styles.waveform}>
        <WaveformBars animated={isPlaying} barCount={24} color={color} fill height={26} />
      </View>
    </LedgeView>
  );
}

const styles = StyleSheet.create({
  rowBase: {
    backgroundColor: BuddyBirdColors.borderMuted,
    borderRadius: Radii.lg,
  },
  rowFace: {
    alignItems: 'center',
    backgroundColor: BuddyBirdColors.surface,
    borderColor: BuddyBirdColors.borderMuted,
    borderRadius: Radii.lg,
    borderWidth: 2,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  playButton: {
    height: 44,
    width: 44,
  },
  playButtonBase: {
    borderRadius: Radii.full,
  },
  playButtonFace: {
    alignItems: 'center',
    borderRadius: Radii.full,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    color: BuddyBirdColors.ink,
    fontFamily: Fonts.bodyBlack,
    fontSize: 14,
    fontWeight: '900',
    lineHeight: 18,
  },
  source: {
    color: BuddyBirdColors.inkMuted,
    fontFamily: Fonts.bodyBold,
    fontSize: 11.5,
    fontWeight: '700',
    lineHeight: 16,
    marginTop: 1,
  },
  waveform: {
    flexShrink: 0,
    width: 96,
  },
});
