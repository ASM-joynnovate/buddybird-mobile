export type WordMetrics = {
	word_id: string
	word_name: string
	lifetime_practice_count: number
	lifetime_practice_duration_ms: number
	lifetime_recording_count: number
	last_practiced_at_iso: string | null
}
