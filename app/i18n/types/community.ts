import type { PluralMessages } from '@/i18n/types/plural';

export type CommunityMessages = {
	title: string;
	me: string;
	feedConsent: {
		title: string;
		message: string;
		confirm: string;
	};
	countryScope: {
		world: string;
		mine: string;
	};
	leaderboard: {
		title: string;
		viewAll: string;
		unranked: {
			not_participating: { title: string; description: string; action: string };
			no_nickname: { title: string; action: string };
			anonymous: { title: string; action: string };
			country_mismatch: { title: string };
			no_record: { title: string };
		};
	};
	feed: {
		more: string;
		timeAgo: PluralMessages<'minutes'> & PluralMessages<'hours'> & PluralMessages<'days'> & { yesterday: string };
		mimic: {
			label: string;
			word: string;
			private: string;
			play: string;
		};
		totalLearningTime: string;
		monthlyLearningTime: string;
		artHours: string;
		like: string;
	} & PluralMessages<'wordPlayCount'> &
		PluralMessages<'artCount'>;
	report: {
		action: string;
		title: string;
		reasons: {
			spam: string;
			inappropriate_content: string;
			harassment: string;
			other: string;
		};
		description: string;
		sent: string;
	};
	block: {
		action: string;
		title: string;
		message: string;
		done: string;
		undo: string;
	};
	gate: {
		loginTitle: string;
		loginDescription: string;
		nicknameTitle: string;
		nicknameDescription: string;
		start: string;
	};
};
