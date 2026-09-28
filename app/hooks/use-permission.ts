import { useCallback, useEffect, useRef, useState } from 'react';

import { AppState } from 'react-native';

import {
	type PermissionKind,
	type PermissionState,
	readPermission,
	requestPermission,
} from '@/services/device/permissions';
import { reportError } from '@/services/telemetry/client';

export type PermissionDialogState = { visible: boolean; kind: PermissionKind; onClose(): void };

export function usePermission(kind: PermissionKind) {
	const [permissionState, setPermissionState] = useState<PermissionState | null>(null);
	const [dialogOpen, setDialogOpen] = useState(false);

	const pendingActionRef = useRef<(() => void) | null>(null);

	const refresh = useCallback(async () => {
		const permission = await readPermission(kind);

		setPermissionState(permission);

		return permission;
	}, [kind]);

	useEffect(() => {
		void refresh().catch((error: unknown) => reportError(error, `permission_${kind}`));

		const subscription = AppState.addEventListener('change', (appState) => {
			if (appState !== 'active') {
				return;
			}

			void refresh()
				.then((permission) => {
					const action = pendingActionRef.current;

					if (permission.granted && action) {
						pendingActionRef.current = null;
						setDialogOpen(false);

						action();
					}
				})
				.catch((error: unknown) => reportError(error, `permission_${kind}`));
		});

		return () => subscription.remove();
	}, [kind, refresh]);

	const run = useCallback(
		async (action: () => void) => {
			const permission = await readPermission(kind);

			if (permission.granted) {
				action();

				return;
			}

			if (permission.canAskAgain) {
				const requestedPermission = await requestPermission(kind);

				setPermissionState(requestedPermission);

				if (requestedPermission.granted) {
					action();
				}

				return;
			}

			pendingActionRef.current = action;
			setDialogOpen(true);
		},
		[kind],
	);

	const dialog: PermissionDialogState = {
		visible: dialogOpen,
		kind,
		onClose: () => {
			pendingActionRef.current = null;
			setDialogOpen(false);
		},
	};

	return { granted: permissionState?.granted ?? null, refresh, run, dialog };
}
