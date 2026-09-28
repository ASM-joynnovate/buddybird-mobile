import type { ReactNode } from 'react';

import { StatusBar } from 'react-native';

import { QueryClientProvider } from '@tanstack/react-query';

import { queryClient } from '@/lib/query-client';

import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

interface Props {
	children: ReactNode;
}

/**
 * 제스처, 화면 안전 영역, 서버 데이터 캐시, 시트를 앱 전체에서 쓰게 하고 상태 표시줄 글자를 어둡게 하는 provider
 * @param children 감싸는 내용
 */
const RootProviders = ({ children }: Props) => {
	return (
		<GestureHandlerRootView style={{ flex: 1 }}>
			<SafeAreaProvider>
				<StatusBar barStyle="dark-content" />
				<QueryClientProvider client={queryClient}>
					<BottomSheetModalProvider>{children}</BottomSheetModalProvider>
				</QueryClientProvider>
			</SafeAreaProvider>
		</GestureHandlerRootView>
	);
};

export default RootProviders;
