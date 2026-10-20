import { HotUpdater, insights } from '@hot-updater/react-native';

import { env } from '@/config';
import { reportError } from '@/services/telemetry/client';

export const hotUpdater = HotUpdater.init({
	baseURL: env.hotUpdaterBaseUrl,
	requestHeaders: { 'x-api-key': env.hotUpdaterApiKey },
	onError: (error) => reportError(error, 'hot_updater'),
	plugins: [insights()],
});
