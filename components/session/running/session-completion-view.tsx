import { useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui/app-text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BuddyBird } from '@/components/mascot/buddy-bird';
import { Card } from '@/components/ui/card';
import { IconSymbol, type IconSymbolName } from '@/components/ui/icon-symbol';
import { PillButton } from '@/components/ui/pill-button';
import { BuddyBirdColors, Fonts, Radii, Spacing } from '@/constants/theme';
import { formatDurationCompact, formatDurationMins } from '@/features/shared/duration-format';

import { SessionConfetti } from './session-confetti';

interface SessionCompletionViewProps {
  petName: string;
  word: string;
  totalLearningSeconds: number;
  totalTrainingSeconds: number;
  streakDays: number;
  onDismiss: () => void;
  // 숨은 개발자 진입: 마스코트를 5회 연타(3초 내)하면 호출. 미지정 시 마스코트는 그냥 장식.
  onDebugAccess?: () => void;
}

const DEBUG_TAP_COUNT = 5;
const DEBUG_TAP_WINDOW_MS = 3000;

export function SessionCompletionView({ petName, word, totalLearningSeconds, totalTrainingSeconds, streakDays, onDismiss, onDebugAccess }: SessionCompletionViewProps) {
  const insets = useSafeAreaInsets();
  const totalLearningMinutesLabel = formatDurationMins(Math.max(1, Math.round(totalLearningSeconds / 60)));
  const tapStateRef = useRef<{ count: number; timer: ReturnType<typeof setTimeout> | null }>({ count: 0, timer: null });

  const handleSecretTap = (): void => {
    if (!onDebugAccess) return;
    const state = tapStateRef.current;
    if (state.timer) clearTimeout(state.timer);
    state.count += 1;
    if (state.count >= DEBUG_TAP_COUNT) {
      state.count = 0;
      onDebugAccess();
      return;
    }
    state.timer = setTimeout(() => {
      state.count = 0;
    }, DEBUG_TAP_WINDOW_MS);
  };

  return (
    <View style={styles.container}>
      <SessionConfetti />
      <View style={styles.celebration}>
        <Pressable accessibilityRole="none" onPress={handleSecretTap}>
          <BuddyBird size={140} animation="bounce" />
        </Pressable>
        <Text style={styles.title}>학습 완료! 🎉</Text>
        <Text style={styles.subtitle}>
          {withSubjectParticle(petName)} &quot;{word}&quot;를 {totalLearningMinutesLabel} 동안 들었어요
        </Text>
      </View>
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.rewardRow}>
          <RewardCard
            borderColor={BuddyBirdColors.streak}
            icon="flame.fill"
            iconColor={BuddyBirdColors.streak}
            label="연속"
            labelColor={BuddyBirdColors.primaryShadow}
            value={`${streakDays}`}
          />
          <RewardCard
            borderColor={BuddyBirdColors.accentYellow}
            icon="clock.fill"
            iconColor={BuddyBirdColors.accentYellow}
            label="총 학습 시간"
            labelColor={BuddyBirdColors.accentYellowShadow}
            value={formatDurationCompact(totalTrainingSeconds)}
          />
        </View>
        <PillButton full label="계속" onPress={onDismiss} size="lg" />
      </View>
    </View>
  );
}

function RewardCard({
  borderColor,
  icon,
  iconColor,
  label,
  labelColor,
  value,
}: {
  borderColor: string;
  icon: IconSymbolName;
  iconColor: string;
  label: string;
  labelColor: string;
  value: string;
}) {
  return (
    <View style={styles.rewardCardShell}>
      <Card accentColor={borderColor} style={styles.rewardCard}>
        <Text style={[styles.rewardLabel, { color: labelColor }]}>{label}</Text>
        <View style={styles.rewardValueRow}>
          <IconSymbol name={icon} color={iconColor} size={22} />
          <Text style={styles.rewardValue}>{value}</Text>
        </View>
      </Card>
    </View>
  );
}

function withSubjectParticle(name: string): string {
  const lastCharCode = name.charCodeAt(name.length - 1);
  const hasFinalConsonant = lastCharCode >= 0xac00 && lastCharCode <= 0xd7a3 && (lastCharCode - 0xac00) % 28 !== 0;

  return `${name}${hasFinalConsonant ? '이' : '가'}`;
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: BuddyBirdColors.primary,
    flex: 1,
    position: 'relative',
  },
  celebration: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.screenX,
    zIndex: 2,
  },
  title: {
    color: BuddyBirdColors.onDark,
    fontFamily: Fonts.bodyBlack,
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: 0,
    lineHeight: 40,
    marginTop: 24,
    textAlign: 'center',
  },
  subtitle: {
    color: BuddyBirdColors.onPrimary,
    fontFamily: Fonts.bodyExtraBold,
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 23,
    letterSpacing: 0,
    marginTop: 6,
    opacity: 0.92,
    textAlign: 'center',
  },
  sheet: {
    backgroundColor: BuddyBirdColors.surface,
    borderTopLeftRadius: Radii.celebration,
    borderTopRightRadius: Radii.celebration,
    paddingHorizontal: Spacing.screenX,
    paddingTop: 22,
    zIndex: 2,
  },
  rewardRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: 18,
  },
  rewardCardShell: {
    flex: 1,
  },
  rewardCard: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 102,
    padding: 14,
  },
  rewardLabel: {
    fontFamily: Fonts.bodyExtraBold,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.48,
    textTransform: 'uppercase',
  },
  rewardValueRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.xxs,
    justifyContent: 'center',
    marginTop: Spacing.xxs,
  },
  rewardValue: {
    color: BuddyBirdColors.ink,
    fontFamily: Fonts.bodyBlack,
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 0,
  },
});
