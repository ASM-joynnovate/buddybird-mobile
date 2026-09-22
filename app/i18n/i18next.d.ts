import "i18next"
import type { Messages } from "@/i18n/types"

declare module "i18next" {
	interface CustomTypeOptions {
		resources: { translation: Messages }
	}
}
