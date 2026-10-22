import { useState } from 'react';

import { StyleSheet, View } from 'react-native';

import { type AbuseReportReason, abuseReportReasons } from '@/types/apis/abuse-reports';
import type { FeedItem } from '@/types/apis/feed';

import { useSendAbuseReport } from '@/hooks/apis/abuse-reports';

import { useTranslation } from 'react-i18next';

import { apiErrorMessage } from '@/lib/api';

import { toast } from 'sonner-native';

import { ABUSE_REPORT_DESCRIPTION_LIMIT } from '@/config';
import { useCommunityStore } from '@/stores/community';
import { useMessageStore } from '@/stores/message';
import { font } from '@/theme';

import Dialog from '@/components/dialogs/dialog';
import { Button } from '@/components/ui/button';
import { RadioList } from '@/components/ui/radio-list';
import { ui } from '@/components/ui/styles';
import { TextField } from '@/components/ui/text-field';
import { Toast } from '@/components/ui/toast';

interface Props {
	feedItem: FeedItem;
}

/**
 * 신고 다이얼로그 컴포넌트
 * @param feedItem 신고할 피드 항목
 */
const ReportDialog = ({ feedItem }: Props) => {
	const { t } = useTranslation();

	const [reason, setReason] = useState<AbuseReportReason | null>(null);
	const [description, setDescription] = useState('');

	const { isPending, mutate } = useSendAbuseReport();

	const setFeedItemToReport = useCommunityStore((state) => state.setFeedItemToReport);

	const openPopup = useMessageStore((state) => state.openPopup);

	const handleClose = () => {
		if (isPending) {
			return;
		}

		setFeedItemToReport(null);
	};

	const handleSendReport = () => {
		if (isPending || !reason) {
			return;
		}

		mutate(
			{
				data: {
					reported_user_id: feedItem.user.id,
					feed_item_id: feedItem.id,
					reason,
					description: description.trim() || undefined,
				},
			},
			{
				onSuccess: () => {
					setFeedItemToReport(null);

					toast.custom(<Toast message={t('community.report.sent')} />);
				},
				onError: (error) => openPopup({ title: apiErrorMessage(error, t) }),
			},
		);
	};

	return (
		<Dialog
			visible
			onClose={handleClose}
			title={t('community.report.title')}
			footer={
				<View style={ui.actionsRow}>
					<Button
						label={t('common.cancel')}
						variant="secondary"
						size="small"
						disabled={isPending}
						depth="high"
						onPress={handleClose}
						style={ui.action}
					/>
					<Button
						label={t('community.report.action')}
						size="small"
						disabled={!reason}
						loading={isPending}
						depth="high"
						onPress={handleSendReport}
						style={ui.action}
					/>
				</View>
			}
		>
			<RadioList
				options={abuseReportReasons.map((value) => ({ value, label: t(`community.report.reasons.${value}`) }))}
				selectedValue={reason}
				onSelect={setReason}
			/>
			<TextField
				accessibilityLabel={t('community.report.description')}
				value={description}
				onChangeText={setDescription}
				maxLength={ABUSE_REPORT_DESCRIPTION_LIMIT}
				multiline
				editable={!isPending}
				textAlignVertical="top"
				placeholder={t('community.report.description')}
				style={styles.descriptionInput}
			/>
		</Dialog>
	);
};

const styles = StyleSheet.create({
	descriptionInput: { minHeight: 72, fontFamily: font.bold, fontSize: 14, lineHeight: 20 },
});

export default ReportDialog;
