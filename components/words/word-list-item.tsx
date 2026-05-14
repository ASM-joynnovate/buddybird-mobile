import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { PetHubColors, Radii } from '@/constants/theme';
import { useAudioPreview } from '@/features/audio/hooks/use-audio-preview';
import { useI18n } from '@/features/i18n/i18n-context';
import { catColors } from '@/features/training/session-words-mock';
import type { WordEntry } from '@/features/word-library/word-library-types';

interface WordListItemProps {
  entry: WordEntry;
  onEdit: () => void;
}

export function WordListItem({ entry, onEdit }: WordListItemProps) {
  const { t } = useI18n();
  const col = catColors[entry.tag] ?? PetHubColors.secondary;
  const { canPreview, playPreview } = useAudioPreview(entry.transformedAudioUri ?? entry.audioUri);
  const isPreset = entry.sourceType === 'preset';

  return (
    <View style={styles.card}>
      <View style={[styles.badge, { backgroundColor: `${col}18` }]}>
        <Text style={[styles.badgeText, { color: col }]}>{entry.label[0]}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.word}>{entry.label}</Text>
        <View style={styles.tagsRow}>
          <View style={[styles.sourcePill, isPreset ? styles.sourcePillPreset : styles.sourcePillRecording]}>
            <Text style={[styles.sourcePillText, isPreset ? styles.sourcePillTextPreset : styles.sourcePillTextRecording]}>
              {isPreset ? t('wordLibrary.sourcePreset') : t('wordLibrary.sourceRecording')}
            </Text>
          </View>
          <View style={[styles.catPill, { backgroundColor: `${col}18` }]}>
            <Text style={[styles.catPillText, { color: col }]}>{entry.tag}</Text>
          </View>
        </View>
      </View>
      <TouchableOpacity style={styles.editBtn} activeOpacity={0.7} onPress={onEdit}>
        <Text style={styles.editBtnIcon}>✎</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.playBtn, !canPreview && { opacity: 0.4 }]}
        activeOpacity={0.7}
        disabled={!canPreview}
        onPress={() => { void playPreview(); }}
      >
        <Text style={styles.playBtnIcon}>▶</Text>
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
    backgroundColor: 'rgba(31,58,61,0.06)',
  },
  sourcePillRecording: {
    backgroundColor: 'rgba(42,157,143,0.12)',
  },
  sourcePillText: {
    fontSize: 11,
    fontWeight: '500',
  },
  sourcePillTextPreset: {
    color: 'rgba(31,58,61,0.45)',
  },
  sourcePillTextRecording: {
    color: PetHubColors.secondary,
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
  playBtnIcon: {
    color: PetHubColors.primary,
    fontSize: 12,
    marginLeft: 2,
  },
});
