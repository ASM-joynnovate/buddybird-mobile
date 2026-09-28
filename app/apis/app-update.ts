import { type AppUpdate, appUpdateSchema } from '@/types/apis/app-update';

import { mockServer } from '@/mocks/server';

export const getAppUpdate = async (): Promise<AppUpdate> => {
	return appUpdateSchema.parse(await mockServer.appUpdate.get());
};
