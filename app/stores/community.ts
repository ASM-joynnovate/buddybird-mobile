import type { FeedItem } from '@/types/apis/feed';
import type { CommunityUser } from '@/types/apis/users';

import { create } from 'zustand';

type CountryScope = 'world' | 'mine';

type CommunityState = {
	countryScope: CountryScope;
	feedItemToReport: FeedItem | null;
	userToBlock: CommunityUser | null;
};

type CommunityActions = {
	setCountryScope: (countryScope: CountryScope) => void;
	setFeedItemToReport: (feedItemToReport: FeedItem | null) => void;
	setUserToBlock: (userToBlock: CommunityUser | null) => void;
};

type CommunityStore = CommunityState & CommunityActions;

export const useCommunityStore = create<CommunityStore>()((set) => ({
	countryScope: 'world',
	feedItemToReport: null,
	userToBlock: null,

	/** 순위 및 피드의 국가 범위 변경 */
	setCountryScope: (countryScope) => {
		set((state) => ({ ...state, countryScope }));
	},

	/** 신고할 피드 항목 변경 */
	setFeedItemToReport: (feedItemToReport) => {
		set((state) => ({ ...state, feedItemToReport }));
	},

	/** 차단할 사용자 변경 */
	setUserToBlock: (userToBlock) => {
		set((state) => ({ ...state, userToBlock }));
	},
}));
