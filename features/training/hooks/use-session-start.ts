import { AudioModule } from 'expo-audio';
import { router } from 'expo-router';
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
  }

  return { handleStart, startLabel };
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
