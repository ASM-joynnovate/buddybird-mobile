import { create } from 'zustand';

type AnnouncementState = {
	popupClosed: boolean;
};

type AnnouncementActions = {
	setPopupClosed: (popupClosed: boolean) => void;
};

type AnnouncementStore = AnnouncementState & AnnouncementActions;

export const useAnnouncementStore = create<AnnouncementStore>()((set) => ({
	popupClosed: false,

	/** 공지 팝업 닫힘 여부 저장 */
	setPopupClosed: (popupClosed) => {
		set((state) => ({ ...state, popupClosed }));
	},
}));
