export const choices = ["short", "medium", "long", "custom"] as const

export const presetMinutes = { short: 40, medium: 80, long: 240 } as const

export type DurationChoice = (typeof choices)[number]
