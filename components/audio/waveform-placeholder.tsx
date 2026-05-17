import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { BuddyBirdColors, Radii, Spacing, Typography } from '@/constants/theme';
import { useI18n } from '@/features/i18n/i18n-context';

const BAR_COUNT = 30;
const WAVEFORM_HEIGHT = 78;
const BAR_MIN_HEIGHT = 4;
const BAR_MAX_HEIGHT = WAVEFORM_HEIGHT * 0.85;

const SEED_HEIGHTS = [
  0.23, 0.41, 0.31, 0.62, 0.38, 0.72, 0.28, 0.49, 0.36, 0.64,
  0.26, 0.57, 0.44, 0.33, 0.67, 0.31, 0.52, 0.46, 0.23, 0.54,
  0.36, 0.69, 0.28, 0.59, 0.41, 0.26, 0.64, 0.38, 0.57, 0.31,
];

type WaveformState = 'idle' | 'recording' | 'recorded' | 'pitch-applied' | 'preview-disabled' | 'playing';

interface WaveformPlaceholderProps {
  state?: WaveformState;
  statusLabel?: string;
  helperText?: string;
  metering?: number | null;
}

export function WaveformPlaceholder({ state = 'idle', statusLabel, helperText, metering }: WaveformPlaceholderProps) {
  const { t } = useI18n();
  const isMuted = state === 'preview-disabled';
  const isRecording = state === 'recording';
  const isPlaying = state === 'playing';

  const animatedHeights = useRef<Animated.Value[]>(
    SEED_HEIGHTS.map((s) => new Animated.Value(s * BAR_MAX_HEIGHT + BAR_MIN_HEIGHT))
  ).current;
  const prevEffectiveRef = useRef(0);

  useEffect(() => {
    if (isPlaying) {
      let active = true;
      function animatePlayback() {
        if (!active) return;
        const anims = animatedHeights.map((av, i) => {
          const centreWeight = 1 - Math.abs(i - BAR_COUNT / 2) / (BAR_COUNT / 2);
          const targetNorm = Math.max(0.08, centreWeight * 0.55 + (Math.random() - 0.5) * 0.3);
          return Animated.timing(av, {
            toValue: targetNorm * BAR_MAX_HEIGHT + BAR_MIN_HEIGHT,
            duration: 180,
            useNativeDriver: false,
          });
        });
        Animated.parallel(anims).start(({ finished }) => {
          if (finished && active) animatePlayback();
        });
      }
      animatePlayback();
      return () => { active = false; };
    }

    if (!isRecording || metering == null) {
      prevEffectiveRef.current = 0;
      const anims = animatedHeights.map((av, i) =>
        Animated.timing(av, {
          toValue: SEED_HEIGHTS[i] * BAR_MAX_HEIGHT + BAR_MIN_HEIGHT,
          duration: 200,
          useNativeDriver: false,
        })
      );
      Animated.parallel(anims).start();
      return;
    }

    // 0.25 미만은 배경 잡음으로 간주, 그 이상 구간을 0-1로 재정규화
    const NOISE_FLOOR = 0.25;
    const effective = metering < NOISE_FLOOR ? 0 : (metering - NOISE_FLOOR) / (1 - NOISE_FLOOR);
    const prev = prevEffectiveRef.current;
    prevEffectiveRef.current = effective;

    if (effective === 0) {
      if (prev === 0) return; // 이미 무음 — 애니메이션 불필요
      // 유음 → 무음 전환: 막대를 최소 높이로 한 번만 내림
      Animated.parallel(
        animatedHeights.map((av) =>
          Animated.timing(av, { toValue: BAR_MIN_HEIGHT, duration: 150, useNativeDriver: false })
        )
      ).start();
      return;
    }

    const anims = animatedHeights.map((av, i) => {
      const centreWeight = 1 - Math.abs(i - BAR_COUNT / 2) / (BAR_COUNT / 2);
      const jitter = (Math.random() - 0.5) * 0.35 * effective;
      const targetNorm = Math.max(0, Math.min(1, effective * centreWeight + jitter));
      return Animated.timing(av, {
        toValue: targetNorm * BAR_MAX_HEIGHT + BAR_MIN_HEIGHT,
        duration: 80,
        useNativeDriver: false,
      });
    });
    Animated.parallel(anims).start();
  }, [metering, isRecording, isPlaying, animatedHeights]);

  return (
    <View style={[styles.container, isMuted ? styles.mutedContainer : undefined]}>
      <View accessibilityLabel={t('audio.waveformPreviewLabel')} style={styles.waveform}>
        {animatedHeights.map((animValue, index) => (
          <Animated.View
            key={index}
            style={[
              styles.bar,
              isRecording ? styles.recordingBar : undefined,
              isMuted ? styles.mutedBar : undefined,
              {
                height: animValue,
                opacity: index > 4 && index < BAR_COUNT - 4 ? 1 : 0.42,
              },
            ]}
          />
        ))}
      </View>
      {statusLabel || helperText ? (
        <View style={styles.copyBlock}>
          {statusLabel ? <Text style={[styles.statusLabel, isMuted ? styles.mutedText : undefined]}>{statusLabel}</Text> : null}
          {helperText ? <Text style={styles.helperText}>{helperText}</Text> : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(31,58,61,0.05)',
    borderRadius: Radii.sectionCard,
    gap: Spacing.tabPaddingY,
    paddingHorizontal: Spacing.cardPaddingSm,
    paddingVertical: Spacing.tabPaddingY,
  },
  mutedContainer: {
    backgroundColor: 'rgba(31,58,61,0.035)',
  },
  waveform: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.waveformGap,
    height: WAVEFORM_HEIGHT,
    justifyContent: 'center',
  },
  bar: {
    backgroundColor: BuddyBirdColors.secondary,
    borderRadius: 2,
    width: 5,
  },
  recordingBar: {
    backgroundColor: BuddyBirdColors.accentCoral,
  },
  mutedBar: {
    backgroundColor: 'rgba(31,58,61,0.28)',
  },
  copyBlock: {
    gap: Spacing.micro,
  },
  statusLabel: {
    ...Typography.bodySmall,
    color: BuddyBirdColors.primary,
    fontWeight: '700',
  },
  helperText: {
    ...Typography.caption,
    color: 'rgba(31,58,61,0.62)',
  },
  mutedText: {
    color: 'rgba(31,58,61,0.56)',
  },
});
