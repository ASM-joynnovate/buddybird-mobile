import { createContext } from "react"

import type { AppData } from "@/types/app-data"

export const AppContext = createContext<AppData | null>(null)
