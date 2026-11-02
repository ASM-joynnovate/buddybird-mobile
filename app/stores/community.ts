import type { BlockTarget, ReportTarget } from '@/types/community';

import { create } from 'zustand';

type CountryScope = 'world' | 'mine';

type CommunityState = {
	countryScope: CountryScope;
	reportTarget: ReportTarget | null;
	blockTarget: BlockTarget | null;
};

type CommunityActions = {
	setCountryScope: (countryScope: CountryScope) => void;
	setReportTarget: (reportTarget: ReportTarget | null) => void;
	setBlockTarget: (blockTarget: BlockTarget | null) => void;
};

type CommunityStore = CommunityState & CommunityActions;

export const useCommunityStore = create<CommunityStore>()((set) => ({
	countryScope: 'world',
	reportTarget: null,
	blockTarget: null,

	/** 피드의 국가 범위 변경 */
	setCountryScope: (countryScope) => {
		set((state) => ({ ...state, countryScope }));
	},

	/** 신고할 피드 항목 변경 */
	setReportTarget: (reportTarget) => {
		set((state) => ({ ...state, reportTarget }));
	},

	/** 차단할 사용자 변경 */
	setBlockTarget: (blockTarget) => {
		set((state) => ({ ...state, blockTarget }));
	},
}));
