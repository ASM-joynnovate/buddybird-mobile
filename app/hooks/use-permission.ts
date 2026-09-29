import { useCallback, useEffect, useRef, useState } from 'react';

import { AppState } from 'react-native';

import {
	type PermissionKind,
	type PermissionState,
	readPermission,
	requestPermission,
} from '@/services/device/permissions';
import { reportError } from '@/services/telemetry/client';

export interface PermissionDialogState {
	visible: boolean;
	kind: PermissionKind;
	onClose: () => void;
}

/** 권한 확인 후 동작을 실행하는 Hook */
const usePermission = (kind: PermissionKind) => {
	const [permissionState, setPermissionState] = useState<PermissionState | null>(null);
	const [dialogOpen, setDialogOpen] = useState(false);

	const pendingActionRef = useRef<(() => void) | null>(null);

	const dialog: PermissionDialogState = {
		visible: dialogOpen,
		kind,
		onClose: () => {
			pendingActionRef.current = null;
			setDialogOpen(false);
		},
	};

	/** 권한 상태 갱신 함수 */
	const refresh = useCallback(async () => {
		const permission = await readPermission(kind);

		setPermissionState(permission);

		return permission;
	}, [kind]);

	/** 앱으로 돌아오면 권한 상태 갱신 */
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

	/** 권한 확인 후 동작을 실행하는 함수 */
	const run = async (action: () => void) => {
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
	};

	return { granted: permissionState?.granted ?? null, refresh, run, dialog };
};

export default usePermission;
