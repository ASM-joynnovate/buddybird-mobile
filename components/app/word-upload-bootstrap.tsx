import { useEffect } from 'react';
import { Platform } from 'react-native';

import { getCurrentUid, subscribeToUid } from '@/features/auth/auth-identity';
import { requestWordUploadFlush } from '@/features/word-library/word-upload';

/**
 * 단어 업로드 트리거 ②(앱 콜드 스타트) 배선 (SPEC-0003 §단어 업로드).
 * UI 없는 구독 전용 컴포넌트 — 게이트 판정은 flush 내부 소관이라 여기서는 시점만 잡는다.
 *
 * 클립과 달리 포그라운드 진입·네트워크 복구 트리거는 없다 — 단어는 생성 빈도가 낮고
 * 실패분이 다음 콜드 스타트나 동의 전환에서 회수된다.
 */
export function WordUploadBootstrap() {
  useEffect(() => {
    // auth-identity 가 웹 미지원 (auth-context 와 같은 가드). 웹은 게이트도 항상 닫힌다.
    if (Platform.OS === 'web') return;

    // 콜드 스타트 1회. 네이티브 uid 복원이 끝나기 전이면 게이트가 닫혀 있어 헛방이 되므로,
    // 그 경우엔 첫 uid 확보 시점으로 미뤄 재실행 직후 미처리 단어 업로드를 보장한다.
    if (getCurrentUid()) {
      requestWordUploadFlush();
      return;
    }

    let fired = false;
    const unsubscribeUid = subscribeToUid((uid) => {
      if (!uid || fired) return;
      fired = true;
      requestWordUploadFlush();
    });

    return () => unsubscribeUid();
  }, []);

  return null;
}
