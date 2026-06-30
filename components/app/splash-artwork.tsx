import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  type SharedValue,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Ellipse, G, Path, Rect, Text as SvgText } from 'react-native-svg';
import { scheduleOnRN } from 'react-native-worklets';

import { BuddyBirdColors, Fonts } from '@/constants/theme';
import { useReducedMotion } from '@/hooks/use-reduced-motion';

/**
 * Claude Design "BuddyBird Splash.html" 의 SVG 를 react-native-svg 로 이식.
 * 배경·몸통·부리·혀 path 와 viewBox·색은 디자인 SSoT 그대로 (색만 인라인 hex 금지 규칙에 따라 토큰화).
 * 반응형: 디자인의 meet + 그라데이션 letterbox 대신 `slice` 로 화면을 꽉 채운다 — viewBox
 * 비율(860:1851 ≈ 0.465)이 폰 화면비와 거의 일치해 크롭이 무시할 수준이고, 남는 영역은
 * 오버레이의 단색 splashRed 가 받친다.
 *
 * 등장: splashIn (opacity 0→1 + scale .965→1) 페이드인 (View 스타일 애니메이션).
 * 깜빡임: 디자인 `.eye` 의 scaleY 붕괴 — G transform 은 react-native-svg 에서 애니메이트 불가
 * (Reanimated "Animating SVG": G 는 appearance prop 만)이라, 눈 도형의 geometry(Rect y/height,
 * Ellipse cy/ry)를 공통 세로축(y=755)에서 접어 동일 효과를 낸다. 디자인 matrix 는 viewBox
 * 좌표로 미리 환산. 더블 블링크 1회 완료 시 `onFirstBlink` 로 게이트에 알려 스플래시 유지 해제.
 */
const AnimatedRect = Animated.createAnimatedComponent(Rect);
const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);

const EYE_PIVOT_Y = 755; // 눈 세로 중심 (흰자위 bbox 559..951)
// 디자인 matrix 환산값 (viewBox 좌표). 흰자위 blob = 캡슐(rx=폭/2) 로 재현 — 직선 측면+돔 끝이 거의 일치.
const WHITE_X = 54;
const WHITE_W = 240;
const WHITE_H = 392;
const WHITE_RX = 120;
const PUPIL_CX = 177;
const PUPIL_CY = 791.5;
const PUPIL_RX = 61;
const PUPIL_RY = 73.5;
const CATCH_CX = 195.5;
const CATCH_CY = 761.5;
const CATCH_RX = 18.5;
const CATCH_RY = 19.5;

const EYE_OPEN = 1;
const EYE_CLOSED = 0.07; // 디자인 blink scaleY .07
const FADE_IN_MS = 760;
const BLINK_START_MS = 1000;
const BLINK_DOWN_MS = 90;
const BLINK_UP_MS = 130;

interface EyeProps {
  tx: number; // 좌안 0, 우안 507 (디자인 matrix translate)
  scaleY: SharedValue<number>;
}

// 흰자위(캡슐) + 눈동자 + 캐치라이트를 공통 세로축에서 접어 깜빡인다 (도형 geometry 만 애니메이트).
function Eye({ tx, scaleY }: EyeProps) {
  const whiteProps = useAnimatedProps(() => ({
    y: EYE_PIVOT_Y - (WHITE_H * scaleY.value) / 2,
    height: WHITE_H * scaleY.value,
  }));
  const pupilProps = useAnimatedProps(() => ({
    cy: EYE_PIVOT_Y + (PUPIL_CY - EYE_PIVOT_Y) * scaleY.value,
    ry: PUPIL_RY * scaleY.value,
  }));
  const catchProps = useAnimatedProps(() => ({
    cy: EYE_PIVOT_Y + (CATCH_CY - EYE_PIVOT_Y) * scaleY.value,
    ry: CATCH_RY * scaleY.value,
  }));

  return (
    <>
      <AnimatedRect
        x={WHITE_X + tx}
        width={WHITE_W}
        rx={WHITE_RX}
        fill={BuddyBirdColors.splashEyeWhite}
        animatedProps={whiteProps}
      />
      <AnimatedEllipse
        cx={PUPIL_CX + tx}
        rx={PUPIL_RX}
        fill={BuddyBirdColors.splashPupil}
        animatedProps={pupilProps}
      />
      <AnimatedEllipse
        cx={CATCH_CX + tx}
        rx={CATCH_RX}
        fill={BuddyBirdColors.splashEyeWhite}
        animatedProps={catchProps}
      />
    </>
  );
}

