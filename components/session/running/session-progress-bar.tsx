import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { BuddyBirdColors, Motion, Radii } from '@/constants/theme';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import type { SessionEnginePhase } from '@/modules/session-audio-engine';

import { PHASE_ACCENTS } from './session-phase-accent';

interface SessionProgressBarProps {
  progress: number;
  phase: SessionEnginePhase;
}

export function SessionProgressBar({ progress, phase }: SessionProgressBarProps) {
  const reducedMotion = useReducedMotion();
  const animatedProgress = useSharedValue(clampProgress(progress));
  const fillColor = PHASE_ACCENTS[phase];

  useEffect(() => {
    animatedProgress.set(
      withTiming(clampProgress(progress), { duration: reducedMotion ? 0 : Motion.progressMs })
    );
  }, [animatedProgress, progress, reducedMotion]);

  useEffect(() => {
    return () => {
      cancelAnimation(animatedProgress);
    };
  }, [animatedProgress]);

  const fillStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: animatedProgress.get() }],
  }));

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clampProgress(progress) * 100) }}
      style={styles.track}>
      <Animated.View style={[styles.fill, { backgroundColor: fillColor }, fillStyle]} />
    </View>
  );
}

function clampProgress(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

const styles = StyleSheet.create({
  track: {
    backgroundColor: BuddyBirdColors.surface2,
    borderRadius: Radii.full,
    height: 14,
    overflow: 'hidden',
  },
  fill: {
    borderRadius: Radii.full,
    height: '100%',
    transformOrigin: 'left center',
    width: '100%',
  },
});
