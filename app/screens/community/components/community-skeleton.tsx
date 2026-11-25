import { StyleSheet, View } from 'react-native';

import { useTranslation } from 'react-i18next';

import CommunityFeedSkeleton from '@/screens/community/components/community-feed-skeleton';
import { contentMaxWidth } from '@/theme';

import { Title } from '@/components/ui/title';

/** 커뮤니티를 불러오는 동안 표시하는 컴포넌트 */
const CommunitySkeleton = () => {
	const { t } = useTranslation();

	return (
		<View style={styles.container}>
			<Title style={styles.title}>{t('community.title')}</Title>
			<CommunityFeedSkeleton />
		</View>
	);
};

const styles = StyleSheet.create({
	container: { flex: 1, width: '100%', maxWidth: contentMaxWidth, alignSelf: 'center' },
	title: { minHeight: 56, paddingHorizontal: 24, paddingTop: 12 },
});

export default CommunitySkeleton;
