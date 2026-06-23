import {
  Pressable,
  StyleSheet,
  View,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { Depth } from '@/constants/theme';
import { useReducedMotion } from '@/hooks/use-reduced-motion';

export type LedgeDepth = 'buttonSm' | 'buttonMd' | 'buttonLg' | 'card' | 'selectedCard' | 'chip' | 'flat';

interface LedgeViewProps {
  children: React.ReactNode;
  depth: LedgeDepth;
  baseStyle: StyleProp<ViewStyle>;
  faceStyle: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
}

type Pressable3DProps = Omit<PressableProps, 'children' | 'style'> & LedgeViewProps;

export function LedgeView({ children, depth, baseStyle, faceStyle, style }: LedgeViewProps) {
  return (
    <View style={[styles.root, style]}>
      <View pointerEvents="none" style={[styles.base, baseDepthStyles[depth], baseStyle]} />
      <View style={[styles.face, faceDepthStyles[depth], faceStyle]}>{children}</View>
    </View>
  );
}

export function Pressable3D({
  children,
  depth,
  baseStyle,
  faceStyle,
  style,
  disabled,
  ...props
}: Pressable3DProps) {
  const reducedMotion = useReducedMotion();

  return (
    <Pressable
      {...props}
      disabled={disabled}
      style={[styles.root, style]}>
      {({ pressed }) => (
        <>
          <View pointerEvents="none" style={[styles.base, baseDepthStyles[depth], baseStyle]} />
          <View
            style={[
              styles.face,
              faceDepthStyles[depth],
              faceStyle,
              pressed && !disabled && !reducedMotion ? pressedFaceDepthStyles[depth] : undefined,
            ]}>
            {children}
          </View>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'relative',
  },
  base: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
  },
  face: {
    zIndex: 1,
  },
  baseButtonSm: { top: Depth.buttonSmOffset },
  baseButtonMd: { top: Depth.buttonMdOffset },
  baseButtonLg: { top: Depth.buttonLgOffset },
  baseCard: { top: Depth.cardOffset },
  baseSelectedCard: { top: Depth.selectedCardOffset },
  baseChip: { top: Depth.cardOffset },
  baseFlat: { top: 0 },
  faceButtonSm: { marginBottom: Depth.buttonSmOffset },
  faceButtonMd: { marginBottom: Depth.buttonMdOffset },
  faceButtonLg: { marginBottom: Depth.buttonLgOffset },
  faceCard: { marginBottom: Depth.cardOffset },
  faceSelectedCard: { marginBottom: Depth.selectedCardOffset },
  faceChip: { marginBottom: Depth.cardOffset },
  faceFlat: { marginBottom: 0 },
  pressedButtonSm: {
    transform: [{ translateY: Depth.buttonSmOffset - Depth.buttonPressedOffset }],
  },
  pressedButtonMd: {
    transform: [{ translateY: Depth.buttonMdOffset - Depth.buttonPressedOffset }],
  },
  pressedButtonLg: {
    transform: [{ translateY: Depth.buttonLgOffset - Depth.buttonPressedOffset }],
  },
  pressedCard: {
    transform: [{ translateY: Depth.cardOffset - Depth.buttonPressedOffset }],
  },
  pressedSelectedCard: {
    transform: [{ translateY: Depth.selectedCardOffset - Depth.buttonPressedOffset }],
  },
  pressedChip: {
    transform: [{ translateY: Depth.cardOffset - Depth.buttonPressedOffset }],
  },
});

const baseDepthStyles: Record<LedgeDepth, StyleProp<ViewStyle>> = {
  buttonSm: styles.baseButtonSm,
  buttonMd: styles.baseButtonMd,
  buttonLg: styles.baseButtonLg,
  card: styles.baseCard,
  selectedCard: styles.baseSelectedCard,
  chip: styles.baseChip,
  flat: styles.baseFlat,
};

const faceDepthStyles: Record<LedgeDepth, StyleProp<ViewStyle>> = {
  buttonSm: styles.faceButtonSm,
  buttonMd: styles.faceButtonMd,
  buttonLg: styles.faceButtonLg,
  card: styles.faceCard,
  selectedCard: styles.faceSelectedCard,
  chip: styles.faceChip,
  flat: styles.faceFlat,
};

const pressedFaceDepthStyles: Record<LedgeDepth, StyleProp<ViewStyle>> = {
  buttonSm: styles.pressedButtonSm,
  buttonMd: styles.pressedButtonMd,
  buttonLg: styles.pressedButtonLg,
  card: styles.pressedCard,
  selectedCard: styles.pressedSelectedCard,
  chip: styles.pressedChip,
  flat: undefined,
};
