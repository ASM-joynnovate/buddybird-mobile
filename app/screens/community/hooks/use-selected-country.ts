import { useGetMe } from '@/hooks/apis/users';

import { useCommunityStore } from '@/stores/community';

/** 선택한 국가 범위의 국가 코드 Hook */
const useSelectedCountry = () => {
	const { data: meData } = useGetMe();

	const countryScope = useCommunityStore((state) => state.countryScope);

	return countryScope === 'mine' ? (meData.country ?? null) : null;
};

export default useSelectedCountry;
