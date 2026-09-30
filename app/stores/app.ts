import { create } from 'zustand';

type AppState = {
	splashFinished: boolean;
};

type AppActions = {
	setSplashFinished: (splashFinished: boolean) => void;
};

type AppStore = AppState & AppActions;

export const useAppStore = create<AppStore>()((set) => ({
	splashFinished: false,

	/** 스플래시 종료 여부 변경 */
	setSplashFinished: (splashFinished) => {
		set((state) => ({ ...state, splashFinished }));
	},
}));
