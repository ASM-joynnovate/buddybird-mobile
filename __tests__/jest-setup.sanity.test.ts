// jest-expo 러너 셋업 검증용 sanity 테스트 (BB-283 Phase 0).
// TS transform + 모듈 해석이 동작하는지만 확인한다.

describe('jest-expo setup', () => {
    it('runs a TypeScript test', () => {
        const sum = (a: number, b: number): number => a + b;
        expect(sum(1, 2)).toBe(3);
    });
});
