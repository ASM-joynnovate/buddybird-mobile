import { StyleSheet, Text, View } from 'react-native';

import { Pressable3D } from '@/components/ui/ledge-surface';
import { BuddyBirdColors, Fonts, Radii, Spacing } from '@/constants/theme';

import { SessionProgressBar } from './session-progress-bar';

interface SessionHeaderProps {
  progress: number;
  isLearning: boolean;
  onStop: () => void;
}

export function SessionHeader({ progress, isLearning, onStop }: SessionHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.progress}>
        <SessionProgressBar progress={progress} isLearning={isLearning} />
      </View>
      <Pressable3D
        accessibilityRole="button"
        accessibilityLabel="세션 종료"
        baseStyle={styles.stopBase}
        depth="card"
        faceStyle={styles.stopFace}
        hitSlop={4}
        onPress={onStop}>
        <Text style={styles.stopBtnText}>종료</Text>
      </Pressable3D>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.md,
    paddingHorizontal: Spacing.screenX,
    paddingTop: 16,
  },
  progress: {
    flex: 1,
  },
  stopBase: {
    backgroundColor: BuddyBirdColors.borderMuted,
    borderRadius: Radii.iconSquare,
  },
  stopFace: {
    alignItems: 'center',
    backgroundColor: BuddyBirdColors.surface,
    borderColor: BuddyBirdColors.borderMuted,
    borderRadius: Radii.iconSquare,
    borderWidth: 2,
    height: 40,
    justifyContent: 'center',
    paddingHorizontal: Spacing.cardPaddingSm,
  },
  stopBtnText: {
    color: BuddyBirdColors.ink,
    fontFamily: Fonts.bodyExtraBold,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0,
  },
});
