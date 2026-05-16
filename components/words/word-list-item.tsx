import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { PetHubColors, Radii } from '@/constants/theme';
import { catColors } from '@/features/training/session-words-mock';

interface WordListItemProps {
  label: string;
  tag: string;
  sourceLabel: string;
  isPreset: boolean;
  canPreview: boolean;
  isPlaying: boolean;
  onEdit: () => void;
  onPlay: () => void;
}

export function WordListItem({
  label,
  tag,
  sourceLabel,
  isPreset,
  canPreview,
  isPlaying,
  onEdit,
  onPlay,
}: WordListItemProps) {
  const col = catColors[tag] ?? PetHubColors.secondary;
  return (
    <View style={styles.card}>
      <View style={[styles.badge, { backgroundColor: `${col}18` }]}>
        <Text style={[styles.badgeText, { color: col }]}>{label[0]}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.word}>{label}</Text>
        <View style={styles.tagsRow}>
          <View style={[styles.sourcePill, isPreset ? styles.sourcePillPreset : styles.sourcePillRecording]}>
            <Text style={[styles.sourcePillText, isPreset ? styles.sourcePillTextPreset : styles.sourcePillTextRecording]}>
              {sourceLabel}
            </Text>
          </View>
          <View style={[styles.catPill, { backgroundColor: `${col}18` }]}>
            <Text style={[styles.catPillText, { color: col }]}>{tag}</Text>
          </View>
        </View>
      </View>
      <TouchableOpacity
        style={[styles.editBtn, isPreset && { opacity: 0.3 }]}
        activeOpacity={0.7}
        disabled={isPreset}
        onPress={onEdit}
      >
        <IconSymbol name={'pencil'} style={styles.editBtnIcon} size={16} color={PetHubColors.primary} />
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.playBtn, !canPreview && { opacity: 0.4 }]}
        activeOpacity={0.7}
        disabled={!canPreview}
        onPress={onPlay}
      >
        <IconSymbol name={isPlaying ? 'stop.fill' : 'play.fill'} size={16} color={PetHubColors.primary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(31,58,61,0.06)',
    borderRadius: Radii.sectionCard,
    borderWidth: 0.5,
    flexDirection: 'row',
    gap: 14,
    padding: 14,
  },
  badge: {
    alignItems: 'center',
    borderRadius: Radii.iconSquare,
    flexShrink: 0,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  badgeText: {
    fontSize: 22,
    fontWeight: '700',
  },
  info: {
    alignItems: 'flex-start',
    flex: 1,
    flexDirection: 'column',
    gap: 6,
  },
  tagsRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  word: {
    color: PetHubColors.primary,
    fontSize: 18,
    fontWeight: '700',
  },
  catPill: {
    borderRadius: Radii.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  catPillText: {
    fontSize: 11,
    fontWeight: '500',
  },
  sourcePill: {
    borderRadius: Radii.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  sourcePillPreset: {
    backgroundColor: 'transparent',
    borderColor: 'rgba(31,58,61,0.20)',
    borderWidth: 1,
  },
  sourcePillRecording: {
    backgroundColor: 'transparent',
    borderColor: PetHubColors.feather,
    borderWidth: 1,
  },
  sourcePillText: {
    fontSize: 11,
    fontWeight: '500',
  },
  sourcePillTextPreset: {
    color: PetHubColors.kickerMuted,
  },
  sourcePillTextRecording: {
    color: PetHubColors.tertiaryDeep,
  },
  editBtn: {
    alignItems: 'center',
    backgroundColor: 'rgba(31,58,61,0.06)',
    borderRadius: Radii.full,
    flexShrink: 0,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  editBtnIcon: {
    color: PetHubColors.primary,
    fontSize: 14,
  },
  playBtn: {
    alignItems: 'center',
    backgroundColor: 'rgba(31,58,61,0.06)',
    borderRadius: Radii.full,
    flexShrink: 0,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
});
