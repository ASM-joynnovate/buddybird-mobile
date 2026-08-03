import { AudioModule } from 'expo-audio';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Alert, Linking, PermissionsAndroid, Platform } from 'react-native';

import { useAnalytics } from '@/features/analytics/analytics-context';
import { reportError } from '@/features/analytics/error-reporter';
import { useI18n } from '@/features/i18n/i18n-context';
import { useProfile } from '@/features/profile/profile-context';
import { diffDaysIso } from '@/features/shared/date-utils';
import { createSessionId } from '@/features/shared/ids';
import type { UseSessionSetupResult } from '@/features/training/hooks/use-learning-setup';
import { useTrainingData } from '@/features/training/training-context';
import type { WordEntry } from '@/features/word-library/word-library-types';

interface SessionStartParams {
  selectedEntry: WordEntry | undefined;
  setup: Pick<UseSessionSetupResult, 'saveSessionSetup' | 'sessionMins'>;
}

export function useSessionStart({ selectedEntry, setup }: SessionStartParams) {
  const { t } = useI18n();
  const { setPendingSession } = useTrainingData();
  const { track } = useAnalytics();
  const { profile } = useProfile();

  const startLabel = t('home.startTrainingCta');
  // 권한 프롬프트와 저장이 끝날 때까지 버튼이 계속 눌리는 상태라, 그 사이에 버튼을 다시
  // 누르면 두 번째 세션이 만들어지고 네이티브가 그 start 를 sessionAlreadyRunning 으로
  // 거부했다 (BB-300). 두 겹으로 막는다.
  // ref: 같은 tick 의 연속 탭까지 즉시 차단한다. setState 는 다음 렌더에 반영돼 놓친다.
  // state: 버튼을 비활성으로 그려 두 번째 탭이 아예 들어오지 않게 한다.
  const startingRef = useRef(false);
  const [isStarting, setIsStarting] = useState(false);

  // 성공 경로에서는 가드를 바로 풀지 않는다 — router.push 가 반환된 뒤에도 전환 애니메이션
  // 동안 setup 화면이 탭을 받으므로, finally 에서 풀면 그 틈의 재탭이 두 번째 세션을 만들어
  // 네이티브 거부(sessionAlreadyRunning)를 다시 일으킨다 (BB-300). 세션 화면에서 이
  // 화면으로 복귀(focus)할 때 푼다.
  useFocusEffect(
    useCallback(() => {
      startingRef.current = false;
      setIsStarting(false);
    }, []),
  );

  // 마이크 권한은 네이티브 세션 시작(validateFiles)의 필수 조건이라 차단형으로 확보한다.
  // 미결정 상태면 시스템 프롬프트가 뜨고, 거부 상태(iOS는 최초 거부 후 재프롬프트 불가)면
  // 설정으로 안내한다 — 세션 화면에 들어가 실패로 알게 하는 대신 시작 시점에 막는다.
  async function ensureMicPermission(): Promise<boolean> {
    let granted = false;
    try {
      granted = (await AudioModule.requestRecordingPermissionsAsync()).granted;
    } catch (error: unknown) {
      reportError(error, { scope: 'training.sessionMicPermission' });
      return false;
    }
    if (granted) return true;
    Alert.alert(t('sessionSetup.micPermissionTitle'), t('sessionSetup.micPermissionBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('sessionSetup.micPermissionOpenSettings'), onPress: () => { void Linking.openSettings(); } },
    ]);
    return false;
  }

  async function handleStart(): Promise<void> {
    if (!selectedEntry) return;
    if (startingRef.current) return;
    startingRef.current = true;
    setIsStarting(true);
    let navigated = false;
    try {
      if (!(await ensureMicPermission())) return;
      await requestSessionNotificationPermission();
      const result = await setup.saveSessionSetup({
        audioUri: selectedEntry.audioUri,
        label: selectedEntry.label,
        presetKey: selectedEntry.presetKey,
        sourceType: selectedEntry.sourceType,
        libraryEntryId: selectedEntry.id,
      });
      if (!result) return;

      const sessionId = createSessionId();
      setPendingSession({
        sessionId,
        wordId: result.wordId,
        settings: result.settings,
        audioUri: result.audioUri,
        word: result.word,
      });
      track({
        name: 'training_session_started',
        params: {
          session_id: sessionId,
          word_count: 1,
          target_word_ids: [result.wordId],
          target_word_names: [result.word],
          profile_age_days: profile ? diffDaysIso(profile.createdAt) : 0,
          parrot_species: profile?.species ?? '',
          parrot_name: profile?.name ?? '',
        },
      });
      router.push('/session-active');
      navigated = true;
    } finally {
      if (!navigated) {
        startingRef.current = false;
        setIsStarting(false);
      }
    }
  }

  return { handleStart, isStarting, startLabel };
}

async function requestSessionNotificationPermission(): Promise<void> {
  if (Platform.OS !== 'android' || Platform.Version < 33) return;
  try {
    await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
  } catch (error: unknown) {
    // 알림 권한 거부·요청 실패는 foreground service 시작을 막지 않는다. Task Manager에는 계속 표시된다.
    reportError(error, { scope: 'training.sessionNotificationPermission' });
  }
}
