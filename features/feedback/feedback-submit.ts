import { getApp } from '@react-native-firebase/app';
import { addDoc, collection, getFirestore, serverTimestamp } from '@react-native-firebase/firestore';

import { ensureAnonymousUser, getCurrentUid } from '@/features/auth/auth-identity';

import type { FeedbackSubmission } from './feedback-types';

const FEEDBACK_COLLECTION = 'feedback';

/**
 * 피드백을 Firestore 에 create-only 로 기록한다. 앱 부팅 시 익명 로그인을 시도하지만, 첫 실행
 * 오프라인 등으로 uid가 아직 없을 수 있어 제출 직전에도 방어적으로 로그인을 보장한다.
 * Security Rules 가 인증 uid와 문서 userId의 일치를 요구하므로 uid 없이는 write 하지 않는다.
 *
 * 실패는 이 함수가 삼키지 않고 던진다 — 호출자(context)가 잡아 `reportError` 로 보고하고
 * 사용자에게 재시도를 안내한다.
 */
export async function submitFeedback(input: FeedbackSubmission): Promise<void> {
  const app = getApp();
  await ensureAnonymousUser();
  const userId = getCurrentUid();

  if (!userId) {
    throw new Error('Firebase anonymous user is unavailable');
  }

  await addDoc(collection(getFirestore(app), FEEDBACK_COLLECTION), {
    userId,
    message: input.message,
    appVersion: input.appVersion,
    platform: input.platform,
    locale: input.locale,
    createdAt: serverTimestamp(),
  });
}
