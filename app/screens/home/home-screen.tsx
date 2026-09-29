import { StyleSheet, View } from 'react-native';

import { usePrefetchQuery } from '@tanstack/react-query';

import { getDeviceListOptions } from '@/hooks/apis/devices';
import { getHomeSummaryOptions } from '@/hooks/apis/home';
import { getSettingsOptions } from '@/hooks/apis/settings';
import { getWordListOptions } from '@/hooks/apis/words';
import useSoundPlayer from '@/hooks/use-sound-player';

import HomeContent from '@/screens/home/components/home-content';
import { contentMaxWidth } from '@/theme';

import ErrorHandlingWrapper from '@/components/error-handling-wrapper';
import { Screen } from '@/components/ui/screen';
import { ScreenError } from '@/components/ui/screen-error';
import { Skeleton } from '@/components/ui/skeleton';

/** 설정과 알림 버튼, 학습 설정, 시작 버튼을 보여 주는 화면 */
const HomeScreen = () => {
	usePrefetchQuery(getHomeSummaryOptions());
	usePrefetchQuery(getDeviceListOptions());
	usePrefetchQuery(getWordListOptions());
	usePrefetchQuery(getSettingsOptions());

	const player = useSoundPlayer();

	return (
		<Screen scrollable={false}>
			{/*설정과 알림 버튼, 학습 설정, 시작 버튼*/}
			<View style={styles.container}>
				<ErrorHandlingWrapper fallbackComponent={ScreenError} suspenseFallback=<Skeleton blockCount={3} />>
					<HomeContent player={player} />
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
		gap: 16,
	},
});

export default HomeScreen;
