import { StyleSheet, Text, View } from 'react-native';

import { PetHubColors, Radii } from '@/constants/theme';

import { StatCard } from './stat-card';

interface HomeStatsGridProps {
  todayStatValue: string;
  todayStatUnit: string;
  weekStatValue: string;
  weekStatUnit: string;
}

export function HomeStatsGrid({ todayStatValue, todayStatUnit, weekStatValue, weekStatUnit }: HomeStatsGridProps) {
  return (
    <>
      <View style={styles.grid}>
        <StatCard value={todayStatValue} unit={todayStatUnit} label="오늘 학습 시간" tone={PetHubColors.tertiaryDeep} />
        <StatCard value={weekStatValue} unit={weekStatUnit} label="이번 주 학습 시간" tone={PetHubColors.secondaryDeep} />
      </View>
      <View style={styles.lockedWrapper}>
        <View style={[styles.grid, styles.lockedStats]}>
          <StatCard value="123" unit="회" label="망고의 반응" tone={PetHubColors.secondaryDeep} />
          <StatCard value="92" unit="%" label="단어 따라하기 정확도" tone={PetHubColors.tertiaryDeep} />
        </View>
        <View style={styles.lockedOverlay}>
          <View style={styles.lockedBadge}>
            <Text style={styles.lockedBadgeText}>서비스 준비 중</Text>
          </View>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    gap: 10,
  },
  lockedWrapper: {
    position: 'relative',
  },
  lockedStats: {
    opacity: 0.4,
  },
  lockedOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockedBadge: {
    backgroundColor: PetHubColors.primary,
    borderRadius: Radii.full,
    paddingHorizontal: 14,
    paddingVertical: 7,
    shadowColor: 'rgba(31,58,61,1)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
  },
  lockedBadgeText: {
    color: PetHubColors.neutral,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
});
