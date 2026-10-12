import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { clampOffset, clampZoom } from '@/utils/zoom';

void describe('clampZoom', () => {
	void it('1배보다 작게 줄이지 않는다', () => {
		assert.equal(clampZoom(0.4, 3), 1);
	});

	void it('최대 배율보다 크게 키우지 않는다', () => {
		assert.equal(clampZoom(5, 3), 3);
	});

	void it('범위 안의 배율은 그대로 둔다', () => {
		assert.equal(clampZoom(1.8, 3), 1.8);
	});
});

void describe('clampOffset', () => {
	void it('1배에서는 움직이지 않는다', () => {
		assert.equal(clampOffset(40, 1, 300), 0);
	});

	void it('확대한 만큼만 가장자리까지 움직인다', () => {
		// 300px 화면을 2배로 키우면 양쪽으로 150px까지 움직일 수 있다
		assert.equal(clampOffset(200, 2, 300), 150);
		assert.equal(clampOffset(-200, 2, 300), -150);
		assert.equal(clampOffset(60, 2, 300), 60);
	});
});
