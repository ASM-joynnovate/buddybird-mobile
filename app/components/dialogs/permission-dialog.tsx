import { Linking, StyleSheet, View } from 'react-native';

import type { PermissionDialogState } from '@/types/permission';

import { useTranslation } from 'react-i18next';

import { reportError } from '@/services/telemetry/client';

import ConfirmDialog from '@/components/dialogs/confirm-dialog';
import Mascot from '@/components/mascot';
import { Copy } from '@/components/ui/copy';

interface Props {
	state: PermissionDialogState;
	notice?: string;
}

/**
 * 권한 설정 안내 다이얼로그 컴포넌트
 * @param state 다이얼로그 상태
 * @param notice 권한 설명 아래에 표시할 문구
 */
const PermissionDialog = ({ state, notice }: Props) => {
	const { t } = useTranslation();

	const handleOpenSettings = () => {
		void Linking.openSettings().catch((error: unknown) => reportError(error, 'permission_settings'));
	};

	return (
		<ConfirmDialog
			visible={state.visible}
			text={{
				title: t('common.permission.title', { name: t(`common.permission.${state.kind}.name`) }),
				confirm: t('common.permission.openSettings'),
				cancel: t('common.close'),
			}}
			onConfirm={handleOpenSettings}
			onClose={state.onClose}
		>
			<View style={styles.reasonContainer}>
				<Mascot size={88} />
				<Copy style={styles.reason}>{t(`common.permission.${state.kind}.reason`)}</Copy>
				{!!notice && <Copy style={styles.reason}>{notice}</Copy>}
			</View>
		</ConfirmDialog>
	);
};

const styles = StyleSheet.create({
	reasonContainer: { alignItems: 'center', gap: 12 },
	reason: { textAlign: 'center', lineHeight: 22 },
});

export default PermissionDialog;