interface SplashArtworkProps {
  onFirstBlink?: () => void;
}

export function SplashArtwork({ onFirstBlink }: SplashArtworkProps) {
  const reducedMotion = useReducedMotion();
  const enter = useSharedValue(0); // 0→1 페이드인 진행도
  const eyeScaleY = useSharedValue(EYE_OPEN); // 1=뜬 눈, EYE_CLOSED=감은 눈

  useEffect(() => {
    if (reducedMotion) {
      enter.set(1);
      eyeScaleY.set(EYE_OPEN);
      onFirstBlink?.(); // 동작 줄이기: 페이드/깜빡임 생략, dismissal 차단 안 함
      return;
    }

    enter.set(withTiming(1, { duration: FADE_IN_MS, easing: Easing.bezier(0.22, 1, 0.36, 1) }));

    // 더블 블링크(디자인 keyframe: 감김→뜸→감김→뜸) 1회 → 완료 시 게이트에 알림. 이후 눈은 뜬 채.
    eyeScaleY.set(
      withDelay(
        BLINK_START_MS,
        withSequence(
          withTiming(EYE_CLOSED, { duration: BLINK_DOWN_MS, easing: Easing.in(Easing.quad) }),
          withTiming(EYE_OPEN, { duration: BLINK_UP_MS, easing: Easing.out(Easing.quad) }),
          withTiming(EYE_CLOSED, { duration: BLINK_DOWN_MS, easing: Easing.in(Easing.quad) }),
          withTiming(EYE_OPEN, { duration: BLINK_UP_MS, easing: Easing.out(Easing.quad) }, (finished) => {
            if (finished && onFirstBlink) {
              scheduleOnRN(onFirstBlink);
            }
          })
        )
      )
    );

    return () => {
      cancelAnimation(enter);
      cancelAnimation(eyeScaleY);
    };
  }, [enter, eyeScaleY, onFirstBlink, reducedMotion]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: enter.value,
    transform: [{ scale: 0.965 + 0.035 * enter.value }],
  }));

  return (
    <Animated.View style={[StyleSheet.absoluteFill, containerStyle]}>
      <Svg width="100%" height="100%" viewBox="0 0 860 1851" preserveAspectRatio="xMidYMid slice">
        <G transform="matrix(1,0,0,1,4,0)">
          {/* 빨강 배경(전면) + 노랑 바닥(물결 경계 = 새 몸통 실루엣) */}
          <G transform="matrix(5.474359,0,0,10.266667,-810.205128,-636.533333)">
            <Rect x={148} y={62} width={156} height={180} fill={BuddyBirdColors.splashRed} />
          </G>
          <Path
            d="M856,1137L856,1851L-4,1850L-3,1139.956C-3,1139.956 45.833,1052.493 152,1050C189.123,1049.128 226.049,1060.078 259,1081C292.686,1102.389 336.833,1149.833 358,1172C364.544,1178.853 373.5,1185.5 380,1190C385.272,1193.65 391.333,1196.667 397,1199C402.462,1201.249 408.5,1203 414,1204C419.258,1204.956 424.659,1205.157 430,1205C435.667,1204.833 442.172,1204.575 448,1203C454.167,1201.333 461.12,1198.556 467,1195C474.167,1190.667 483.498,1183.612 491,1177C500.833,1168.333 514.602,1154.604 526,1143C553.667,1114.833 611.833,1050.167 699,1050C723.911,1049.952 748.271,1054.002 772,1065C794.75,1075.544 815.5,1091.167 827,1104C830.281,1107.661 834.674,1111.977 838.176,1116.166C844.352,1123.551 852.065,1130.487 856,1137Z"
            fill={BuddyBirdColors.splashYellow}
          />

          <Eye tx={0} scaleY={eyeScaleY} />
          <Eye tx={507} scaleY={eyeScaleY} />

          {/* 얼굴 어두운 면(부리 뒤) → 윗부리 → 아랫부리 → 혀 */}
          <Path
            d="M355,1013C341.568,1017.852 353.751,1039.561 359,1054C362.873,1064.655 368.333,1074.833 373,1084C377.333,1092.512 383.167,1102.5 387,1109C389.818,1113.779 392.479,1118.713 396,1123C399.833,1127.667 404.905,1132.179 410,1137C414.842,1141.582 424.333,1148.333 431,1148C437.667,1147.667 444.417,1140.264 450,1135C455.833,1129.5 460.978,1121.905 466,1115C471.333,1107.667 477.396,1099.441 482,1091C487,1081.833 491.592,1071.496 496,1060C500.831,1047.402 513.893,1017.964 499,1013C475.5,1005.167 378.396,1004.549 355,1013Z"
            fill={BuddyBirdColors.splashFaceMask}
          />
          <Path
            d="M425,751C383.264,752.79 323.667,781.167 306,878C301.076,904.987 308.381,942.298 313,960C316.628,973.905 321.085,985.757 327,995C337.871,1011.988 353.102,1025.866 365,1035C379.121,1045.841 377.667,1045 392,1056C399.261,1061.573 410.167,1067 416,1070C419.47,1071.784 423.102,1074.162 427,1074C431,1073.833 435.869,1071.119 440,1069C446.5,1065.667 457.7,1059.587 466,1054C474.667,1048.167 483.78,1041.21 492,1034C501.5,1025.667 515.201,1016.081 523,1004C531.5,990.833 538.567,972.075 543,955C547.5,937.667 551.182,918.443 550,900C543.333,796 473.736,748.91 425,751Z"
            fill={BuddyBirdColors.splashBeak}
          />
          <Path
            d="M329,997C330.833,1007.667 349.833,1060.5 360,1085C368.456,1105.378 381.701,1130.271 390,1144C395.921,1153.794 400.667,1162 407,1169C412.302,1174.86 420.5,1180.667 428,1180C435.5,1179.333 445.736,1175.055 452,1165C456.591,1157.63 463.7,1148.93 470.111,1138.225C481.308,1119.531 491.241,1097.141 499,1079C510.603,1051.873 521,1013.167 525,1001C527.88,992.24 506.901,1014.02 505,1024C503,1034.5 499.282,1046.99 495,1058C490.333,1070 483.434,1084.325 477,1096C471.484,1106.009 465.637,1115.699 458,1124C450.333,1132.333 440.667,1145.667 431,1146C421.333,1146.333 408.335,1135.041 400,1126C390.167,1115.333 380.134,1097.364 372,1082C358.5,1056.5 354.167,1038.167 349,1021C345.999,1011.028 327.236,986.737 329,997Z"
            fill={BuddyBirdColors.splashBeak}
          />
          <Path
            d="M429,1081C434.134,1080.827 436.463,1079.39 440,1078C444.667,1076.167 451.333,1070.333 457,1070C461.706,1069.723 466.722,1076.726 468,1082C469.333,1087.5 468.52,1096.868 465,1103C459.833,1112 446.778,1135.319 431,1137C410.154,1139.221 399.167,1117.167 393,1108C388.035,1100.62 386.333,1087.167 388,1081C389.568,1075.199 398.121,1068.625 403,1071C415.667,1077.167 422.205,1081.229 429,1081Z"
            fill={BuddyBirdColors.splashTongue}
          />
        </G>
        {/* 워드마크 — 디자인 HTML 엔 없지만 in-app 스플래시엔 유지(요청). 노랑 바닥 위 크림색. */}
        <SvgText
          x={430}
          y={1540}
          textAnchor="middle"
          fontFamily={Fonts.splashWordmark}
          fontSize={104}
          fill={BuddyBirdColors.splashCream}>
          BuddyBird
        </SvgText>
      </Svg>
    </Animated.View>
  );
}
