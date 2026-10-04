import type { ReportPeriod } from '@/types/report-period';

import { create } from 'zustand';

import { latestStart, periodSelectionFromParams, shiftedStart } from '@/utils/report-period';

type ReportState = {
	period: ReportPeriod;
	start: string | null;
};

type ReportActions = {
	selectPeriod: (period: ReportPeriod) => void;
	movePeriod: (step: number) => void;
	moveToLatestPeriod: () => void;
	setPeriodFromParams: (params: unknown) => void;
	resetPeriod: () => void;
};

type ReportStore = ReportState & ReportActions;

/** 리포트 기간 초기값 */
const initReportStore = (): ReportState => ({ period: 'day', start: null });

export const useReportStore = create<ReportStore>()((set, get) => ({
	...initReportStore(),

	/** 기간 단위 선택 */
	selectPeriod: (period) => {
		set((state) => ({ ...state, period, start: null }));
	},

	/** 이전 또는 다음 기간으로 step만큼 이동 */
	movePeriod: (step) => {
		const { period, start } = get();
		const latestPeriodStart = latestStart(period);
		const movedStart = shiftedStart(period, start ?? latestPeriodStart, step);

		if (movedStart > latestPeriodStart) {
			return;
		}

		set((state) => ({ ...state, start: movedStart === latestPeriodStart ? null : movedStart }));
	},

	/** 오늘이 들어 있는 기간으로 이동 */
	moveToLatestPeriod: () => {
		set((state) => ({ ...state, start: null }));
	},

	/** route params의 기간 반영 */
	setPeriodFromParams: (params) => {
		set((state) => ({ ...state, ...periodSelectionFromParams(params) }));
	},

	/** 리포트 기간 초기화 */
	resetPeriod: () => {
		set((state) => ({ ...state, ...initReportStore() }));
	},
}));
