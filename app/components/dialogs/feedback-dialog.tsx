import { useState } from 'react';

import { Image, StyleSheet, View } from 'react-native';

import { ApiError } from '@/types/apis/common';

import { useSendFeedback } from '@/hooks/apis/feedback';

import { useTranslation } from 'react-i18next';

import { randomUUID } from 'expo-crypto';
import { SendIcon } from 'lucide-react-native';

import { FEEDBACK_MESSAGE_LIMIT } from '@/config';
import { track } from '@/services/telemetry/client';
import { useFeedbackStore } from '@/stores/feedback';
import { colors, font, mascotImage } from '@/theme';

import Dialog from '@/components/dialogs/dialog';
import { Button } from '@/components/ui/button';
import { Copy } from '@/components/ui/copy';
import { InlineError } from '@/components/ui/inline-error';
import { ui } from '@/components/ui/styles';
import { TextField } from '@/components/ui/text-field';

interface Props {
	visible: boolean;
	prompt?: { onDismiss: () => void; onWrite: () => void };
}

/**
 * 피드백 보내기 다이얼로그 컴포넌트
 * @param visible 다이얼로그 표시 여부
 * @param prompt 피드백 요청 안내의 버튼을 누를 때 실행할 함수
 */
const FeedbackDialog = ({ visible, prompt }: Props) => {
	const { t } = useTranslation();

	const [message, setMessage] = useState('');
	const [idempotencyKey, setIdempotencyKey] = useState(() => randomUUID());

	const { isError, isPending, isSuccess, mutate, reset } = useSendFeedback();

	const openedFrom = useFeedbackStore((state) => state.openedFrom);
	const closeFeedback = useFeedbackStore((state) => state.closeFeedback);

	const handleClose = () => {
		if (isPending) {
			return;
		}

		reset();

		setMessage('');
		setIdempotencyKey(randomUUID());

		closeFeedback();
	};

	const handleSubmit = () => {
		if (isPending || !message.trim()) {
			return;
		}

		mutate(
			{ data: { message: message.trim() }, idempotencyKey },
			{
				onSuccess: () => {
					track('feedback_submitted', {
						source: openedFrom ?? 'profile',
						message_length: message.trim().length,
					});

					setMessage('');
					setIdempotencyKey(randomUUID());
				},
				onError: (error) => {
					if (error instanceof ApiError && error.rejected) {
						setIdempotencyKey(randomUUID());
					}
				},
			},
		);
	};

	if (isSuccess) {
		return (
			<Dialog
				visible={visible}
				onClose={handleClose}
				title={t('app.feedback.sentTitle')}
				footer=<Button label={t('common.done')} depth="high" onPress={handleClose} style={styles.thanksClose} />
			>
				<Copy style={styles.centeredMessage}>{t('app.feedback.sentMessage')}</Copy>
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
					<View style={[ui.actionsRow, styles.actionsRow]}>
						<Button
							label={t('common.close')}
							variant="secondary"
							depth="high"
							onPress={prompt.onDismiss}
							style={ui.action}
						/>
						<Button
							label={t('app.feedback.write')}
							depth="high"
							onPress={prompt.onWrite}
							style={ui.action}
						/>
					</View>
				}
			>
				<Image
					accessible={false}
					source={mascotImage}
					style={styles.promptMascot}
					accessibilityIgnoresInvertColors
				/>
				<Copy style={styles.centeredMessage}>{t('app.feedback.promptMessage')}</Copy>
			</Dialog>
		);
	}

	return (
		<Dialog
			visible={visible}
			onClose={handleClose}
			title={t('app.feedback.title')}
			footer={
				<View style={[ui.actionsRow, styles.actionsRow]}>
					<Button
						label={t('common.cancel')}
						variant="secondary"
						disabled={isPending}
						depth="high"
						onPress={handleClose}
						style={ui.action}
					/>
					<Button
						label={t(isError ? 'app.feedback.retry' : 'app.feedback.send')}
						icon={SendIcon}
						disabled={!message.trim()}
						loading={isPending}
						depth="high"
						onPress={handleSubmit}
						style={ui.action}
					/>
				</View>
			}
		>
			<TextField
				accessibilityLabel={t('app.feedback.title')}
				value={message}
				onChangeText={setMessage}
				maxLength={FEEDBACK_MESSAGE_LIMIT}
				multiline
				editable={!isPending}
				textAlignVertical="top"
				placeholder={t('app.feedback.placeholder')}
				style={styles.message}
			/>
			<Copy style={styles.privacy}>{t('app.feedback.privacy')}</Copy>

			<InlineError message={isError ? t('app.feedback.sendError') : null} />
		</Dialog>
	);
};

const styles = StyleSheet.create({
	thanksClose: { marginTop: 0 },
	promptMascot: { width: 96, height: 96, resizeMode: 'contain', alignSelf: 'center' },
	centeredMessage: { fontSize: 14, lineHeight: 20, textAlign: 'center', marginTop: 16 },
	actionsRow: { marginTop: 0 },
	message: { minHeight: 160, fontFamily: font.bold, fontSize: 17, lineHeight: 26 },
	privacy: { fontSize: 14, lineHeight: 21, color: colors.muted, marginTop: 12 },
});

export default FeedbackDialog;
