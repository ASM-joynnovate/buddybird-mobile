import { StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui/app-text';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { WaveformBars } from '@/components/ui/waveform-bars';
import { BuddyBirdColors, Fonts, Radii, Spacing, Typography, withAlpha } from '@/constants/theme';
import { useI18n } from '@/features/i18n/i18n-context';

interface SessionWaveSectionProps {
  isLearning: boolean;
  isActive: boolean;
  audioOn: boolean;
  word: string;
}

export function SessionWaveSection({ isLearning, isActive, audioOn, word }: SessionWaveSectionProps) {
  const { t } = useI18n();
  const accent = isLearning ? BuddyBirdColors.primary : BuddyBirdColors.secondary;

  if (!isLearning) {
    return (
      <View style={styles.section}>
        <Text style={styles.restText}>
          {t('sessionActive.restingBody')}
        </Text>
      </View>
    );
  }

  const badgeStyle = audioOn ? { backgroundColor: withAlpha(accent, 0.12) } : styles.badgeWaiting;
  const icon = audioOn ? 'speaker.wave.2.fill' : isActive ? 'mic' : 'pause.fill';
  const label = audioOn
    ? t('sessionActive.playingBadge', { word })
    : isActive
      ? t('sessionActive.waitingBadge')
      : t('sessionActive.pausedBadge');

  return (
    <View style={styles.section}>
      <WaveformBars color={accent} height={44} barCount={38} animated={audioOn && isActive} frozen={!audioOn} />
      <View style={[styles.badge, badgeStyle]}>
        <IconSymbol
          name={icon}
          color={audioOn ? accent : BuddyBirdColors.inkMuted}
          size={15}
        />
        <Text style={[styles.text, audioOn ? styles.textActive : styles.textWaiting]}>
          {label}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    alignItems: 'center',
    gap: Spacing.md,
    paddingBottom: 14,
    paddingHorizontal: Spacing.screenX,
  },
  badge: {
    alignItems: 'center',
    alignSelf: 'center',
    borderRadius: Radii.full,
    flexDirection: 'row',
    gap: Spacing.xs,
    minHeight: 34,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  text: {
    fontFamily: Fonts.bodyExtraBold,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0,
  },
  textActive: {
    color: BuddyBirdColors.ink,
  },
  badgeWaiting: {
    backgroundColor: BuddyBirdColors.surface1,
  },
  textWaiting: {
    color: BuddyBirdColors.inkMuted,
  },
  restText: {
    ...Typography.caption,
    color: BuddyBirdColors.inkMuted,
    fontSize: 13,
    lineHeight: 20,
    maxWidth: 240,
    textAlign: 'center',
  },
});
