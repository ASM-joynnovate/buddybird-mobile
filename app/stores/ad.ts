import type { AdClickTarget, AdEvent, BannerAd } from '@/types/apis/ads';

import dayjs from 'dayjs';
import { create } from 'zustand';

type AdState = {
	adEvents: AdEvent[];
	impressionServeIds: string[];
};

type AdActions = {
	addAdImpression: (ad: Pick<BannerAd, 'id' | 'serve_id'>, position: number) => void;
	addAdClick: (ad: Pick<BannerAd, 'id' | 'serve_id'>, position: number, clickTarget: AdClickTarget) => void;
	removeAdEvents: (sentAdEvents: AdEvent[]) => void;
};

type AdStore = AdState & AdActions;

export const useAdStore = create<AdStore>()((set) => ({
	adEvents: [],
	impressionServeIds: [],

	/** serve_id마다 한 번 노출 기록 */
	addAdImpression: (ad, position) => {
		set((state) =>
			state.impressionServeIds.includes(ad.serve_id)
				? state
				: {
						...state,
						adEvents: [
							...state.adEvents,
							{
								ad_id: ad.id,
								serve_id: ad.serve_id,
								kind: 'impression',
								position,
								click_target: null,
								visible_duration_ms: null,
								occurred_at: dayjs().toISOString(),
							},
						],
						impressionServeIds: [...state.impressionServeIds, ad.serve_id],
					},
		);
	},

	/** 클릭 기록 */
	addAdClick: (ad, position, clickTarget) => {
		set((state) => ({
			...state,
			adEvents: [
				...state.adEvents,
				{
					ad_id: ad.id,
					serve_id: ad.serve_id,
					kind: 'click',
					position,
					click_target: clickTarget,
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
