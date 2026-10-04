export const speciesGroups = {
	small: ['budgie', 'cockatiel', 'lovebird', 'parrotlet'],
	medium: ['conure', 'quaker', 'caique', 'ringneck', 'senegal', 'lory'],
	large: ['african-grey', 'eclectus', 'amazon', 'cockatoo', 'macaw'],
} as const;

export type SpeciesId = (typeof speciesGroups)[keyof typeof speciesGroups][number];

/** 앱이 지원하는 앵무새 종 ID인지 확인하는 함수 */
export const isSpeciesId = (value: string): value is SpeciesId => {
	return Object.values<readonly string[]>(speciesGroups).flat().includes(value);
};
