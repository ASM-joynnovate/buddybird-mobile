import type { QueryKey } from '@tanstack/react-query';

import { queryClient } from '@/lib/query-client';

/** 쿼리 캐시 무효화 함수 */
export const invalidate = (...keys: QueryKey[]) => {
	return Promise.all(keys.map((queryKey) => queryClient.invalidateQueries({ queryKey })));
};
