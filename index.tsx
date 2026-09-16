import { registerRootComponent } from "expo"

import { App } from "@/app"
import { registerBackgroundPushHandler } from "@/services/push/background"

registerBackgroundPushHandler()
registerRootComponent(App)
