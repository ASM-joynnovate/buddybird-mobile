import { useUpdateCommunitySettings } from '@/hooks/apis/settings';

import { useTranslation } from 'react-i18next';

import { apiErrorMessage } from '@/lib/api';

import { toast } from 'sonner-native';

import ConfirmDialog from '@/components/dialogs/confirm-dialog';
import { Toast } from '@/components/ui/toast';

interface Props {
	visible: boolean;
	onClose: () => void;
}

/**
 * 피드 공개 동의 다이얼로그 컴포넌트
 * @param visible 다이얼로그 표시 여부
 * @param onClose 다이얼로그를 닫을 때 실행할 함수
 */
const FeedConsentDialog = ({ visible, onClose }: Props) => {
	const { t } = useTranslation();

	const { isPending, mutate } = useUpdateCommunitySettings();

	const handleConsent = () => {
		if (isPending) {
			return;
		}

		mutate(
			{ data: { feed_enabled: true } },
			{
				onError: (error) => {
					toast.custom(<Toast variant="error" message={apiErrorMessage(error, t)} />);
				},
			},
		);
	};

	return (
		<ConfirmDialog
			visible={visible}
			text={{
				title: t('community.feedConsent.title'),
				message: t('community.feedConsent.message'),
				confirm: t('community.feedConsent.confirm'),
			}}
			confirmBusy={isPending}
			onConfirm={handleConsent}
			onClose={onClose}
		/>
	);
};

export default FeedConsentDialog;
