import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { BuddyBirdColors, Depth, Radii, Spacing } from '@/constants/theme';

interface SpeechBubbleProps {
  children: React.ReactNode;
  // left/right: 아래변 꼬리 위치. side-left: 왼쪽 변에서 화자(왼쪽 아이콘)를 향하는 꼬리.
  pointer?: 'left' | 'right' | 'side-left';
  style?: StyleProp<ViewStyle>;
}

export function SpeechBubble({ children, pointer = 'left', style }: SpeechBubbleProps) {
  return (
    <View style={[styles.shadow, style]}>
      <View style={styles.bubble}>
        <Text style={styles.text}>{children}</Text>
        <View
          pointerEvents="none"
          style={[
            styles.pointer,
            pointer === 'side-left'
              ? styles.pointerSideLeft
              : [styles.pointerBottom, pointer === 'right' ? styles.pointerRight : styles.pointerLeft],
          ]}
        />
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
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 22,
    textAlign: 'left',
  },
  pointer: {
    backgroundColor: BuddyBirdColors.canvas,
    height: 16,
    position: 'absolute',
    transform: [{ rotate: '45deg' }],
    width: 16,
  },
  pointerBottom: {
    borderBottomColor: BuddyBirdColors.border,
    borderBottomWidth: 2,
    borderRightColor: BuddyBirdColors.border,
    borderRightWidth: 2,
    bottom: -10,
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
