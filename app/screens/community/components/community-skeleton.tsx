import { StyleSheet } from 'react-native';

import { useTranslation } from 'react-i18next';

import CommunityFeedSkeleton from '@/screens/community/components/community-feed-skeleton';

import { Title } from '@/components/ui/title';

/** 커뮤니티를 불러오는 동안 표시하는 컴포넌트 */
const CommunitySkeleton = () => {
	const { t } = useTranslation();

	return (
		<>
			<Title style={styles.title}>{t('community.title')}</Title>
			<CommunityFeedSkeleton />
		</>
	);
};

const styles = StyleSheet.create({
	title: { minHeight: 56, paddingHorizontal: 24, paddingTop: 12 },
});

export default CommunitySkeleton;
