import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { WaveformBars } from '@/components/ui/waveform-bars';
import { PetHubColors, Radii, Spacing, Typography } from '@/constants/theme';
import { useProfile } from '@/features/profile/profile-context';
import { useTrainingData } from '@/features/training/training-context';
import { selectTotalTrainingSeconds } from '@/features/training/training-model';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const LAST_SESSION = { words: ['사과', '안녕', '망고야'], cycles: 20, mins: 30 };
const WORDS_COUNT = 8;

const SPECIES_KO: Record<string, string> = {
  'african-grey': '회색앵무',
  cockatoo: '코카투',
  budgie: '사랑앵무',
  parakeet: '잉꼬',
  lovebird: '모란앵무',
  conure: '코뉴어',
};

function speciesLabel(species: string, custom?: string): string {
  if (species === 'custom') return custom ?? '기타';
  return SPECIES_KO[species] ?? species;
}

function formatAge(months: number): string {
  const y = Math.floor(months / 12);
  const m = months % 12;
  if (y === 0) return `${m}개월`;
  if (m === 0) return `${y}년`;
  return `${y}년 ${m}개월`;
}

function getDateKicker(): string {
  const now = new Date();
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const day = days[now.getDay()];
  const h = now.getHours();
  const m = String(now.getMinutes()).padStart(2, '0');
  const period = h < 12 ? '오전' : '오후';
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${day} · ${period} ${h12}:${m}`;
}

function formatMinutes(seconds: number): { value: string; unit: string } {
  if (seconds < 3600) return { value: String(Math.floor(seconds / 60)), unit: '분' };
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (mins === 0) return { value: String(hours), unit: '시간' };
  return { value: `${hours}h ${mins}`, unit: '분' };
}

export default function HomeScreen() {
  const { profile } = useProfile();
  const { store } = useTrainingData();
  const insets = useSafeAreaInsets();
  const totalTrainingSeconds = store ? selectTotalTrainingSeconds(store) : 0;

  if (!profile) return null;

  const stat = formatMinutes(totalTrainingSeconds);
  const species = speciesLabel(profile.species, profile.customSpecies);
  const age = formatAge(profile.ageMonths);

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 14, paddingBottom: Spacing.screenBottomTabs }]}
      showsVerticalScrollIndicator={false}
    >
      {/* greeting */}
      <View style={styles.greetingRow}>
        <View style={styles.greetingText}>
          <Text style={styles.kicker}>{getDateKicker()}</Text>
          <Text style={styles.greeting}>안녕하세요,{'\n'}{profile.name}와 함께</Text>
        </View>
        <View style={styles.bellBtn}>
          <IconSymbol name="bell.fill" size={18} color={'rgba(31,58,61,0.5)'} />
        </View>
      </View>

      {/* parrot card */}
      <View style={styles.parrotCard}>
        <View style={styles.parrotRow}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarEmoji}>{profile.photoUri ? '' : '🦜'}</Text>
          </View>
          <View style={styles.parrotInfo}>
            <Text style={styles.parrotName}>{profile.name}</Text>
            <Text style={styles.parrotMeta}>{species} · {age}</Text>
          </View>
        </View>
      </View>

      {/* 이어서 학습하기 */}
      <View>
        <View style={styles.sectionHeadRow}>
          <Text style={styles.sectionKicker}>마지막 세션</Text>
          <Text style={styles.sectionTitle}>이어서 학습하기</Text>
        </View>
        <View style={styles.continueCard}>
          <View style={styles.continueInner}>
            <View style={styles.chipRow}>
              {LAST_SESSION.words.map((w) => (
                <View key={w} style={styles.wordChip}>
                  <Text style={styles.wordChipText}>{w}</Text>
                </View>
              ))}
              <View style={styles.moreChip}>
                <Text style={styles.moreChipText}>{WORDS_COUNT - LAST_SESSION.words.length}개 더</Text>
              </View>
            </View>
            <WaveformBars color="#7DD3C0" height={36} barCount={44} />
            <Text style={styles.sessionMeta}>
              {LAST_SESSION.cycles} 사이클 · {LAST_SESSION.mins}분 · 60초 학습 + 30초 휴식
            </Text>
          </View>
          <Pressable style={styles.continueBtn} onPress={() => router.push('/session-setup')}>
            <Text style={styles.continueBtnText}>▶ 이어서 학습하기</Text>
          </Pressable>
        </View>
      </View>

      {/* 단어 섹션 */}
      <View style={styles.wordsSectionRow}>
        <View>
          <Text style={styles.sectionKicker}>현재 학습 중</Text>
          <Text style={styles.sectionTitle}>단어 {WORDS_COUNT}개</Text>
        </View>
        <Pressable onPress={() => router.push('/words')}>
          <Text style={styles.sectionAction}>관리</Text>
        </Pressable>
      </View>

      {/* 통계 그리드 */}
      <View style={styles.statsGrid}>
        <StatCard value={stat.value} unit={stat.unit} label="오늘 학습 시간" tone={PetHubColors.tertiaryDeep} />
        <StatCard value={stat.value} unit={stat.unit} label="이번 주 학습 시간" tone={PetHubColors.secondaryDeep} />
      </View>
      <View style={styles.lockedGridWrapper}>
        <View style={[styles.statsGrid, styles.lockedStats]}>
          <StatCard value="123" unit="회" label="망고의 반응" tone={PetHubColors.secondaryDeep} />
          <StatCard value="92" unit="%" label="단어 따라하기 정확도" tone={PetHubColors.tertiaryDeep} />
        </View>
        <View style={styles.lockedOverlay}>
          <View style={styles.lockedBadge}>
            <Text style={styles.lockedBadgeText}>서비스 준비 중</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

function StatCard({ value, unit, label, tone }: { value: string; unit: string; label: string; tone: string }) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statValueRow}>
        <Text style={[styles.statValue, { color: tone }]}>{value}</Text>
        <Text style={[styles.statUnit, { color: tone }]}>{unit}</Text>
      </View>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    backgroundColor: PetHubColors.neutral,
    flex: 1,
  },
  content: {
    gap: Spacing.sectionY,
    paddingHorizontal: Spacing.screenX,
  },
  greetingRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  greetingText: {
    flex: 1,
    gap: 6,
  },
  kicker: {
    color: 'rgba(31,58,61,0.55)',
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.6,
  },
  greeting: {
    ...Typography.homeGreeting,
    color: PetHubColors.primary,
  },
  bellBtn: {
    alignItems: 'center',
    backgroundColor: 'rgba(31,58,61,0.06)',
    borderRadius: Radii.full,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  bellIcon: {
    fontSize: 18,
  },
  parrotCard: {
    backgroundColor: PetHubColors.secondary,
    borderRadius: Radii.heroCard,
    overflow: 'hidden',
    padding: 18,
    shadowColor: 'rgba(42,157,143,1)',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 30,
  },
  parrotRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 14,
  },
  avatarCircle: {
    alignItems: 'center',
    backgroundColor: PetHubColors.feather,
    borderColor: 'rgba(255,255,255,0.4)',
    borderRadius: Radii.full,
    borderWidth: 3,
    height: 64,
    justifyContent: 'center',
    width: 64,
  },
  avatarEmoji: {
    fontSize: 30,
  },
  parrotInfo: {
    flex: 1,
    gap: 2,
  },
  parrotName: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  parrotMeta: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
  },
  sectionHeadRow: {
    gap: 4,
    marginBottom: 10,
  },
  sectionKicker: {
    color: 'rgba(31,58,61,0.55)',
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.6,
  },
  sectionTitle: {
    ...Typography.screenTitle,
    color: PetHubColors.primary,
    fontSize: 22,
  },
  continueCard: {
    backgroundColor: PetHubColors.primary,
    borderRadius: Radii.card,
    overflow: 'hidden',
    shadowColor: 'rgba(31,58,61,1)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
  },
  continueInner: {
    gap: 12,
    padding: 18,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  wordChip: {
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: Radii.full,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  wordChipText: {
    color: PetHubColors.neutral,
    fontSize: 13,
    fontWeight: '600',
  },
  moreChip: {
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: Radii.full,
    borderWidth: 0.5,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  moreChipText: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 13,
  },
  sessionMeta: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 0.4,
  },
  continueBtn: {
    alignItems: 'center',
    backgroundColor: PetHubColors.secondary,
    height: 52,
    justifyContent: 'center',
  },
  continueBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  wordsSectionRow: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sectionAction: {
    color: PetHubColors.secondaryDeep,
    fontSize: 13,
    fontWeight: '700',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(31,58,61,0.06)',
    borderRadius: Radii.sectionCard,
    borderWidth: 0.5,
    flex: 1,
    gap: 6,
    padding: 14,
  },
  statValueRow: {
    alignItems: 'baseline',
    flexDirection: 'row',
    gap: 3,
  },
  statValue: {
    fontSize: 26,
    fontWeight: '700',
    lineHeight: 26,
  },
  statUnit: {
    fontSize: 12,
    fontWeight: '600',
  },
  statLabel: {
    color: 'rgba(31,58,61,0.6)',
    fontSize: 11,
    lineHeight: 14,
  },
  lockedGridWrapper: {
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
