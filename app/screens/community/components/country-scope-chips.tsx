import { StyleSheet, View } from 'react-native';

import { useGetMe } from '@/hooks/apis/users';

import { useTranslation } from 'react-i18next';

import { GlobeIcon } from 'lucide-react-native';

import { useCommunityStore } from '@/stores/community';
import { colors } from '@/theme';

import { Chip } from '@/components/ui/chip';
import { Flag } from '@/components/ui/flag';

/** 순위 및 피드의 국가 필터 칩 컴포넌트 */
const CountryScopeChips = () => {
	const { t } = useTranslation();

	const { data: meData } = useGetMe();

	const countryScope = useCommunityStore((state) => state.countryScope);
	const setCountryScope = useCommunityStore((state) => state.setCountryScope);

	return (
		<View style={styles.container}>
			<Chip
				label={t('community.countryScope.world')}
				leading=<GlobeIcon size={16} color={countryScope === 'world' ? colors.onFilled : colors.muted} />
				selected={countryScope === 'world'}
				onPress={() => setCountryScope('world')}
			/>
			{!!meData.country && (
				<Chip
					label={t('community.countryScope.mine')}
					leading=<Flag country={meData.country} />
					selected={countryScope === 'mine'}
					onPress={() => setCountryScope('mine')}
				/>
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
		paddingHorizontal: 24,
		paddingBottom: 12,
		borderBottomWidth: 2,
		borderBottomColor: colors.border,
	},
});

export default CountryScopeChips;
