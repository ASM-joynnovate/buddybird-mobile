import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { clampOffset } from '@/utils/zoom';

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
