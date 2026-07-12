import { getApp } from '@react-native-firebase/app';
import { getAuth, signInAnonymously } from '@react-native-firebase/auth';
import { addDoc, collection, getFirestore, serverTimestamp } from '@react-native-firebase/firestore';

import type { FeedbackSubmission } from './feedback-types';

const FEEDBACK_COLLECTION = 'feedback';

/**
 * 피드백을 Firestore 에 create-only 로 기록한다. 제출 시점에만 익명 로그인(lazy)해 미제출
 * 사용자에게는 익명 계정을 만들지 않는다. Security Rules 가 `request.auth != null` 을 요구하므로
 * 로그인 없이는 write 가 거부된다.
 *
 * 실패는 이 함수가 삼키지 않고 던진다 — 호출자(context)가 잡아 `reportError` 로 보고하고
 * 사용자에게 재시도를 안내한다.
 */
export async function submitFeedback(input: FeedbackSubmission): Promise<void> {
  const app = getApp();
  const auth = getAuth(app);

  if (!auth.currentUser) {
    await signInAnonymously(auth);
  }

  await addDoc(collection(getFirestore(app), FEEDBACK_COLLECTION), {
    message: input.message,
    appVersion: input.appVersion,
    platform: input.platform,
    locale: input.locale,
    createdAt: serverTimestamp(),
  });
}
