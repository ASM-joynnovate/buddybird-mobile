import type { AppMessages } from "@/i18n/types/app"
import type { AuthMessages } from "@/i18n/types/auth"
import type { CommonMessages } from "@/i18n/types/common"
import type { EntryMessages } from "@/i18n/types/entry"
import type { HomeMessages } from "@/i18n/types/home"
import type { ParrotMessages } from "@/i18n/types/parrot"
import type { ProfileMessages } from "@/i18n/types/profile"
import type { RecordsMessages } from "@/i18n/types/records"
import type { ReportMessages } from "@/i18n/types/report"
import type { SessionMessages } from "@/i18n/types/session"
import type { SettingsMessages } from "@/i18n/types/settings"
import type { WordsMessages } from "@/i18n/types/words"

export type Messages = {
	app: AppMessages
	auth: AuthMessages
	common: CommonMessages
	parrot: ParrotMessages
	session: SessionMessages
	entry: EntryMessages
	home: HomeMessages
	words: WordsMessages
	report: ReportMessages
	records: RecordsMessages
	profile: ProfileMessages
	settings: SettingsMessages
}
