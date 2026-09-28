import { StyleSheet, View } from 'react-native';

import HomeContent from '@/screens/home/components/home-content';
import { contentMaxWidth } from '@/theme';

import ErrorHandlingWrapper from '@/components/error-handling-wrapper';
import { Screen } from '@/components/ui/screen';
import { ScreenError } from '@/components/ui/screen-error';
import { Skeleton } from '@/components/ui/skeleton';

export function HomeScreen() {
	return (
		<Screen scroll={false}>
			{/*홈 본문*/}
			<View style={styles.screen}>
				<ErrorHandlingWrapper fallbackComponent={ScreenError} suspenseFallback=<Skeleton rows={3} />>
					<HomeContent />
				</ErrorHandlingWrapper>
			</View>
		</Screen>
	);
}

const styles = StyleSheet.create({
	screen: {
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
