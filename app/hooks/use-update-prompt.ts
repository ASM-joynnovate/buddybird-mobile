import { useEffect, useRef, useState } from 'react';

import { Alert } from 'react-native';

import { useQuery } from '@tanstack/react-query';

import { appUpdateQueryOptions } from '@/hooks/apis/app-update';

import { useTranslation } from 'react-i18next';

import { installedVersion, openAppStore } from '@/services/device/application';
import { reportError, track } from '@/services/telemetry/client';
import { useDeviceSettingsStore } from '@/stores/device-settings';
import { evaluateUpdate } from '@/utils/update';

export function useUpdatePrompt() {
	const { t } = useTranslation();

	const [storeOpening, setStoreOpening] = useState(false);
	const [acceptedUpdate, setAcceptedUpdate] = useState<string | null>(null);

	const shownUpdate = useRef<string | null>(null);

	const update = useQuery(appUpdateQueryOptions());

	const preferences = useDeviceSettingsStore((state) => state.update);

	const decision = update.data
		? evaluateUpdate(
				{
					latestVersion: update.data.latest_version,
					minimumVersion: update.data.min_supported_version,
					notes: update.data.release_notes,
				},
				installedVersion,
				preferences.dismissedVersion,
			)
		: null;

	const updateVisible = !!decision && (decision.forced || acceptedUpdate !== decision.latestVersion);

	const updatesSettled =
		!update.isFetching && (update.isSuccess || update.isError || update.fetchStatus === 'paused');

	useEffect(() => {
		if (updateVisible && decision && shownUpdate.current !== decision.latestVersion) {
			shownUpdate.current = decision.latestVersion;

			track('update_prompt_shown', {
				latest_version: decision.latestVersion,
				is_forced: decision.forced,
			});
		}
	}, [updateVisible, decision]);

	async function acceptUpdate() {
		if (!decision || storeOpening) {
			return;
		}

		setStoreOpening(true);

		try {
			track('update_prompt_accepted', {
				latest_version: decision.latestVersion,
				is_forced: decision.forced,
			});

			await openAppStore();

			if (!decision.forced) {
				setAcceptedUpdate(decision.latestVersion);
			}
		} catch (error) {
			reportError(error, 'open_store');

			throw error;
		} finally {
			setStoreOpening(false);
		}
	}

	const dismissUpdatePrompt = () => {
		if (!decision || decision.forced) {
			return;
		}

		try {
			useDeviceSettingsStore.getState().dismissUpdate(decision.latestVersion);

			track('update_prompt_dismissed', { latest_version: decision.latestVersion });
		} catch (error) {
			reportError(error, 'dismiss_update');

			Alert.alert(t('app.update.error'));
		}
	};

	return {
		decision,
		updateVisible,
		updatesSettled,
		storeOpening,
		acceptUpdate,
		dismissUpdatePrompt,
	};
}
