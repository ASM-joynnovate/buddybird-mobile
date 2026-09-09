import { createContext, PropsWithChildren, useContext, useMemo, useState } from "react"
import { useMMKVString } from "react-native-mmkv"

import { AppData } from "@/services/data"
import { decodeData } from "@/services/persistence"
import { DATA_KEY, storage } from "@/services/storage"

type FeedbackSource = "profile" | "prompt"
const AppContext = createContext<AppData | null>(null)
const FeedbackContext = createContext<{
  source: FeedbackSource | null
  open(source: FeedbackSource): void
  close(): void
} | null>(null)

export function AppProvider({ children }: PropsWithChildren) {
  const [source, setSource] = useState<FeedbackSource | null>(null)
  const [serialized] = useMMKVString(DATA_KEY, storage)
  const data = useMemo(() => {
    if (!serialized) {
      throw new Error("App data unavailable")
    }

    return decodeData(serialized)
  }, [serialized])

  return (
    <AppContext.Provider value={data}>
      <FeedbackContext.Provider value={{ source, open: setSource, close: () => setSource(null) }}>
        {children}
      </FeedbackContext.Provider>
    </AppContext.Provider>
  )
}

export function useAppData() {
  const data = useContext(AppContext)

  if (!data) {
    throw new Error("AppProvider must finish migration first")
  }

  return data
}

export function useFeedbackDialog() {
  const value = useContext(FeedbackContext)

  if (!value) {
    throw new Error("AppProvider missing")
  }

  return value
}
