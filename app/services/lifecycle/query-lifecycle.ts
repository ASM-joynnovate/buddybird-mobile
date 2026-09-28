import { AppState } from 'react-native';

import { focusManager, onlineManager } from '@tanstack/react-query';

import NetInfo from '@react-native-community/netinfo';

/** 앱이 화면 앞에 있는지와 인터넷 연결 여부를 TanStack Query에 반영 */
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
