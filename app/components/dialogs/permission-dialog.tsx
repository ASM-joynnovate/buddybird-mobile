import { Linking, StyleSheet, View } from 'react-native';

import type { PermissionDialogState } from '@/hooks/use-permission';

import { useTranslation } from 'react-i18next';

import { reportError } from '@/services/telemetry/client';

import Dialog from '@/components/dialogs/dialog';
import Mascot from '@/components/mascot';
import { Button } from '@/components/ui/button';
import { Copy } from '@/components/ui/copy';
import { ui } from '@/components/ui/styles';

interface Props {
	state: PermissionDialogState;
}

/**
 * 권한이 필요한 이유와 설정 열기 버튼을 보여 주고 누르면 앱 설정 화면을 여는 다이얼로그 컴포넌트
 * @param state 다이얼로그 표시 여부, 권한 종류, 닫을 때 실행할 함수
 */
const PermissionDialog = ({ state }: Props) => {
	const { t } = useTranslation();

	/** 앱 설정 화면 열기 */
	const handleOpenSettings = () => {
		void Linking.openSettings().catch((error: unknown) => reportError(error, 'permission_settings'));
	};

	return (
		<Dialog
			visible={state.visible}
			title={t('common.permission.title', {
				name: t(`common.permission.${state.kind}.name`),
			})}
			onClose={state.onClose}
			footer={
				<View style={ui.actionsRow}>
					<Button
						label={t('common.close')}
						variant="secondary"
						size="small"
						onPress={state.onClose}
						style={ui.action}
					/>
					<Button
						label={t('common.permission.openSettings')}
						size="small"
						onPress={handleOpenSettings}
						style={ui.action}
					/>
				</View>
			}
		>
			<View style={styles.reasonContainer}>
				<Mascot size={88} />
				<Copy style={styles.reason}>{t(`common.permission.${state.kind}.reason`)}</Copy>
			</View>
		</Dialog>
	);
};

const styles = StyleSheet.create({
	reasonContainer: { alignItems: 'center', gap: 12 },
	reason: { textAlign: 'center', lineHeight: 22 },
});

export default PermissionDialog;
