export const speciesGroups = {
	small: ["budgie", "cockatiel", "lovebird", "parrotlet"],
	medium: ["conure", "quaker", "caique", "ringneck", "senegal", "lory"],
	large: ["african-grey", "eclectus", "amazon", "cockatoo", "macaw"],
} as const

export const speciesIds: readonly string[] = Object.values(speciesGroups).flat()
