export const speciesGroups = {
	small: ['bourke', 'budgie', 'cockatiel', 'kakariki', 'lineolated-parakeet', 'lovebird', 'parrotlet'],
	medium: [
		'alexandrine',
		'caique',
		'conure',
		'jardine',
		'lory',
		'pionus',
		'quaker',
		'ringneck',
		'senegal',
		'sun-conure',
	],
	large: ['african-grey', 'amazon', 'cockatoo', 'eclectus', 'galah', 'macaw', 'vasa'],
} as const;

export type SpeciesGroup = keyof typeof speciesGroups;

export type SpeciesId = (typeof speciesGroups)[keyof typeof speciesGroups][number];

/** 앱이 지원하는 앵무새 종 ID인지 확인하는 함수 */
export const isSpeciesId = (value: string): value is SpeciesId => {
	return Object.values<readonly string[]>(speciesGroups).flat().includes(value);
};
