import { Link, router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { WaveformPlaceholder } from '@/components/audio/waveform-placeholder';
import { PetScreen } from '@/components/layout/pet-screen';
import { ParrotProfileCard } from '@/components/profile/parrot-profile-card';
import { Card } from '@/components/ui/card';
import { PillButton } from '@/components/ui/pill-button';
import { PetHubColors, Radii, Spacing, Typography } from '@/constants/theme';
import { useI18n } from '@/features/i18n/i18n-context';
import { getPresetWordTemplates, getSessionTemplates } from '@/features/i18n/training-templates';
import { useProfile } from '@/features/profile/profile-context';
import { useTrainingData } from '@/features/training/training-context';
import { selectTotalTrainingSeconds } from '@/features/training/training-model';

export default function HomeScreen() {
  const { locale, t } = useI18n();
  const { profile } = useProfile();
  const { store } = useTrainingData();
  const totalTrainingSeconds = store ? selectTotalTrainingSeconds(store) : 0;
  const presetWords = getPresetWordTemplates(locale);
  const sessionTemplates = getSessionTemplates(locale);

  if (!profile) {
    return null;
  }

  return (
    <PetScreen contentStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.kicker}>{t('home.kicker')}</Text>
        <Text style={styles.greeting}>{t('home.greeting', { name: profile.name })}</Text>
        <Text style={styles.body}>{t('home.body')}</Text>
      </View>

      <ParrotProfileCard profile={profile} />

      <Card raised style={styles.sessionCard}>
        <View style={styles.sessionHeader}>
          <Text style={styles.cardTitle}>{t('home.sessionTitle')}</Text>
          <Text style={styles.soonPill}>{t('home.phasePill')}</Text>
        </View>
        <WaveformPlaceholder />
        <Text style={styles.bodySmall}>{t('home.sessionBody')}</Text>
        <PillButton full label={t('home.startSessionCta')} onPress={() => router.push('/session-setup')} variant="teal" />
      </Card>

      <View style={styles.summaryGrid}>
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{formatTrainingSeconds(totalTrainingSeconds, t)}</Text>
          <Text style={styles.summaryLabel}>{t('home.totalTrainingTime')}</Text>
        </Card>
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{t('home.goalCount', { count: profile.trainingGoalIds.length })}</Text>
          <Text style={styles.summaryLabel}>{t('home.trainingGoals')}</Text>
        </Card>
      </View>

      <Card style={styles.templateCard}>
        <Text style={styles.noticeTitle}>{t('home.presetPreviewTitle')}</Text>
        <View style={styles.templateList}>
          {presetWords.slice(0, 3).map((word) => (
            <View key={word.id} style={styles.templateRow}>
              <Text style={styles.templateLabel}>{word.label}</Text>
              <Text style={styles.templateDescription}>{word.description}</Text>
            </View>
          ))}
        </View>
      </Card>

      <Card style={styles.templateCard}>
        <Text style={styles.noticeTitle}>{t('home.sessionTemplateTitle')}</Text>
        <View style={styles.templateList}>
          {sessionTemplates.slice(0, 2).map((session) => (
            <View key={session.id} style={styles.templateRow}>
              <Text style={styles.templateLabel}>{session.label}</Text>
              <Text style={styles.templateDescription}>{session.description}</Text>
            </View>
          ))}
        </View>
      </Card>

      <Card style={styles.noticeCard}>
        <Text style={styles.noticeTitle}>{t('home.singleProfileTitle')}</Text>
        <Text style={styles.bodySmall}>{t('home.singleProfileBody')}</Text>
        <Link href="./profile" style={styles.profileLink}>
          {t('home.profileLink')}
        </Link>
      </Card>
    </PetScreen>
  );
}

function formatTrainingSeconds(totalSeconds: number, t: ReturnType<typeof useI18n>['t']): string {
  if (totalSeconds < 3600) {
    return t('common.duration.minutes', { minutes: Math.floor(totalSeconds / 60) });
  }

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (minutes === 0) {
    return t('common.duration.hours', { hours });
  }

  return t('common.duration.hoursMinutes', { hours, minutes });
}

const styles = StyleSheet.create({
  content: {
    gap: Spacing.sectionY,
  },
  header: {
    gap: Spacing.sectionHeadGap,
  },
  kicker: {
    color: PetHubColors.secondaryDeep,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 4,
  },
  greeting: {
    ...Typography.homeGreeting,
    color: PetHubColors.primary,
  },
  body: {
    ...Typography.body,
    color: 'rgba(31,58,61,0.68)',
  },
  bodySmall: {
    ...Typography.bodySmall,
    color: 'rgba(31,58,61,0.64)',
  },
  sessionCard: {
    gap: Spacing.cardPaddingSm,
  },
  sessionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.cardPaddingSm,
    justifyContent: 'space-between',
  },
  cardTitle: {
    ...Typography.cardTitle,
    color: PetHubColors.primary,
  },
  soonPill: {
    backgroundColor: PetHubColors.feather,
    borderRadius: Radii.full,
    color: PetHubColors.primary,
    fontSize: 11,
    fontWeight: '700',
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: Spacing.sectionHeadGap,
  },
  summaryCard: {
    flex: 1,
    gap: 4,
  },
  summaryValue: {
    ...Typography.cardTitle,
    color: PetHubColors.primary,
  },
  summaryLabel: {
    ...Typography.caption,
    color: 'rgba(31,58,61,0.62)',
  },
  noticeCard: {
    backgroundColor: PetHubColors.surfaceWarm,
    gap: Spacing.tabPaddingY,
  },
  templateCard: {
    gap: Spacing.tabPaddingY,
  },
  templateList: {
    gap: Spacing.tabPaddingY,
  },
  templateRow: {
    backgroundColor: PetHubColors.feather,
    borderRadius: Radii.field,
    gap: 2,
    paddingHorizontal: Spacing.cardPaddingSm,
    paddingVertical: 10,
  },
  templateLabel: {
    ...Typography.bodySmall,
    color: PetHubColors.primary,
    fontWeight: '700',
  },
  templateDescription: {
    ...Typography.caption,
    color: 'rgba(31,58,61,0.62)',
  },
  noticeTitle: {
    ...Typography.body,
    color: PetHubColors.primary,
    fontWeight: '700',
  },
  profileLink: {
    color: PetHubColors.secondaryDeep,
    fontSize: 14,
    fontWeight: '700',
  },
});
