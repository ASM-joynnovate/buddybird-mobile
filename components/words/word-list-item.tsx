import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui/app-text';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { LedgeView, Pressable3D } from '@/components/ui/ledge-surface';
import {
  BuddyBirdColors,
  Fonts,
  Radii,
  categoryColor,
  categoryTintStrong,
  type BuddyBirdCategory,
} from '@/constants/theme';
import { useI18n } from '@/features/i18n/i18n-context';
import type { WordTag } from '@/features/word-library/word-library-types';

interface WordListItemProps {
  label: string;
  tag: WordTag;
  sourceLabel: string;
  isPreset: boolean;
  canPreview: boolean;
  isPlaying: boolean;
  onDelete: () => void;
  onPlay: () => void;
}

export function WordListItem({
  label,
  tag,
  sourceLabel,
  isPreset,
  canPreview,
  isPlaying,
  onDelete,
  onPlay,
}: WordListItemProps) {
  const { t } = useI18n();
  const color = categoryColor[tag as BuddyBirdCategory] ?? BuddyBirdColors.primary;
  const tint = categoryTintStrong[tag as BuddyBirdCategory] ?? BuddyBirdColors.orangeTint;
  const sourceIcon = isPreset ? 'speaker.wave.2.fill' : 'mic';

  return (
    <LedgeView baseStyle={styles.cardBase} depth="card" faceStyle={styles.card}>
      <View style={[styles.avatar, { backgroundColor: tint }]}>
        <Text style={[styles.avatarText, { color }]}>{label.charAt(0)}</Text>
      </View>
      <View style={styles.info}>
        <View style={styles.titleRow}>
          <Text numberOfLines={1} style={styles.word}>{label}</Text>
          <View style={[styles.catPill, { backgroundColor: tint }]}>
            <Text style={[styles.catPillText, { color }]}>{t(`wordLibrary.tagLabels.${tag}`)}</Text>
          </View>
        </View>
        <View style={styles.sourceRow}>
          <IconSymbol name={sourceIcon} size={13} color={BuddyBirdColors.inkMuted} />
          <Text style={styles.sourceText}>{sourceLabel}</Text>
        </View>
      </View>
      <Pressable
        accessibilityLabel={t('wordLibrary.deleteA11y', { label })}
        accessibilityRole="button"
        hitSlop={8}
        onPress={onDelete}
        style={styles.deleteBtn}>
        <IconSymbol name="trash" size={17} color={BuddyBirdColors.inkMuted} />
      </Pressable>
      <Pressable3D
        accessibilityLabel={t('wordLibrary.previewA11y', { label })}
        accessibilityRole="button"
        accessibilityState={{ disabled: !canPreview }}
        baseStyle={styles.playBtnBase}
        disabled={!canPreview}
        depth="chip"
        faceStyle={[styles.playBtn, !canPreview && styles.disabledPreviewBtn]}
        hitSlop={8}
        onPress={onPlay}>
        <IconSymbol name={isPlaying ? 'stop.fill' : 'play.fill'} size={16} color={BuddyBirdColors.onDark} />
      </Pressable3D>
    </LedgeView>
  );
}

const styles = StyleSheet.create({
  cardBase: {
    backgroundColor: BuddyBirdColors.borderMuted,
    borderRadius: Radii.lg,
  },
  card: {
    alignItems: 'center',
    backgroundColor: BuddyBirdColors.surface,
    borderColor: BuddyBirdColors.borderMuted,
    borderRadius: Radii.lg,
    borderWidth: 2,
    flexDirection: 'row',
    gap: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  avatar: {
    alignItems: 'center',
    borderRadius: 13,
    flexShrink: 0,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  avatarText: {
    fontFamily: Fonts.bodyBlack,
    fontSize: 22,
    fontWeight: '900',
  },
  info: {
    alignItems: 'flex-start',
    flex: 1,
    flexDirection: 'column',
    gap: 3,
    minWidth: 0,
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    maxWidth: '100%',
  },
  word: {
    color: BuddyBirdColors.ink,
    flexShrink: 1,
    fontFamily: Fonts.bodyBlack,
    fontSize: 18,
    fontWeight: '900',
  },
  catPill: {
    borderRadius: Radii.full,
    flexShrink: 0,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  catPillText: {
    fontFamily: Fonts.bodyExtraBold,
    fontSize: 10,
    fontWeight: '800',
  },
  sourceRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
  },
  sourceText: {
    color: BuddyBirdColors.inkMuted,
    fontFamily: Fonts.bodyBold,
    fontSize: 11.5,
    fontWeight: '700',
  },
  deleteBtn: {
    alignItems: 'center',
    backgroundColor: BuddyBirdColors.surface,
    borderColor: BuddyBirdColors.borderMuted,
    borderRadius: Radii.full,
    borderWidth: 2,
    flexShrink: 0,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  playBtn: {
    alignItems: 'center',
    backgroundColor: BuddyBirdColors.primary,
    borderColor: BuddyBirdColors.primaryShadow,
    borderRadius: Radii.full,
    borderWidth: 1.5,
    flexShrink: 0,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  playBtnBase: {
    backgroundColor: BuddyBirdColors.primaryShadow,
    borderRadius: Radii.full,
  },
  disabledBtn: {
    opacity: 0.3,
  },
  disabledPreviewBtn: {
    opacity: 0.4,
  },
});
