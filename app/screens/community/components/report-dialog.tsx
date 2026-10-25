import { useState } from 'react';

import { StyleSheet, View } from 'react-native';

import { type AbuseReportReason, abuseReportReasons } from '@/types/apis/abuse-reports';

import type { ReportTarget } from '@/types/community';

import { useSendAbuseReport } from '@/hooks/apis/abuse-reports';

import { useTranslation } from 'react-i18next';

import { apiErrorMessage } from '@/lib/api';

import { toast } from 'sonner-native';

import { ABUSE_REPORT_DESCRIPTION_LIMIT } from '@/config/policy';
import { RadioList } from '@/screens/community/components/radio-list';
import { useCommunityStore } from '@/stores/community';
import { font } from '@/theme';

import Dialog from '@/components/dialogs/dialog';
import { Button } from '@/components/ui/button';
import { ui } from '@/components/ui/styles';
import { TextField } from '@/components/ui/text-field';
import { dialogToasterId, Toast } from '@/components/ui/toast';

interface Props {
	reportTarget: ReportTarget;
}

/**
 * 신고 다이얼로그 컴포넌트
 * @param reportTarget 신고할 피드 항목
 */
const ReportDialog = ({ reportTarget }: Props) => {
	const { t } = useTranslation();

	const [reason, setReason] = useState<AbuseReportReason | null>(null);
	const [description, setDescription] = useState('');

	const { isPending, mutate } = useSendAbuseReport();

	const setReportTarget = useCommunityStore((state) => state.setReportTarget);

	const handleClose = () => {
		if (isPending) {
			return;
		}

		setReportTarget(null);
	};

	const handleSendReport = () => {
		if (isPending || !reason) {
			return;
		}

		mutate(
			{
				data: {
					reported_user_id: reportTarget.userId,
					feed_item_id: reportTarget.feedItemId,
					reason,
					description: description.trim() || undefined,
				},
			},
			{
				onSuccess: () => {
					setReportTarget(null);

					toast.custom(<Toast message={t('community.report.sent')} />);
				},
				onError: (error) => {
					toast.custom(<Toast variant="error" message={apiErrorMessage(error, t)} />, {
						toasterId: dialogToasterId,
					});
				},
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
