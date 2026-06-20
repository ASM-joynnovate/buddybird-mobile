import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { BuddyBirdColors, Motion, Radii } from '@/constants/theme';
import { useReducedMotion } from '@/hooks/use-reduced-motion';

interface ConfettiSpec {
  id: string;
  color: string;
  left: number;
  top: number;
  drift: number;
  distance: number;
  rotate: number;
  delay: number;
}

const CONFETTI: ConfettiSpec[] = [
  { id: 'c1', color: BuddyBirdColors.accentYellow, left: 7, top: 34, drift: 28, distance: 500, rotate: 220, delay: 0 },
  { id: 'c2', color: BuddyBirdColors.onDark, left: 17, top: 72, drift: -24, distance: 480, rotate: -180, delay: 120 },
  { id: 'c3', color: BuddyBirdColors.secondary, left: 27, top: 24, drift: 30, distance: 520, rotate: 260, delay: 260 },
  { id: 'c4', color: BuddyBirdColors.accentCoral, left: 36, top: 88, drift: -32, distance: 470, rotate: -240, delay: 80 },
  { id: 'c5', color: BuddyBirdColors.accentPurple, left: 47, top: 40, drift: 20, distance: 510, rotate: 200, delay: 320 },
  { id: 'c6', color: BuddyBirdColors.accentYellow, left: 58, top: 68, drift: -28, distance: 490, rotate: -260, delay: 180 },
  { id: 'c7', color: BuddyBirdColors.onDark, left: 69, top: 20, drift: 34, distance: 530, rotate: 280, delay: 420 },
  { id: 'c8', color: BuddyBirdColors.secondary, left: 82, top: 96, drift: -26, distance: 465, rotate: -210, delay: 220 },
  { id: 'c9', color: BuddyBirdColors.accentCoral, left: 92, top: 50, drift: 18, distance: 505, rotate: 240, delay: 520 },
  { id: 'c10', color: BuddyBirdColors.accentPurple, left: 12, top: 140, drift: -18, distance: 440, rotate: -160, delay: 640 },
  { id: 'c11', color: BuddyBirdColors.secondary, left: 23, top: 166, drift: 22, distance: 455, rotate: 210, delay: 740 },
  { id: 'c12', color: BuddyBirdColors.accentYellow, left: 74, top: 150, drift: -22, distance: 445, rotate: -190, delay: 700 },
  { id: 'c13', color: BuddyBirdColors.onDark, left: 88, top: 178, drift: 24, distance: 430, rotate: 175, delay: 820 },
  { id: 'c14', color: BuddyBirdColors.accentCoral, left: 4, top: 218, drift: 20, distance: 415, rotate: -220, delay: 900 },
  { id: 'c15', color: BuddyBirdColors.accentPurple, left: 52, top: 214, drift: -20, distance: 420, rotate: 190, delay: 960 },
  { id: 'c16', color: BuddyBirdColors.secondary, left: 96, top: 230, drift: -18, distance: 405, rotate: -170, delay: 1020 },
];

export function SessionConfetti() {
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    return null;
  }

  return (
    <>
      {CONFETTI.map((spec) => (
        <ConfettiPiece key={spec.id} spec={spec} />
      ))}
    </>
  );
}

function ConfettiPiece({ spec }: { spec: ConfettiSpec }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.set(
      withRepeat(
        withSequence(
          withDelay(spec.delay, withTiming(1, { duration: Motion.progressMs * 6 })),
          withTiming(0, { duration: 0 })
        ),
        -1,
        false
      )
    );

    return () => {
      cancelAnimation(progress);
    };
  }, [progress, spec.delay]);

  const animatedStyle = useAnimatedStyle(() => {
    const value = progress.get();

    return {
      opacity: value > 0 ? 1 : 0,
      transform: [
        { translateY: -28 + value * spec.distance },
        { translateX: Math.sin(value * Math.PI * 2) * spec.drift },
        { rotate: `${value * spec.rotate}deg` },
      ],
    };
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.piece,
        {
          backgroundColor: spec.color,
          left: `${spec.left}%`,
          top: spec.top,
        },
        animatedStyle,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  piece: {
    borderRadius: Radii.sm / 3,
    height: 14,
    position: 'absolute',
    width: 10,
    zIndex: 1,
  },
});
