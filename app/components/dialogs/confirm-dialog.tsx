import type { PropsWithChildren } from 'react';

import { View } from 'react-native';

import { useTranslation } from 'react-i18next';

import { Dialog } from '@/components/dialogs/dialog';
import { Button } from '@/components/ui/button';
import { Copy } from '@/components/ui/copy';
import { InlineError } from '@/components/ui/inline-error';
import { ui } from '@/components/ui/styles';

interface Props {
	visible: boolean;
	text: { title: string; message?: string; confirm?: string; cancel?: string };
	confirmStatus?: { busy?: boolean; errorMessage?: string | null };
	onConfirm(): void;
	onClose(): void;
}

export function ConfirmDialog({
	visible,
	text,
	confirmStatus,
	onConfirm,
	onClose,
	children,
}: PropsWithChildren<Props>) {
	const { t } = useTranslation();

	const busy = confirmStatus?.busy ?? false;

	return (
		<Dialog
			visible={visible}
			title={text.title}
			onClose={busy ? () => {} : onClose}
			footer={
				<View style={ui.actions}>
					<Button
						label={text.cancel ?? t('common.cancel')}
						variant="secondary"
						size="small"
						disabled={busy}
						onPress={onClose}
						style={ui.action}
					/>
					<Button
						label={text.confirm ?? t('common.confirmDelete.confirm')}
						size="small"
						loading={busy}
						onPress={onConfirm}
						style={ui.action}
					/>
				</View>
			}
		>
			{/*안내 문구*/}
			{text.message ? <Copy>{text.message}</Copy> : null}
			{children}

			{/*실패 문구*/}
			<InlineError message={confirmStatus?.errorMessage} />
		</Dialog>
	);
}
