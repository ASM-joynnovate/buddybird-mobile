import { StyleSheet, View } from 'react-native';

import HomeContent from '@/screens/home/components/home-content';
import { contentMaxWidth } from '@/theme';

import ErrorHandlingWrapper from '@/components/error-handling-wrapper';
import { Screen } from '@/components/ui/screen';
import { ScreenError } from '@/components/ui/screen-error';
import { Skeleton } from '@/components/ui/skeleton';

/** 설정과 알림 버튼, 학습 설정, 시작 버튼을 보여 주는 화면 */
const HomeScreen = () => {
	return (
		<Screen scrollable={false}>
			{/*설정과 알림 버튼, 학습 설정, 시작 버튼*/}
			<View style={styles.container}>
				<ErrorHandlingWrapper fallbackComponent={ScreenError} suspenseFallback=<Skeleton blockCount={3} />>
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
		gap: 16,
	},
});

export default HomeScreen;
