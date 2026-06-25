import { useEffect } from 'react';
import Animated, {
  cancelAnimation,
  Easing,
  type SharedValue,
  useAnimatedProps,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Ellipse, Path, Rect, Text as SvgText } from 'react-native-svg';
import { scheduleOnRN } from 'react-native-worklets';

import { BuddyBirdColors, Fonts } from '@/constants/theme';
import { useReducedMotion } from '@/hooks/use-reduced-motion';

/**
 * Claude Design "BuddyBird Splash.html" 의 SVG 를 react-native-svg 로 이식.
 * viewBox·path·좌표·색은 디자인 SSoT 그대로. 색만 인라인 hex 금지 규칙에 따라 토큰화.
 * 반응형: 디자인이 정한 `preserveAspectRatio="xMidYMid slice"` + 넉넉한 viewBox 여백으로
 * 화면비가 달라도 빈 빨강 하늘/노랑 바닥만 잘리고 핵심 요소는 보존됨.
 *
 * 눈 깜빡임: 디자인의 eyeBall scaleY 깜빡임을 타원 `ry` 애니메이션으로 구현(타원 중심 기준이라
 * G transform 앵커 이슈 없음). 첫 깜빡임 완료 시 `onFirstBlink` 로 게이트에 알려 스플래시 유지에 사용.
 */
const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);

const EYE_CREAM_R = 290;
const EYE_PUPIL_R = 80;
const BLINK_AMOUNT = 0.95; // 감김 정도 (1=완전, 0=뜸)
const BLINK_START_MS = 500; // 등장 후 첫 깜빡임까지
const BLINK_DOWN_MS = 90;
const BLINK_UP_MS = 130;

interface EyeProps {
  creamCx: number;
  pupilCx: number;
  blink: SharedValue<number>;
}

function Eye({ creamCx, pupilCx, blink }: EyeProps) {
  const creamProps = useAnimatedProps(() => ({ ry: EYE_CREAM_R * (1 - BLINK_AMOUNT * blink.value) }));
  const pupilProps = useAnimatedProps(() => ({ ry: EYE_PUPIL_R * (1 - BLINK_AMOUNT * blink.value) }));

  return (
    <>
      <AnimatedEllipse
        cx={creamCx}
        cy={706}
        rx={EYE_CREAM_R}
        ry={EYE_CREAM_R}
        animatedProps={creamProps}
        fill={BuddyBirdColors.splashCream}
      />
      <AnimatedEllipse
        cx={pupilCx}
        cy={722}
        rx={EYE_PUPIL_R}
        ry={EYE_PUPIL_R}
        animatedProps={pupilProps}
        fill={BuddyBirdColors.splashInk}
      />
    </>
  );
}

interface SplashArtworkProps {
  onFirstBlink?: () => void;
}

export function SplashArtwork({ onFirstBlink }: SplashArtworkProps) {
  const reducedMotion = useReducedMotion();
  const blink = useSharedValue(0); // 0=뜬 눈, 1=감은 눈

  useEffect(() => {
    if (reducedMotion) {
      blink.set(0);
      onFirstBlink?.(); // 동작 줄이기: 깜빡임 생략, dismissal 차단 안 함
      return;
    }

    // 등장 후 1회 깜빡임 → 완료 시 게이트에 알림(스플래시 유지 해제). 이후 눈은 뜬 채 유지.
    blink.set(
      withDelay(
        BLINK_START_MS,
        withSequence(
          withTiming(1, { duration: BLINK_DOWN_MS, easing: Easing.in(Easing.quad) }),
          withTiming(0, { duration: BLINK_UP_MS, easing: Easing.out(Easing.quad) }, (finished) => {
            if (finished && onFirstBlink) {
              scheduleOnRN(onFirstBlink);
            }
          })
        )
      )
    );

    return () => cancelAnimation(blink);
  }, [blink, onFirstBlink, reducedMotion]);

  return (
    <Svg width="100%" height="100%" viewBox="0 -320 1080 2759" preserveAspectRatio="xMidYMid slice">
      <Rect x={0} y={-320} width={1080} height={2759} fill={BuddyBirdColors.splashRed} />
      <Path
        d="M -40,1142 C 200,1140 340,1300 540,1528 C 740,1300 880,1140 1120,1142 L 1120,2460 L -40,2460 Z"
        fill={BuddyBirdColors.splashYellow}
      />
      <Eye creamCx={75} pupilCx={100} blink={blink} />
      <Eye creamCx={1005} pupilCx={983} blink={blink} />
      {/* 부리 */}
      <Path
        d="M 540,729 C 690,732 762,860 762,1010 C 762,1240 650,1542 540,1580 C 430,1542 318,1240 318,1010 C 318,860 390,732 540,729 Z"
        fill={BuddyBirdColors.splashInk}
      />
      {/* 워드마크 */}
      <SvgText
        x={540}
        y={1820}
        textAnchor="middle"
        fontFamily={Fonts.splashWordmark}
        fontSize={118}
        fill={BuddyBirdColors.splashCream}>
        BuddyBird
      </SvgText>
    </Svg>
  );
}
