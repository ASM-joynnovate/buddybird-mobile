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

	/** 피드백 다이얼로그 열기 */
	openFeedback: (openedFrom) => {
		set((state) => ({ ...state, openedFrom }));
	},

	/** 피드백 다이얼로그 닫기 */
	closeFeedback: () => {
		set((state) => ({ ...state, openedFrom: null }));
	},
}));
