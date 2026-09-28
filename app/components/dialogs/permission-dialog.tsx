import { Linking, StyleSheet, View } from 'react-native';

import type { PermissionDialogState } from '@/hooks/use-permission';

import { useTranslation } from 'react-i18next';

import { reportError } from '@/services/telemetry/client';

import { Dialog } from '@/components/dialogs/dialog';
import { Mascot } from '@/components/mascot';
import { Button } from '@/components/ui/button';
import { Copy } from '@/components/ui/copy';
import { ui } from '@/components/ui/styles';

interface Props {
	state: PermissionDialogState;
}

export function PermissionDialog({ state }: Props) {
	const { t } = useTranslation();

	return (
		<Dialog
			visible={state.visible}
			title={t('common.permission.title', {
				name: t(`common.permission.${state.kind}.name`),
			})}
			onClose={state.onClose}
			footer={
				<View style={ui.actions}>
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
						onPress={() =>
							void Linking.openSettings().catch((error: unknown) =>
								reportError(error, 'permission_settings'),
							)
						}
						style={ui.action}
					/>
				</View>
			}
		>
			<View style={styles.body}>
				<Mascot size={88} />
				<Copy style={styles.reason}>{t(`common.permission.${state.kind}.reason`)}</Copy>
			</View>
		</Dialog>
	);
}

const styles = StyleSheet.create({
	body: { alignItems: 'center', gap: 12 },
	reason: { textAlign: 'center', lineHeight: 22 },
});
