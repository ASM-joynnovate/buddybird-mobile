import { StyleSheet, Text, View } from 'react-native';

import { IconSymbol, type IconSymbolName } from '@/components/ui/icon-symbol';
import { LedgeView } from '@/components/ui/ledge-surface';
import { BuddyBirdColors, Fonts, Radii } from '@/constants/theme';

type ProfileStatTone = 'streak' | 'primary' | 'secondary';

interface ProfileStatItem {
  icon: IconSymbolName;
  id: string;
  label: string;
  tone: ProfileStatTone;
  value: string;
}

interface ProfileStatsRowProps {
  streakDays: number;
  todayLearningLabel: string;
  totalLearningLabel: string;
}

export function ProfileStatsRow({
  streakDays,
  todayLearningLabel,
  totalLearningLabel,
}: ProfileStatsRowProps) {
  const items: ProfileStatItem[] = [
    { icon: 'flame.fill', id: 'streak', label: '연속일', tone: 'streak', value: `${streakDays}` },
    { icon: 'clock.fill', id: 'today', label: '오늘 학습시간', tone: 'primary', value: todayLearningLabel },
    { icon: 'clock.fill', id: 'total', label: '총 학습시간', tone: 'secondary', value: totalLearningLabel },
  ];

  return (
    <View style={styles.row}>
      {items.map((item) => (
        <ProfileStatCard key={item.id} item={item} />
      ))}
    </View>
  );
}

function ProfileStatCard({ item }: { item: ProfileStatItem }) {
  const toneStyle = toneStylesByTone[item.tone];

  return (
    <LedgeView baseStyle={styles.base} depth="card" faceStyle={styles.card} style={styles.cardRoot}>
      <IconSymbol color={toneStyle.color} name={item.icon} size={24} />
      <Text numberOfLines={1} adjustsFontSizeToFit style={styles.value}>
        {item.value}
      </Text>
      <Text numberOfLines={1} adjustsFontSizeToFit style={styles.label}>
        {item.label}
      </Text>
    </LedgeView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  cardRoot: {
    flex: 1,
  },
  base: {
    backgroundColor: BuddyBirdColors.border,
    borderRadius: Radii.sectionCard,
  },
  card: {
    alignItems: 'center',
    backgroundColor: BuddyBirdColors.surface,
    borderColor: BuddyBirdColors.border,
    borderRadius: Radii.sectionCard,
    borderWidth: 2,
    gap: 2,
    minHeight: 96,
    padding: 14,
  },
  value: {
    color: BuddyBirdColors.ink,
    fontFamily: Fonts.bodyBlack,
    fontSize: 19,
    fontWeight: '900',
    lineHeight: 24,
    maxWidth: '100%',
    textAlign: 'center',
  },
  label: {
    color: BuddyBirdColors.inkMuted,
    fontFamily: Fonts.bodyExtraBold,
    fontSize: 10,
    fontWeight: '800',
    lineHeight: 13,
    maxWidth: '100%',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
});

const toneStylesByTone: Record<ProfileStatTone, { color: string }> = {
  primary: { color: BuddyBirdColors.primary },
  secondary: { color: BuddyBirdColors.secondary },
  streak: { color: BuddyBirdColors.streak },
};
