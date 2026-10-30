import type { AdEvent } from '@/types/apis/ads';

import dayjs from 'dayjs';
import { create } from 'zustand';

type AdState = {
	adEvents: AdEvent[];
	impressionServeIds: string[];
};

type AdActions = {
	addAdImpression: (adEvent: Pick<AdEvent, 'ad_id' | 'serve_id' | 'position'>) => void;
	addAdClick: (adEvent: Pick<AdEvent, 'ad_id' | 'serve_id' | 'position' | 'click_target'>) => void;
	removeAdEvents: (sentAdEvents: AdEvent[]) => void;
};

type AdStore = AdState & AdActions;

export const useAdStore = create<AdStore>()((set) => ({
	adEvents: [],
	impressionServeIds: [],

	/** serve_id마다 한 번 노출 기록 */
	addAdImpression: (adEvent) => {
		set((state) =>
			state.impressionServeIds.includes(adEvent.serve_id)
				? state
				: {
						...state,
						adEvents: [
							...state.adEvents,
							{
								...adEvent,
								kind: 'impression',
								click_target: null,
								visible_duration_ms: null,
								occurred_at: dayjs().toISOString(),
							},
						],
						impressionServeIds: [...state.impressionServeIds, adEvent.serve_id],
					},
		);
	},

	/** 클릭 기록 */
	addAdClick: (adEvent) => {
		set((state) => ({
			...state,
			adEvents: [
				...state.adEvents,
				{
					...adEvent,
					kind: 'click',
					visible_duration_ms: null,
					occurred_at: dayjs().toISOString(),
				},
			],
		}));
	},

	/** 전송한 이벤트 삭제 */
	removeAdEvents: (sentAdEvents) => {
		set((state) => ({ ...state, adEvents: state.adEvents.filter((adEvent) => !sentAdEvents.includes(adEvent)) }));
	},
}));
