import type { Locale } from "@/types/locale"
import type { Word } from "@/types/word"

export type Preset = Word & { locale: Locale; asset: number }

const PRESET_TIME = "1970-01-01T00:00:00.000Z"

export const presets: readonly Preset[] = [
	{
		id: "preset-annyeong",
		locale: "ko",
		label: "안녕",
		tag: "greeting",
		sourceType: "preset",
		audioUri: "preset://annyeong",
		asset: require("@assets/audio/ko-kr/default_An-nyeong.m4a"),
		createdAt: PRESET_TIME,
		updatedAt: PRESET_TIME,
	},
	{
		id: "preset-sagwa",
		locale: "ko",
		label: "사과",
		tag: "food",
		sourceType: "preset",
		audioUri: "preset://sagwa",
		asset: require("@assets/audio/ko-kr/default_Sa-gwa.m4a"),
		createdAt: PRESET_TIME,
		updatedAt: PRESET_TIME,
	},
	{
		id: "preset-saranghae",
		locale: "ko",
		label: "사랑해",
		tag: "greeting",
		sourceType: "preset",
		audioUri: "preset://saranghae",
		asset: require("@assets/audio/ko-kr/default_Sa-rang-hae.m4a"),
		createdAt: PRESET_TIME,
		updatedAt: PRESET_TIME,
	},
	{
		id: "preset-danyeowa",
		locale: "ko",
		label: "다녀와",
		tag: "greeting",
		sourceType: "preset",
		audioUri: "preset://danyeowa",
		asset: require("@assets/audio/ko-kr/default_Da-nyeo-wa.m4a"),
		createdAt: PRESET_TIME,
		updatedAt: PRESET_TIME,
	},
	{
		id: "preset-hi",
		locale: "en",
		label: "Hi",
		tag: "greeting",
		sourceType: "preset",
		audioUri: "preset://hi",
		asset: require("@assets/audio/en-us/default_hi.m4a"),
		createdAt: PRESET_TIME,
		updatedAt: PRESET_TIME,
	},
	{
		id: "preset-hello",
		locale: "en",
		label: "Hello",
		tag: "greeting",
		sourceType: "preset",
		audioUri: "preset://hello",
		asset: require("@assets/audio/en-us/default_hello.m4a"),
		createdAt: PRESET_TIME,
		updatedAt: PRESET_TIME,
	},
]

export const presetById = new Map(presets.map((preset) => [preset.id, preset]))

export function presetByAudioUri(uri: string): Preset | undefined {
	return presets.find((preset) => preset.audioUri === uri)
}
