import { create } from 'zustand';

type ConsentState = {
	agreedIds: readonly string[];
};

type ConsentActions = {
	addAgreedId: (id: string) => void;
	clearAgreedIds: () => void;
};

type ConsentStore = ConsentState & ConsentActions;

export const useConsentStore = create<ConsentStore>()((set) => ({
	agreedIds: [],

	/** 동의한 약관 ID 추가 */
	addAgreedId: (id) => {
		set((state) => ({ ...state, agreedIds: [...state.agreedIds, id] }));
	},

	/** 동의한 약관 ID 목록 비우기 */
	clearAgreedIds: () => {
		set((state) => ({ ...state, agreedIds: [] }));
	},
}));
