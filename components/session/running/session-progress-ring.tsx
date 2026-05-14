import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { cancelAnimation, useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';
import { Circle, Svg } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const RADIUS = 96;
const CIRCUM = 2 * Math.PI * RADIUS;

interface SessionProgressRingProps {
  isLearning: boolean;
  phaseProgress: number;
  word: string;
  timerLabel: string;
}

export function SessionProgressRing({ isLearning, phaseProgress, word, timerLabel }: SessionProgressRingProps) {
  const animatedOffset = useSharedValue(CIRCUM);
  useEffect(() => {
    if (phaseProgress === 0) {
      animatedOffset.value = CIRCUM;
    } else {
      animatedOffset.value = withTiming(CIRCUM * (1 - phaseProgress), { duration: 950 });
    }
  }, [phaseProgress, animatedOffset]);
  useEffect(() => {
    return () => {
      cancelAnimation(animatedOffset);
    };
  }, [animatedOffset]);
  const animatedProps = useAnimatedProps(() => ({ strokeDashoffset: animatedOffset.value }));

  return (
    <View style={styles.wrapper}>
      <Svg width={240} height={240}>
        <Circle cx={120} cy={120} r={RADIUS} stroke="rgba(255,255,255,0.07)" strokeWidth={5} fill="none" />
        <AnimatedCircle
          cx={120}
          cy={120}
          r={RADIUS}
          stroke={isLearning ? '#5EEAD4' : '#FDBA74'}
          strokeWidth={5}
          fill="none"
          strokeDasharray={CIRCUM}
          strokeLinecap="round"
          transform="rotate(-90 120 120)"
          animatedProps={animatedProps}
        />
      </Svg>
      <View style={styles.center}>
        <Text style={styles.word}>{word}</Text>
        <Text style={[styles.timer, { color: isLearning ? '#5EEAD4' : '#FDBA74' }]}>
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
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  word: {
    color: '#FAF6F0',
    fontSize: 60,
    fontWeight: '700',
    letterSpacing: -2,
    textAlign: 'center',
  },
  timer: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginTop: 10,
  },
});
