type PluralMessages<Key extends string> = {
	[Form in `${Key}_${'one' | 'few' | 'many' | 'other'}`]: string;
};

type UnrankedMessage = {
	title: string;
	description: string;
};

export type CommunityMessages = {
	title: string;
	me: string;
	countryScope: {
		world: string;
		mine: string;
	};
	leaderboard: {
		title: string;
		viewAll: string;
		unranked: {
			not_participating: UnrankedMessage & { action: string };
			no_nickname: UnrankedMessage & { action: string };
			anonymous: UnrankedMessage & { action: string };
			country_mismatch: UnrankedMessage;
			no_record: UnrankedMessage;
		};
	};
	feed: {
		title: string;
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
		reaction: {
			praise: string;
			praised: string;
			celebrate: string;
			celebrated: string;
		};
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
