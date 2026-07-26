// 시스템 미디어 픽커가 떠 있는 동안을 표시하는 모듈 스코프 게이트.
// Android는 픽커가 별도 activity라 앱이 background로 전이되는데, 이를
// onboarding_abandoned 같은 "앱 이탈" 판정에서 제외하기 위해 사용한다.
// 단일 producer(프로필 아바타 픽커) 전제의 최소 구현 — 동시 픽커가 생기면 카운터로 전환.
let isActive = false;

export function beginMediaPickerGate(): void {
  isActive = true;
}

export function endMediaPickerGate(): void {
  isActive = false;
}

export function isMediaPickerGateActive(): boolean {
  return isActive;
}
