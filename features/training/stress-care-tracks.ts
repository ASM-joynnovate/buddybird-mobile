// 스트레스 케어 구간(BB-380, PRD FR-18)에 재생할 온디바이스 번들 트랙 레지스트리.
// 트랙 제작·인코딩(HE-AAC 48kbps, 5분) 근거: buddybird-stresscare-audio 레포 production.md.
// 트랙 3종(02·03·04) 선정 근거: BB-380 코멘트(2026-08-24) — 용량 절충으로 10종 중 3종 채택,
// iPhone 실기기 청취 비교로 확정.
// require()는 정적 문자열만 허용하므로 각 파일을 개별 등록한다.
// 구간마다 하나를 랜덤 재생하는 추첨은 구간 진입이 백그라운드에서 일어나므로 네이티브 엔진이
// 수행한다 — JS는 로컬 파일 URI 목록만 전달한다 (use-active-session).
export const STRESS_CARE_TRACK_MODULES: number[] = [
  require('@/assets/audio/stress-care/track-02.m4a'),
  require('@/assets/audio/stress-care/track-03.m4a'),
  require('@/assets/audio/stress-care/track-04.m4a'),
];
