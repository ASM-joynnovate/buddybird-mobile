import { createContext } from "react"

import { AppData } from "@/types/app-data"

export const AppContext = createContext<AppData | null>(null)
