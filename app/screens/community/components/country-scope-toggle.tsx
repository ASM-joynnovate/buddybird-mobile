import { useGetMe } from '@/hooks/apis/users';

import { useTranslation } from 'react-i18next';

import { GlobeIcon } from 'lucide-react-native';

import { useCommunityStore } from '@/stores/community';
import { colors } from '@/theme';

import { Flag } from '@/components/ui/flag';
import { ToggleGroup } from '@/components/ui/toggle-group';

/** 피드의 국가 범위 토글 컴포넌트 */
const CountryScopeToggle = () => {
	const { t } = useTranslation();

	const { data: meData } = useGetMe();

	const countryScope = useCommunityStore((state) => state.countryScope);

	const setCountryScope = useCommunityStore((state) => state.setCountryScope);

	return (
		<ToggleGroup
			options={[
				{
					value: 'world',
					label: t('community.countryScope.world'),
					leading: <GlobeIcon size={16} color={countryScope === 'world' ? colors.onFilled : colors.muted} />,
				},
				...(meData.country
					? [
							{
								value: 'mine' as const,
								label: t('community.countryScope.mine'),
								leading: <Flag country={meData.country} />,
							},
						]
					: []),
			]}
			value={countryScope}
			onChange={setCountryScope}
		/>
	);
};

export default CountryScopeToggle;
