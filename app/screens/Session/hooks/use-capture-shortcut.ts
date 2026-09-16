import { useNavigation } from "@react-navigation/native"
import type  { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { useRef } from "react"

import type  { RootStackParamList } from "@/types/navigation"

export function useCaptureShortcut(sessionId: string | null, word: string) {
	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
	const taps = useRef({ at: 0, count: 0 })

	return () => {
		const now = Date.now()
		const count = now - taps.current.at <= 3000 ? taps.current.count + 1 : 1

		taps.current = { at: now, count: count === 5 ? 0 : count }

		if (count === 5 && sessionId) {
			navigation.navigate("SessionCaptures", { sessionId, word })
		}
	}
}
