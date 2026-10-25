export type PermissionKind = 'microphone' | 'notifications' | 'photos' | 'camera';

export interface PermissionState {
	granted: boolean;
	canAskAgain: boolean;
}

export interface PermissionDialogState {
	visible: boolean;
	kind: PermissionKind;
	onClose: () => void;
}
