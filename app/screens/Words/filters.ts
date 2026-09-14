export const filters = ["all", "greeting", "food", "name", "etc"] as const

export type WordFilter = (typeof filters)[number]
