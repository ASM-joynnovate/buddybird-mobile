import type { LandingTarget } from '@/types/startup';

import { create } from 'zustand';

interface StartupScreenOptions {
	onRetry?: () => void;
}

type AppState = {
	splashFinished: boolean;
	startupScreen: StartupScreenOptions | null;
	startupOverlayShown: boolean;
	landingTarget: LandingTarget | null;
};

type AppActions = {
	setSplashFinished: (splashFinished: boolean) => void;
	setStartupScreen: (startupScreen: StartupScreenOptions | null) => void;
	hideStartupOverlay: () => void;
	setLandingTarget: (landingTarget: LandingTarget | null) => void;
};

type AppStore = AppState & AppActions;

export const useAppStore = create<AppStore>()((set) => ({
	splashFinished: false,
	startupScreen: {},
	startupOverlayShown: true,
	landingTarget: null,

	/** 스플래시 종료 여부 변경 */
	setSplashFinished: (splashFinished) => {
		set((state) => ({ ...state, splashFinished }));
	},

	/** 시작 화면 요청 변경 */
	setStartupScreen: (startupScreen) => {
		set((state) => ({
			...state,
			startupScreen,
			startupOverlayShown: state.startupOverlayShown || startupScreen !== null,
		}));
	},

	/** 시작 화면 숨기기 */
	hideStartupOverlay: () => {
		set((state) => ({ ...state, startupOverlayShown: false }));
	},

	/** 버디가 이동할 목적지 변경 */
	setLandingTarget: (landingTarget) => {
		set((state) => ({ ...state, landingTarget }));
	},
}));
