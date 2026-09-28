import { useEffect, useState } from 'react';

import { invalidate } from '@/hooks/apis/invalidate';
import { apiKeys } from '@/hooks/apis/keys';
import { useGetParrotList } from '@/hooks/apis/parrots';

import { acceptLegacyUpload, finishLegacyUpload, uploadLegacy } from '@/services/migration/upload-legacy';
import { reportError } from '@/services/telemetry/client';
import { completeOnboardingStep } from '@/services/telemetry/onboarding';
import { useDeviceSettingsStore } from '@/stores/device-settings';

async function runLegacyUpload() {
	await uploadLegacy();

	await invalidate(apiKeys.parrots.all(), apiKeys.words.all());

	completeOnboardingStep('legacy_upload');

	finishLegacyUpload();
}

export function useLegacyUpload(): {
	asking: boolean;
	uploadFailed: boolean;
	add(): void;
	skip(): void;
	retry(): void;
} {
	const [uploadFailed, setUploadFailed] = useState(false);
	const [attempt, setAttempt] = useState(0);

	const { data: parrotListData } = useGetParrotList();

	const upload = useDeviceSettingsStore((state) => state.legacyMigration.uploadStatus);

	const asking = upload === 'pending' && parrotListData.length > 0;
	const ready = !asking;

	useEffect(() => {
		if (!ready) {
			return;
		}

		void runLegacyUpload().catch((error) => {
			reportError(error, 'legacy_upload');

			setUploadFailed(true);
		});
	}, [ready, attempt]);

	return {
		asking,
		uploadFailed,
		add: acceptLegacyUpload,
		skip: () => {
			completeOnboardingStep('legacy_upload');

			finishLegacyUpload();
		},
		retry: () => {
			setUploadFailed(false);
			setAttempt((count) => count + 1);
		},
	};
}
