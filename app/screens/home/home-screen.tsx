import { StyleSheet, View } from 'react-native';

import { usePrefetchQuery } from '@tanstack/react-query';

import { getDeviceListOptions } from '@/hooks/apis/devices';
import { getHomeSummaryOptions } from '@/hooks/apis/home';
import { getSettingsOptions } from '@/hooks/apis/settings';
import { getWordListOptions } from '@/hooks/apis/words';

import HomeContent from '@/screens/home/components/home-content';
import HomeSkeleton from '@/screens/home/components/home-skeleton';
import { contentMaxWidth } from '@/theme';

import ErrorHandlingWrapper from '@/components/error-handling-wrapper';
import { Screen } from '@/components/ui/screen';
import { ScreenError } from '@/components/ui/screen-error';

/** 학습 설정 화면 */
const HomeScreen = () => {
	usePrefetchQuery(getHomeSummaryOptions());
	usePrefetchQuery(getDeviceListOptions());
	usePrefetchQuery(getWordListOptions());
	usePrefetchQuery(getSettingsOptions());

	return (
		<Screen scrollable={false}>
			<View style={styles.container}>
				<ErrorHandlingWrapper fallbackComponent={ScreenError} suspenseFallback=<HomeSkeleton />>
					<HomeContent />
				</ErrorHandlingWrapper>
			</View>
		</Screen>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		width: '100%',
		maxWidth: contentMaxWidth,
		alignSelf: 'center',
		paddingHorizontal: 24,
		paddingTop: 8,
		paddingBottom: 16,
	},
});

export default HomeScreen;
