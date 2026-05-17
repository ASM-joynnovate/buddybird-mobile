import { router } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { PetScreen } from '@/components/layout/pet-screen';
import { TrainingGoalCard } from '@/components/profile/training-goal-card';
import { PillButton } from '@/components/ui/pill-button';
import { PetHubColors, Spacing, Typography } from '@/constants/theme';
import { useAnalytics } from '@/features/analytics/analytics-context';
import { useScreenTracking } from '@/features/analytics/hooks/use-screen-tracking';
import { useI18n } from '@/features/i18n/i18n-context';
import { useOnboardingDraft } from '@/features/profile/onboarding-draft-context';
import { useProfile } from '@/features/profile/profile-context';
import { DEFAULT_GOAL_IDS, getTrainingGoals } from '@/features/profile/profile-options';
import type { ProfileDraft, TrainingGoalId } from '@/features/profile/profile-types';
import { createProfileFromDraft, validateProfileDraft } from '@/features/profile/profile-validation';

export default function OnboardingGoalsScreen() {
  const { locale, t } = useI18n();
  const { track, recordError } = useAnalytics();
  const onboardingStartedAtRef = useRef(Date.now());
  const { elapsedMs } = useScreenTracking('onboarding_goals');
  const trainingGoals = useMemo(() => getTrainingGoals(locale), [locale]);
  const { draft, setDraft } = useOnboardingDraft();
  const { saveProfile } = useProfile();
  const [selectedGoalIds, setSelectedGoalIds] = useState<TrainingGoalId[]>(
    draft.trainingGoalIds?.length ? draft.trainingGoalIds : [...DEFAULT_GOAL_IDS]
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const completedDraft = useMemo<ProfileDraft | null>(() => {
    if (!draft.name || !draft.species || !draft.ageMonths) {
      return null;
    }

    return {
      ageMonths: draft.ageMonths,
      name: draft.name,
      photoUri: draft.photoUri,
      species: draft.species,
      trainingGoalIds: selectedGoalIds,
    };
  }, [draft.ageMonths, draft.name, draft.photoUri, draft.species, selectedGoalIds]);

  function toggleGoal(goalId: TrainingGoalId): void {
    setSelectedGoalIds((currentGoalIds) =>
      currentGoalIds.includes(goalId)
        ? currentGoalIds.filter((currentGoalId) => currentGoalId !== goalId)
        : [...currentGoalIds, goalId]
    );
    setErrorMessage(null);
  }

  async function completeOnboarding(): Promise<void> {
    if (!completedDraft) {
      router.replace('./profile');
      return;
    }

    const validation = validateProfileDraft(completedDraft, t);

    if (!validation.isValid) {
      setErrorMessage(validation.errors.trainingGoalIds ?? t('onboarding.goals.fallbackError'));
      return;
    }

    setIsSaving(true);
    const nowIso = new Date().toISOString();
    const profile = createProfileFromDraft(completedDraft, nowIso);

    try {
      await saveProfile(profile);
      setDraft({ trainingGoalIds: selectedGoalIds });

      const goalsStepDuration = elapsedMs();
      const totalDuration = Date.now() - onboardingStartedAtRef.current;

      track({
        name: 'onboarding_step_completed',
        params: { step: 'goals', duration_ms: goalsStepDuration },
      });
      track({
        name: 'profile_created',
        params: {
          parrot_name: profile.name,
          parrot_species: profile.species,
          parrot_age_months: profile.ageMonths,
          goals_count: profile.trainingGoalIds.length,
        },
      });
      track({
        name: 'onboarding_completed',
        params: { total_duration_ms: totalDuration },
      });
    } catch (error: unknown) {
      const wrapped = error instanceof Error ? error : new Error('Profile save failed');
      await recordError(wrapped, { screen_name: 'onboarding_goals' });
      setErrorMessage(t('onboarding.goals.saveError'));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <PetScreen contentStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.kicker}>{t('onboarding.goals.kicker')}</Text>
        <Text style={styles.title}>{t('onboarding.goals.title')}</Text>
        <Text style={styles.body}>{t('onboarding.goals.body')}</Text>
      </View>

      <View style={styles.goalList}>
        {trainingGoals.map((goal) => (
          <TrainingGoalCard
            key={goal.id}
            goal={goal}
            onPress={() => toggleGoal(goal.id)}
            selected={selectedGoalIds.includes(goal.id)}
          />
        ))}
      </View>

      {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

      <PillButton
        disabled={selectedGoalIds.length === 0 || isSaving}
        full
        label={isSaving ? t('common.saving') : t('onboarding.goals.cta', { count: selectedGoalIds.length })}
        onPress={completeOnboarding}
        size="lg"
      />
    </PetScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: Spacing.sectionY,
    paddingBottom: Spacing.onboardingBottom,
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
  title: {
    ...Typography.screenTitle,
    color: PetHubColors.primary,
  },
  body: {
    ...Typography.body,
    color: PetHubColors.bodyMuted,
  },
  goalList: {
    gap: Spacing.sectionHeadGap,
  },
  error: {
    ...Typography.bodySmall,
    color: PetHubColors.accentCoral,
    fontWeight: '700',
  },
});
