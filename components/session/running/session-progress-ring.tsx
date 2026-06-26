import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { cancelAnimation, useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';
import { Circle, Svg } from 'react-native-svg';

import { BuddyBird } from '@/components/mascot/buddy-bird';
import { BuddyBirdColors, Fonts, Motion } from '@/constants/theme';
import { useReducedMotion } from '@/hooks/use-reduced-motion';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const RADIUS = 117;
const CIRCUM = 2 * Math.PI * RADIUS;
const RING_SIZE = 252;
const RING_CENTER = RING_SIZE / 2;
const RING_STROKE = 18;

interface SessionProgressRingProps {
  isLearning: boolean;
  phaseProgress: number;
  word: string;
  timerLabel: string;
}

export function SessionProgressRing({ isLearning, phaseProgress, word, timerLabel }: SessionProgressRingProps) {
  const reducedMotion = useReducedMotion();
  const animatedOffset = useSharedValue(CIRCUM);
  const accent = isLearning ? BuddyBirdColors.primary : BuddyBirdColors.secondary;

  useEffect(() => {
    if (phaseProgress === 0) {
      animatedOffset.set(CIRCUM);
    } else {
      animatedOffset.set(
        withTiming(CIRCUM * (1 - phaseProgress), { duration: reducedMotion ? 0 : Motion.progressMs })
      );
    }
  }, [phaseProgress, animatedOffset, reducedMotion]);
  useEffect(() => {
    return () => {
      cancelAnimation(animatedOffset);
    };
  }, [animatedOffset]);
  const animatedProps = useAnimatedProps(() => ({ strokeDashoffset: animatedOffset.get() }));

  return (
    <View style={styles.wrapper}>
      <Svg width={RING_SIZE} height={RING_SIZE}>
        <Circle
          cx={RING_CENTER}
          cy={RING_CENTER}
          r={RADIUS}
          stroke={BuddyBirdColors.surface2}
          strokeWidth={RING_STROKE}
          fill="none"
        />
        <AnimatedCircle
          cx={RING_CENTER}
          cy={RING_CENTER}
          r={RADIUS}
          stroke={accent}
          strokeWidth={RING_STROKE}
          fill="none"
          strokeDasharray={CIRCUM}
          strokeLinecap="round"
          transform={`rotate(-90 ${RING_CENTER} ${RING_CENTER})`}
          animatedProps={animatedProps}
        />
      </Svg>
      <View style={styles.center}>
        <BuddyBird size={60} color={accent} animation="bounce" />
        <Text
          adjustsFontSizeToFit
          minimumFontScale={0.7}
          numberOfLines={1}
          style={isLearning ? styles.word : styles.restTitle}>
          {isLearning ? word : '잠시 쉬어요'}
        </Text>
        <Text style={styles.timer}>
          {timerLabel}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  center: {
    alignItems: 'center',
    bottom: 0,
    gap: 8,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  word: {
    color: BuddyBirdColors.ink,
    fontFamily: Fonts.bodyBlack,
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: 0,
    textAlign: 'center',
    width: 170,
  },
  restTitle: {
    color: BuddyBirdColors.ink,
    fontFamily: Fonts.bodyBlack,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 0,
    textAlign: 'center',
    width: 170,
  },
  timer: {
    color: BuddyBirdColors.ink,
    fontFamily: Fonts.bodyBlack,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 0,
  },
});
