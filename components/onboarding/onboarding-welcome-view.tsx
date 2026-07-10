import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { PetScreen } from '@/components/layout/pet-screen';
import { BuddyBird } from '@/components/mascot/buddy-bird';
import { PillButton } from '@/components/ui/pill-button';
import { SpeechBubble } from '@/components/ui/speech-bubble';
import { BuddyBirdColors, Spacing, Typography } from '@/constants/theme';

const CTA_MAX_WIDTH = 354;

interface OnboardingWelcomeViewProps {
  bubble: string;
  title: string;
  bodyBefore: string;
  bodyEmphasis: string;
  bodyAfter: string;
  ctaLabel: string;
  onStart: () => void;
}

export function OnboardingWelcomeView({
  bubble,
  title,
  bodyBefore,
  bodyEmphasis,
  bodyAfter,
  ctaLabel,
  onStart,
}: OnboardingWelcomeViewProps) {
  const { width } = useWindowDimensions();
  const ctaWidth = Math.max(0, Math.min(CTA_MAX_WIDTH, width - Spacing.screenXLg * 2));

  return (
    <PetScreen scroll={false} contentStyle={styles.screen}>
      <View style={styles.hero}>
        <SpeechBubble pointer="bottom-center" style={styles.bubble}>{bubble}</SpeechBubble>
        <BuddyBird animation="float" size={150} />
      </View>

      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.body}>
          {bodyBefore}
          <Text style={styles.bodyEmphasis}>{bodyEmphasis}</Text>
          {bodyAfter}
        </Text>
        <PillButton full label={ctaLabel} onPress={onStart} size="lg" style={{ width: ctaWidth }} />
      </View>

      <View style={styles.bottomSpacer} />
    </PetScreen>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: BuddyBirdColors.canvas,
    paddingHorizontal: 0,
    paddingTop: 60,
  },
  hero: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.xxxl,
  },
  bubble: {
    marginBottom: Spacing.xxxl,
    maxWidth: 300,
    width: '100%',
  },
  copy: {
    alignItems: 'center',
    alignSelf: 'stretch',
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.screenXLg,
  },
  title: {
    ...Typography.screenTitle,
    color: BuddyBirdColors.ink,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  body: {
    ...Typography.bodySmall,
    color: BuddyBirdColors.inkMuted,
    lineHeight: 22,
    marginBottom: Spacing.xl,
    textAlign: 'center',
  },
  bodyEmphasis: {
    color: BuddyBirdColors.ink,
    fontWeight: '900',
  },
  bottomSpacer: {
    height: Spacing.onboardingHeroGap,
  },
});
