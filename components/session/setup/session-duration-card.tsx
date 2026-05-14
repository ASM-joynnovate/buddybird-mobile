import { StyleSheet, Text } from 'react-native';

import { Card } from '@/components/ui/card';
import { PetHubColors, Spacing } from '@/constants/theme';
import { STEP_LEARN_SECS, STEP_REST_SECS, STEP_SESSION_MINS } from '@/features/training/session-config';

import { SliderField } from './slider-field';

interface SessionDurationCardProps {
  sessionMins: number;
  learnSecs: number;
  restSecs: number;
  onChangeSessionMins: (v: number) => void;
  onChangeLearnSecs: (v: number) => void;
  onChangeRestSecs: (v: number) => void;
}

export function SessionDurationCard({
  sessionMins,
  learnSecs,
  restSecs,
  onChangeSessionMins,
  onChangeLearnSecs,
  onChangeRestSecs,
}: SessionDurationCardProps) {
  return (
    <Card style={styles.card}>
      <SliderField
        label="총 세션 시간"
        value={`${sessionMins}분`}
        min={5}
        max={60}
        step={STEP_SESSION_MINS}
        current={sessionMins}
        color={PetHubColors.primary}
        onChange={(v) => onChangeSessionMins(Math.round(v / STEP_SESSION_MINS) * STEP_SESSION_MINS)}
      />
      <SliderField
        label="학습 시간"
        value={`${learnSecs}초`}
        min={20}
        max={120}
        step={STEP_LEARN_SECS}
        current={learnSecs}
        color={PetHubColors.secondary}
        onChange={(v) => onChangeLearnSecs(Math.round(v / STEP_LEARN_SECS) * STEP_LEARN_SECS)}
      />
      <SliderField
        label="휴식 시간"
        value={`${restSecs}초`}
        min={10}
        max={60}
        step={STEP_REST_SECS}
        current={restSecs}
        color={PetHubColors.accentCoral}
        onChange={(v) => onChangeRestSecs(Math.round(v / STEP_REST_SECS) * STEP_REST_SECS)}
      />
      <Text style={styles.cycleMono}>
        1사이클 = {learnSecs}초 학습 + {restSecs}초 휴식 ({learnSecs + restSecs}초)
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.sectionHeadGap,
  },
  cycleMono: {
    color: 'rgba(31,58,61,0.45)',
    fontSize: 10,
    letterSpacing: 0.3,
    textAlign: 'center',
  },
});
