import { StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui/app-text';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { WaveformBars } from '@/components/ui/waveform-bars';
import { BuddyBirdColors, Fonts, Radii, Spacing, Typography, withAlpha } from '@/constants/theme';
import { useI18n } from '@/features/i18n/i18n-context';
import type { SessionEnginePhase } from '@/modules/session-audio-engine';

import { PHASE_ACCENTS } from './session-phase-accent';

interface SessionWaveSectionProps {
  phase: SessionEnginePhase;
  isActive: boolean;
  audioOn: boolean;
}

export function SessionWaveSection({ phase, isActive, audioOn }: SessionWaveSectionProps) {
  const { t } = useI18n();
  const accent = PHASE_ACCENTS[phase];

  if (phase !== 'learning') {
    return (
      <View style={styles.section}>
        <Text style={styles.restText}>
          {/* 케어 구간은 캡처를 하지 않으므로(BB-380) "기록해요" 휴식 문구를 쓰면 안 된다. */}
          {t(phase === 'stress-care' ? 'sessionActive.stressCareBody' : 'sessionActive.restingBody')}
        </Text>
      </View>
    );
  }

  const badgeStyle = audioOn ? { backgroundColor: withAlpha(accent, 0.12) } : styles.badgeWaiting;
  const icon = audioOn ? 'speaker.wave.2.fill' : isActive ? 'mic' : 'pause.fill';
  const label = audioOn
    ? t('sessionActive.playingBadge')
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
