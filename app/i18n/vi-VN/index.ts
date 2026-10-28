import type { Messages } from '@/i18n/types';
import { apiError } from '@/i18n/vi-VN/api-error';
import { app } from '@/i18n/vi-VN/app';
import { auth } from '@/i18n/vi-VN/auth';
import { common } from '@/i18n/vi-VN/common';
import { community } from '@/i18n/vi-VN/community';
import { home } from '@/i18n/vi-VN/home';
import { onboarding } from '@/i18n/vi-VN/onboarding';
import { parrot } from '@/i18n/vi-VN/parrot';
import { profile } from '@/i18n/vi-VN/profile';
import { report } from '@/i18n/vi-VN/report';
import { session } from '@/i18n/vi-VN/session';
import { settings } from '@/i18n/vi-VN/settings';
import { words } from '@/i18n/vi-VN/words';

export const vi: Messages = {
	app,
	apiError,
	auth,
	common,
	parrot,
	session,
	onboarding,
	home,
	words,
	report,
	community,
	profile,
	settings,
};
