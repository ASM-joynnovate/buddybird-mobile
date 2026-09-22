import type { TagTone } from "@/components/ui/tag"
import type { Phase } from "@/services/session/phases"

export function phaseTone(phase: Phase): TagTone {
	if (phase === "learning") {
		return "primary"
	}

	return phase === "sleeping" ? "muted" : "blue"
}
