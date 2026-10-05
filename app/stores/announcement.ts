import { create } from 'zustand';

type AnnouncementState = {
	popupShown: boolean;
};

type AnnouncementActions = {
	setPopupShown: (popupShown: boolean) => void;
};

type AnnouncementStore = AnnouncementState & AnnouncementActions;

export const useAnnouncementStore = create<AnnouncementStore>()((set) => ({
	popupShown: false,

	/** 공지 팝업 표시 여부 저장 */
	setPopupShown: (popupShown) => {
		set((state) => ({ ...state, popupShown }));
	},
}));
