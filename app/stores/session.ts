import type { LearningDuration } from '@/types/navigation';
import type { SleepSettings } from '@/types/sleep-settings';

import type { MeasuredDimensions } from 'react-native-reanimated';
import { create } from 'zustand';

import { SESSION_DURATION_PRESETS, SESSION_INFO_HIDE_MS } from '@/config';

type SessionScreenState = {
	infoVisible: boolean;
	hideInfoTimer: ReturnType<typeof setTimeout> | null;
	engineFailed: boolean;
	sessionFinishing: boolean;
};

type SessionSetupState = {
	selectedWordId: string | null;
	duration: LearningDuration;
	editedSleep: SleepSettings | null;
};

type SessionSummaryState = {
	summarySentenceIndex: number;
	summaryFilledSentenceIndexes: number[];
	summaryAutoAdvanceStopped: boolean;
	summaryNumberOrigin: { sentenceIndex: number; position: MeasuredDimensions } | null;
};

type SessionActions = {
	showInfo: () => void;
	setEngineFailed: (engineFailed: boolean) => void;
	setSessionFinishing: (sessionFinishing: boolean) => void;
	resetSessionScreen: () => void;
	setSelectedWordId: (selectedWordId: string) => void;
	setDuration: (duration: LearningDuration) => void;
	setEditedSleep: (editedSleep: SleepSettings) => void;
	resetSetup: () => void;
	setSummarySentenceIndex: (summarySentenceIndex: number) => void;
	completeSummarySentence: (sentenceIndex: number, position: MeasuredDimensions | null) => void;
	moveSummarySentence: (sentenceIndex: number) => void;
	clearSummaryNumberOrigin: () => void;
	resetSessionSummary: () => void;
};

type SessionStore = SessionScreenState & SessionSetupState & SessionSummaryState & SessionActions;

/** 세션 화면 초기값 */
const initSessionScreen = (): SessionScreenState => ({
	infoVisible: true,
	hideInfoTimer: null,
	engineFailed: false,
	sessionFinishing: false,
});

/** 홈 학습 설정 초기값 */
const initSessionSetup = (): SessionSetupState => ({
	selectedWordId: null,
	duration: { ms: SESSION_DURATION_PRESETS[0].ms, custom: false },
	editedSleep: null,
});

/** 완료 화면 초기값 */
const initSessionSummary = (): SessionSummaryState => ({
	summarySentenceIndex: 0,
	summaryFilledSentenceIndexes: [],
	summaryAutoAdvanceStopped: false,
	summaryNumberOrigin: null,
});

export const useSessionStore = create<SessionStore>()((set, get) => ({
	...initSessionScreen(),
	...initSessionSetup(),
	...initSessionSummary(),

	/** 세션 정보 표시 */
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
	setSessionFinishing: (sessionFinishing) => {
		set((state) => ({ ...state, sessionFinishing }));
	},

	/** 세션 화면 값 초기화 */
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

	/** 변경한 수면 시간 저장 */
	setEditedSleep: (editedSleep) => {
		set((state) => ({ ...state, editedSleep }));
	},

	/** 홈 학습 설정 초기화 */
	resetSetup: () => {
		set((state) => ({ ...state, ...initSessionSetup() }));
	},

	/** 완료 화면에 보이는 문장 번호 저장 */
	setSummarySentenceIndex: (summarySentenceIndex) => {
		set((state) => ({ ...state, summarySentenceIndex }));
	},

	/** 완료 화면에서 숫자가 다 찬 문장 번호와 숫자 위치 기록 */
	completeSummarySentence: (sentenceIndex, position) => {
		set((state) => ({
			...state,
			summaryFilledSentenceIndexes: state.summaryFilledSentenceIndexes.includes(sentenceIndex)
				? state.summaryFilledSentenceIndexes
				: [...state.summaryFilledSentenceIndexes, sentenceIndex],
			summaryNumberOrigin: position ? { sentenceIndex, position } : state.summaryNumberOrigin,
		}));
	},

	/** 사용자가 넘긴 완료 화면 문장으로 이동하고 자동 넘김 중지, 떠나는 문장은 숫자가 다 찬 문장으로 기록 */
	moveSummarySentence: (sentenceIndex) => {
		get().completeSummarySentence(get().summarySentenceIndex, null);

		set((state) => ({ ...state, summarySentenceIndex: sentenceIndex, summaryAutoAdvanceStopped: true }));
	},

	/** 완료 화면에서 날아간 숫자 위치 삭제 */
	clearSummaryNumberOrigin: () => {
		set((state) => ({ ...state, summaryNumberOrigin: null }));
	},

	/** 완료 화면 값 초기화 */
	resetSessionSummary: () => {
		set((state) => ({ ...state, ...initSessionSummary() }));
	},
}));
