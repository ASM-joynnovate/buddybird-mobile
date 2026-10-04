import { create } from 'zustand';

type NoticeState = {
	popupShown: boolean;
};

type NoticeActions = {
	setPopupShown: (popupShown: boolean) => void;
};

type NoticeStore = NoticeState & NoticeActions;

export const useNoticeStore = create<NoticeStore>()((set) => ({
	popupShown: false,

	/** 공지 팝업 표시 여부 저장 */
	setPopupShown: (popupShown) => {
		set((state) => ({ ...state, popupShown }));
	},
}));
