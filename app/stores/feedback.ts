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

	openFeedback: (openedFrom) => {
		set((state) => ({ ...state, openedFrom }));
	},

	closeFeedback: () => {
		set((state) => ({ ...state, openedFrom: null }));
	},
}));
