import type { ApiErrorMessages } from '@/i18n/types/api-error';
import type { AppMessages } from '@/i18n/types/app';
import type { AuthMessages } from '@/i18n/types/auth';
import type { CommonMessages } from '@/i18n/types/common';
import type { HomeMessages } from '@/i18n/types/home';
import type { OnboardingMessages } from '@/i18n/types/onboarding';
import type { ParrotMessages } from '@/i18n/types/parrot';
import type { ProfileMessages } from '@/i18n/types/profile';
import type { ReportMessages } from '@/i18n/types/report';
import type { SessionMessages } from '@/i18n/types/session';
import type { SettingsMessages } from '@/i18n/types/settings';
import type { WordsMessages } from '@/i18n/types/words';

export type Messages = {
	app: AppMessages;
	apiError: ApiErrorMessages;
	auth: AuthMessages;
	common: CommonMessages;
	parrot: ParrotMessages;
	session: SessionMessages;
	onboarding: OnboardingMessages;
	home: HomeMessages;
	words: WordsMessages;
	report: ReportMessages;
	profile: ProfileMessages;
	settings: SettingsMessages;
};
