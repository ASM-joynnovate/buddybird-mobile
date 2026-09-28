import type { LearningDuration } from '@/types/navigation';
import type { SleepSettings } from '@/types/sleep-settings';

import { create } from 'zustand';

import { SESSION_INFO_HIDE_MS } from '@/config';

type SessionScreenState = {
	infoVisible: boolean;
	hideInfoTimer: ReturnType<typeof setTimeout> | null;
	engineFailed: boolean;
	ending: boolean;
};

type SessionSetupState = {
	selectedWordId: string | null;
	duration: LearningDuration;
	editedSleep: SleepSettings | null;
};

type SessionActions = {
	showInfo: () => void;
	setEngineFailed: (engineFailed: boolean) => void;
	setEnding: (ending: boolean) => void;
	resetSessionScreen: () => void;
	setSelectedWordId: (selectedWordId: string) => void;
	setDuration: (duration: LearningDuration) => void;
	setEditedSleep: (editedSleep: SleepSettings) => void;
	resetSetup: () => void;
};

type SessionStore = SessionScreenState & SessionSetupState & SessionActions;

const UNTIL_END: LearningDuration = { ms: null, custom: false };

/** 세션 화면 처음 값 */
const initSessionScreen = (): SessionScreenState => ({
	infoVisible: true,
	hideInfoTimer: null,
	engineFailed: false,
	ending: false,
});

/** 홈 학습 설정 처음 값 */
const initSessionSetup = (): SessionSetupState => ({
	selectedWordId: null,
	duration: UNTIL_END,
	editedSleep: null,
});

export const useSessionStore = create<SessionStore>()((set, get) => ({
	...initSessionScreen(),
	...initSessionSetup(),

	/** 세션 정보 표시와 숨김 타이머 다시 시작 */
	showInfo: () => {
		const { hideInfoTimer } = get();

		if (hideInfoTimer) {
			clearTimeout(hideInfoTimer);
		}

		const nextHideInfoTimer = setTimeout(() => {
			set((state) => ({ ...state, infoVisible: false }));
		}, SESSION_INFO_HIDE_MS);

		set((state) => ({ ...state, infoVisible: true, hideInfoTimer: nextHideInfoTimer }));
	},

	/** 학습 엔진 시작 실패 여부 저장 */
	setEngineFailed: (engineFailed) => {
		set((state) => ({ ...state, engineFailed }));
	},

	/** 학습 종료 진행 여부 저장 */
	setEnding: (ending) => {
		set((state) => ({ ...state, ending }));
	},

	/** 숨김 타이머 정지와 세션 화면 값 초기화 */
	resetSessionScreen: () => {
		const { hideInfoTimer } = get();

		if (hideInfoTimer) {
			clearTimeout(hideInfoTimer);
		}

		set((state) => ({ ...state, ...initSessionScreen() }));
	},

	/** 학습할 단어 ID 저장 */
	setSelectedWordId: (selectedWordId) => {
		set((state) => ({ ...state, selectedWordId }));
	},

	/** 학습 시간 저장 */
	setDuration: (duration) => {
		set((state) => ({ ...state, duration }));
	},

	/** 바꾼 수면 시간 저장 */
	setEditedSleep: (editedSleep) => {
		set((state) => ({ ...state, editedSleep }));
	},

	/** 홈 학습 설정 초기화 */
	resetSetup: () => {
		set((state) => ({ ...state, ...initSessionSetup() }));
	},
}));
