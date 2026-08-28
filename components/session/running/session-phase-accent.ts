import { BuddyBirdColors } from '@/constants/theme';

import type { SessionEnginePhase } from '@/modules/session-audio-engine';

// 세션 진행 화면의 구간별 accent 단일 소스 (BB-380) — 링·헤더 진행바·웨이브가 공유한다.
// 학습=primary, 휴식·스트레스 케어=secondary (비학습 구간은 파란색 통일 — 2026-08-25 사용자 결정).
export const PHASE_ACCENTS: Record<SessionEnginePhase, string> = {
  learning: BuddyBirdColors.primary,
  rest: BuddyBirdColors.secondary,
  'stress-care': BuddyBirdColors.secondary,
};
