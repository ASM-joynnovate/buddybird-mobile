import { AppState } from 'react-native';

import { focusManager, onlineManager } from '@tanstack/react-query';

import NetInfo from '@react-native-community/netinfo';

export function connectQueryLifecycle() {
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
}
