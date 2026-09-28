import { create } from 'zustand';

type FeedbackSource = 'profile' | 'prompt';

type FeedbackState = {
	openedFrom: FeedbackSource | null;
};

type FeedbackActions = {
	openFeedback: (openedFrom: FeedbackSource) => void;
	closeFeedback: () => void;
};

type FeedbackStore = FeedbackState & FeedbackActions;

export const useFeedbackStore = create<FeedbackStore>()((set) => ({
	openedFrom: null,

	/** 연 곳을 저장해 의견 다이얼로그 열기 */
	openFeedback: (openedFrom) => {
		set((state) => ({ ...state, openedFrom }));
	},

	/** 의견 다이얼로그 닫기 */
	closeFeedback: () => {
		set((state) => ({ ...state, openedFrom: null }));
	},
}));
