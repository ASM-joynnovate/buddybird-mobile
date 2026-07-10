import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { BuddyBirdColors, Depth, Fonts, Radii, Spacing } from '@/constants/theme';

interface SpeechBubbleProps {
  children: React.ReactNode;
  // left/right: 아래변 꼬리 위치. side-left: 왼쪽 변에서 화자(왼쪽 아이콘)를 향하는 꼬리.
  // bottom-center: 아래변 가운데에서 아래쪽 화자(바로 밑 마스코트)를 향하는 꼬리.
  pointer?: 'left' | 'right' | 'side-left' | 'bottom-center';
  style?: StyleProp<ViewStyle>;
}

export function SpeechBubble({ children, pointer = 'left', style }: SpeechBubbleProps) {
  return (
    <View style={[styles.shadow, style]}>
      <View style={styles.bubble}>
        <Text style={styles.text}>{children}</Text>
        {pointer === 'bottom-center' ? (
          // 퍼센트 offset 대신 전체 폭 row 의 alignItems 로 가운데를 보장한다.
          <View pointerEvents="none" style={styles.pointerCenterRow}>
            <View style={[styles.pointer, styles.pointerBottomEdges]} />
          </View>
        ) : (
          <View
            pointerEvents="none"
            style={[
              styles.pointer,
              styles.pointerAbsolute,
              pointer === 'side-left'
                ? styles.pointerSideLeft
                : [styles.pointerBottomEdges, styles.pointerBottom, pointer === 'right' ? styles.pointerRight : styles.pointerLeft],
            ]}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: {
    backgroundColor: BuddyBirdColors.border,
    borderRadius: Radii.lg,
    paddingBottom: Depth.card,
  },
  bubble: {
    backgroundColor: BuddyBirdColors.canvas,
    borderColor: BuddyBirdColors.border,
    borderRadius: Radii.lg,
    borderWidth: 2,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.cardPaddingSm,
    position: 'relative',
  },
  text: {
    color: BuddyBirdColors.ink,
    fontFamily: Fonts.bodyExtraBold,
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 22,
    textAlign: 'left',
  },
  pointer: {
    backgroundColor: BuddyBirdColors.canvas,
    height: 16,
    transform: [{ rotate: '45deg' }],
    width: 16,
  },
  pointerAbsolute: {
    position: 'absolute',
  },
  // 45deg 회전 시 아래로 튀어나오는 꼭짓점에 맞닿은 두 변(bottom·right)만 테두리를 그린다.
  pointerBottomEdges: {
    borderBottomColor: BuddyBirdColors.border,
    borderBottomWidth: 2,
    borderRightColor: BuddyBirdColors.border,
    borderRightWidth: 2,
  },
  pointerBottom: {
    bottom: -10,
  },
  pointerCenterRow: {
    alignItems: 'center',
    bottom: -10,
    left: 0,
    position: 'absolute',
    right: 0,
  },
  pointerLeft: {
    left: Spacing.xxl,
  },
  pointerRight: {
    right: Spacing.xxl,
  },
  pointerSideLeft: {
    borderBottomColor: BuddyBirdColors.border,
    borderBottomWidth: 2,
    borderLeftColor: BuddyBirdColors.border,
    borderLeftWidth: 2,
    bottom: 18,
    left: -10,
  },
});
