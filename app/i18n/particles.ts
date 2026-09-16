export function withSubjectParticle(name: string) {
	const text = name.trim().normalize("NFC")
	const last = text.charCodeAt(text.length - 1)

	return text
		? `${text}${last >= 0xac00 && last <= 0xd7a3 && (last - 0xac00) % 28 ? "이" : "가"}`
		: ""
}
