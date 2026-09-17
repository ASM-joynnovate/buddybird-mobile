// Input counts UTF-16 units; uploads count Unicode code points.
export const WORD_NAME_LIMIT = 50

export type SourceType = "preset" | "recording"

export type Word = {
	id: string
	label: string
	tag: "greeting" | "food" | "name" | "etc"
	sourceType: SourceType
	audioUri: string
	transformedAudioUri?: string
	createdAt: string
	updatedAt: string
	archived?: boolean
}

export type WordSnapshot = Pick<
	Word,
	"label" | "sourceType" | "audioUri" | "transformedAudioUri"
> & { libraryEntryId?: string }
