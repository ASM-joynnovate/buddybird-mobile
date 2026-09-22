export const speciesGroups = {
	small: ["budgie", "cockatiel", "lovebird", "parrotlet"],
	medium: ["conure", "quaker", "caique", "ringneck", "senegal", "lory"],
	large: ["african-grey", "eclectus", "amazon", "cockatoo", "macaw"],
} as const

export type SpeciesId = (typeof speciesGroups)[keyof typeof speciesGroups][number]

export const speciesIds: readonly SpeciesId[] = Object.values(speciesGroups).flat()

export function isSpeciesId(value: string): value is SpeciesId {
	return (speciesIds as readonly string[]).includes(value)
}
