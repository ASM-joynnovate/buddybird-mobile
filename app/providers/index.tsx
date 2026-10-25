import type { ReactNode } from 'react';

import { StatusBar } from 'react-native';

import { QueryClientProvider } from '@tanstack/react-query';

import { queryClient } from '@/lib/query-client';

import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Toaster } from 'sonner-native';

import { TOAST_DURATION_MS } from '@/components/ui/toast';

interface Props {
	children: ReactNode;
}

/**
 * 앱 공통 provider
 * @param children 감싸는 내용
 */
const RootProviders = ({ children }: Props) => {
	return (
		<GestureHandlerRootView style={{ flex: 1 }}>
			<KeyboardProvider>
				<SafeAreaProvider>
					<StatusBar barStyle="dark-content" />
					<QueryClientProvider client={queryClient}>
						<BottomSheetModalProvider>{children}</BottomSheetModalProvider>
						<Toaster position="top-center" duration={TOAST_DURATION_MS} />
					</QueryClientProvider>
				</SafeAreaProvider>
			</KeyboardProvider>
		</GestureHandlerRootView>
	);
};

export default RootProviders;
