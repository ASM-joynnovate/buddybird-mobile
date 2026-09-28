import { create } from 'zustand';

type AuthStatus = 'loading' | 'signingUp' | 'completing' | 'signedIn' | 'error';

type AuthState = {
	status: AuthStatus;
	retryCount: number;
};

type AuthActions = {
	setStatus: (status: AuthStatus) => void;
	retry: () => void;
};

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()((set) => ({
	status: 'loading',
	retryCount: 0,

	/** 인증 상태 저장 */
	setStatus: (status) => {
		set((state) => ({ ...state, status }));
	},

	/** 인증 다시 시도 횟수 1 증가 */
	retry: () => {
		set((state) => ({ ...state, retryCount: state.retryCount + 1 }));
	},
}));
