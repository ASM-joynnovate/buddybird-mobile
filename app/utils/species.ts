export const speciesGroups = {
	small: ['budgie', 'cockatiel', 'lovebird', 'parrotlet'],
	medium: ['conure', 'quaker', 'caique', 'ringneck', 'senegal', 'lory'],
	large: ['african-grey', 'eclectus', 'amazon', 'cockatoo', 'macaw'],
} as const;

export type SpeciesId = (typeof speciesGroups)[keyof typeof speciesGroups][number];

export function isSpeciesId(value: string): value is SpeciesId {
	return Object.values<readonly string[]>(speciesGroups).flat().includes(value);
}
