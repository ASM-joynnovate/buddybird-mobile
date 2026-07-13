import { getApp } from '@react-native-firebase/app';
import { getAuth, onAuthStateChanged, signInAnonymously } from '@react-native-firebase/auth';

let signInPromise: Promise<void> | null = null;

/** 익명 로그인 요청을 single-flight로 합쳐 중복 uid 발급을 막는다. */
export function ensureAnonymousUser(): Promise<void> {
  const auth = getAuth(getApp());

  if (auth.currentUser) {
    return Promise.resolve();
  }

  if (signInPromise) {
    return signInPromise;
  }

  signInPromise = signInAnonymously(auth)
    .then(() => undefined)
    .finally(() => {
      signInPromise = null;
    });

  return signInPromise;
}

/** Firebase Auth의 사용자 상태를 앱의 uid 표현으로 좁혀 구독한다. */
export function subscribeToUid(callback: (uid: string | null) => void): () => void {
  return onAuthStateChanged(getAuth(getApp()), (user) => callback(user?.uid ?? null));
}

/** 네이티브 저장소에서 현재 복원된 uid를 동기적으로 읽는다. */
export function getCurrentUid(): string | null {
  return getAuth(getApp()).currentUser?.uid ?? null;
}
