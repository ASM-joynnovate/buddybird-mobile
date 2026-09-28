import { Image, StyleSheet, View } from 'react-native';

import type { FeedbackForm } from '@/hooks/use-feedback-form';

import { useTranslation } from 'react-i18next';

import { SendIcon } from 'lucide-react-native';

import { colors, font, mascot } from '@/theme';

import { Dialog } from '@/components/dialogs/dialog';
import { Button } from '@/components/ui/button';
import { InlineError } from '@/components/ui/inline-error';
import { ui } from '@/components/ui/styles';
import { Copy } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';

interface Props {
	visible: boolean;
	prompt?: { onDismiss(): void; onWrite(): void };
	form: FeedbackForm;
}

export function FeedbackDialog({ visible, prompt, form }: Props) {
	const { t } = useTranslation();

	if (form.sent) {
		return (
			<Dialog
				visible={visible}
				onClose={form.close}
				title={t('app.feedback.sent')}
				footer=<Button label={t('app.feedback.thanksClose')} onPress={form.close} style={styles.thanksClose} />
			>
				<Copy style={styles.promptMessage}>{t('app.feedback.thanks')}</Copy>
			</Dialog>
		);
	}

	if (prompt) {
		return (
			<Dialog
				visible={visible}
				onClose={prompt.onDismiss}
				title={t('app.feedback.promptTitle')}
				footer={
					<View style={[ui.actions, styles.actions]}>
						<Button
							label={t('app.feedback.later')}
							variant="secondary"
							onPress={prompt.onDismiss}
							style={ui.action}
						/>
						<Button label={t('app.feedback.write')} onPress={prompt.onWrite} style={ui.action} />
					</View>
				}
			>
				<Image
					accessible={false}
					source={mascot}
					style={styles.promptMascot}
					accessibilityIgnoresInvertColors
				/>
				<Copy style={styles.promptMessage}>{t('app.feedback.promptMessage')}</Copy>
			</Dialog>
		);
	}

	return (
		<Dialog
			visible={visible}
			onClose={form.close}
			title={t('app.feedback.title')}
			footer={
				<View style={[ui.actions, styles.actions]}>
					<Button
						label={t('common.cancel')}
						variant="secondary"
						disabled={form.busy}
						onPress={form.close}
						style={ui.action}
					/>
					<Button
						label={t(form.sendFailed ? 'app.feedback.retry' : 'app.feedback.send')}
						icon={SendIcon}
						disabled={!form.message.trim()}
						loading={form.busy}
						onPress={form.submit}
						style={ui.action}
					/>
				</View>
			}
		>
			<TextField
				accessibilityLabel={t('app.feedback.title')}
				value={form.message}
				onChangeText={form.setMessage}
				maxLength={1000}
				multiline
				editable={!form.busy}
				textAlignVertical="top"
				placeholder={t('app.feedback.placeholder')}
				style={styles.message}
			/>
			<Copy style={styles.privacy}>{t('app.feedback.privacy')}</Copy>
			<InlineError message={form.sendFailed ? t('app.feedback.error') : null} />
		</Dialog>
	);
}

const styles = StyleSheet.create({
	thanksClose: { marginTop: 0 },
	promptMascot: { width: 96, height: 96, resizeMode: 'contain', alignSelf: 'center' },
	promptMessage: { fontSize: 14, lineHeight: 20, textAlign: 'center', marginTop: 16 },
	actions: { marginTop: 0 },
	message: { minHeight: 160, fontFamily: font.bold, fontSize: 17, lineHeight: 26 },
	privacy: { fontSize: 14, lineHeight: 21, color: colors.muted, marginTop: 12 },
});
