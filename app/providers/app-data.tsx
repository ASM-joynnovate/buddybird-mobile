import { PropsWithChildren, useMemo } from "react"

import { useMMKVString } from "react-native-mmkv"

import { FeedbackProvider } from "@/providers/feedback"

import { AppContext } from "@/context/app-data"
import { decodeData } from "@/services/storage/codec"
import { DATA_KEY, storage } from "@/services/storage/data-store"

export function AppProvider({ children }: PropsWithChildren) {
	const [serialized] = useMMKVString(DATA_KEY, storage)
	const data = useMemo(() => {
		if (!serialized) {
			throw new Error("App data unavailable")
		}

		return decodeData(serialized)
	}, [serialized])

	return (
		<AppContext.Provider value={data}>
			<FeedbackProvider>{children}</FeedbackProvider>
		</AppContext.Provider>
	)
}
