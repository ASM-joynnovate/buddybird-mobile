import { create } from 'zustand';

type FeedbackSource = 'profile' | 'prompt';

type FeedbackState = {
	source: FeedbackSource | null;
};

type FeedbackActions = {
	open: (source: FeedbackSource) => void;
	close: () => void;
};

type FeedbackStore = FeedbackState & FeedbackActions;

export const useFeedbackStore = create<FeedbackStore>()((set) => ({
	source: null,

	open: (source) => {
		set((state) => ({ ...state, source }));
	},

	close: () => {
		set((state) => ({ ...state, source: null }));
	},
}));
