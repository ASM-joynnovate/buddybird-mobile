import { useCallback, useRef } from 'react';

import { useFocusEffect } from '@react-navigation/native';

/**
 * 화면에 다시 돌아오면 데이터를 새로 불러오는 Hook
 * @param refetch 새로 불러올 때 실행할 함수
 */
const useRefreshOnFocus = (refetch: () => Promise<unknown>) => {
	const focusedBeforeRef = useRef(false);

	/** 처음 열릴 때는 건너뛰고, 다시 포커스될 때마다 새로 불러옴 */
	useFocusEffect(
		useCallback(() => {
			if (focusedBeforeRef.current) {
				void refetch();
			} else {
				focusedBeforeRef.current = true;
			}
		}, [refetch]),
	);
};

export default useRefreshOnFocus;
