import type { QueryKey } from '@tanstack/react-query';

import { queryClient } from '@/lib/query-client';

/** 여러 쿼리 키의 캐시 무효화 */
export const invalidate = (...keys: QueryKey[]) => {
	return Promise.all(keys.map((queryKey) => queryClient.invalidateQueries({ queryKey })));
};
