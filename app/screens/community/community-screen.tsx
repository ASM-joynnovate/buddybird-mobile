import { ActivityIndicator, StyleSheet } from 'react-native';

import CommunityContent from '@/screens/community/components/community-content';
import { colors } from '@/theme';

import ErrorHandlingWrapper from '@/components/error-handling-wrapper';
import { Screen } from '@/components/ui/screen';
import { ScreenError } from '@/components/ui/screen-error';

/** 커뮤니티 화면 */
const CommunityScreen = () => {
	return (
		<Screen scrollable={false}>
			<ErrorHandlingWrapper
				fallbackComponent={ScreenError}
				suspenseFallback=<ActivityIndicator color={colors.orange} style={styles.loading} />
			>
				<CommunityContent />
			</ErrorHandlingWrapper>
		</Screen>
	);
};

const styles = StyleSheet.create({
	loading: { flex: 1 },
});

export default CommunityScreen;
