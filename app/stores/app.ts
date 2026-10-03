import type Animated from 'react-native-reanimated';
import type { AnimatedRef, SharedValue } from 'react-native-reanimated';
import { create } from 'zustand';

type StartupScreenRequest = {
	onRetry?: () => void;
};

export type LandingTarget = {
	buddyRef: AnimatedRef<Animated.View>;
	sheetRef: AnimatedRef<Animated.View>;
	buddyHidden: SharedValue<boolean>;
};

type AppState = {
	splashFinished: boolean;
	startupScreen: StartupScreenRequest | null;
	startupOverlayShown: boolean;
	landingTarget: LandingTarget | null;
};

type AppActions = {
	setSplashFinished: (splashFinished: boolean) => void;
	setStartupScreen: (startupScreen: StartupScreenRequest | null) => void;
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

	/** 시작 화면 요청 변경, 요청이 생기면 시작 화면 표시 */
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

	/** 시작 화면의 버디가 옮겨 갈 목적지 변경 */
	setLandingTarget: (landingTarget) => {
		set((state) => ({ ...state, landingTarget }));
	},
}));
