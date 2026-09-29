import { AppState } from 'react-native';

import { focusManager, onlineManager } from '@tanstack/react-query';

import NetInfo from '@react-native-community/netinfo';

/** 앱 상태 변화를 TanStack Query에 연결하는 함수 */
export const connectQueryLifecycle = () => {
	focusManager.setFocused(AppState.currentState === 'active');

	const appStateSubscription = AppState.addEventListener('change', (appState) => {
		focusManager.setFocused(appState === 'active');
	});

	const unsubscribeNetwork = NetInfo.addEventListener((networkState) => {
		onlineManager.setOnline(networkState.isConnected === true && networkState.isInternetReachable !== false);
	});

	return () => {
		appStateSubscription.remove();
		unsubscribeNetwork();
	};
};
