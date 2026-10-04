import { Platform } from 'react-native';

import { type AppUpdate, appUpdateSchema } from '@/types/apis/app-update';

import { apiRequest } from '@/lib/api';

export const getAppUpdate = async (): Promise<AppUpdate> => {
	const { data: appUpdate } = await apiRequest(`/api/v1/app-updates/${Platform.OS}`, appUpdateSchema);

	return appUpdate;
};
