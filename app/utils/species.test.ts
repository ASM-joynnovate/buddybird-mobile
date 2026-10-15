import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { isSpeciesId, speciesGroups } from '@/utils/species';

/** 서버 Species 필드 최대 길이 */
const MAX_SPECIES_LENGTH = 50;

/** 이미 저장된 프로필이 쓰는 종 ID (바꾸면 기존 데이터와 집계가 깨진다) */
const LEGACY_SPECIES_IDS = [
	'budgie',
	'cockatiel',
	'lovebird',
	'parrotlet',
	'conure',
	'quaker',
	'caique',
	'ringneck',
	'senegal',
	'lory',
	'african-grey',
	'eclectus',
	'amazon',
	'cockatoo',
	'macaw',
];

const allSpeciesIds = Object.values<readonly string[]>(speciesGroups).flat();

void describe('speciesGroups', () => {
	void it('기존 종 ID를 모두 유지한다', () => {
		for (const id of LEGACY_SPECIES_IDS) {
			assert.ok(isSpeciesId(id), id);
		}
	});

	void it('새 종을 크기 그룹에 맞게 담는다', () => {
		const groupOf = (id: string) =>
			Object.entries(speciesGroups).find(([, ids]) => (ids as readonly string[]).includes(id))?.[0];

		assert.equal(groupOf('bourke'), 'small');
		assert.equal(groupOf('sun-conure'), 'medium');
		assert.equal(groupOf('pionus'), 'medium');
		assert.equal(groupOf('alexandrine'), 'medium');
		assert.equal(groupOf('galah'), 'large');
		assert.equal(groupOf('vasa'), 'large');
	});

	void it('종 ID가 중복되지 않는다', () => {
		assert.equal(new Set(allSpeciesIds).size, allSpeciesIds.length);
	});

	void it('종 ID가 서버 길이 제한을 넘지 않는다', () => {
		for (const id of allSpeciesIds) {
			assert.ok(id.length <= MAX_SPECIES_LENGTH, id);
		}
	});

	void it('모르는 값은 종 ID로 보지 않는다', () => {
		assert.equal(isSpeciesId('parakeet'), false);
		assert.equal(isSpeciesId(''), false);
	});
});
