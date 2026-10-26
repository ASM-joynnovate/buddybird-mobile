import { StyleSheet, View } from 'react-native';

import {
	useCancelSessionEventReview,
	useCancelSessionSoundReview,
	useReviewSessionEvent,
	useReviewSessionSound,
} from '@/hooks/apis/sessions';

import { useTranslation } from 'react-i18next';

import { apiErrorMessage } from '@/lib/api';

import { CheckIcon, XIcon } from 'lucide-react-native';
import { toast } from 'sonner-native';

import type { LogItem } from '@/screens/report/utils/session-log';

import { Button } from '@/components/ui/button';
import { Toast } from '@/components/ui/toast';

interface Props {
	logItem: LogItem;
	sessionId: string;
}

/**
 * 판정이 맞았는지 선택하는 컴포넌트
 * @param logItem 기록
 * @param sessionId 세션 ID
 */
const SessionLogReview = ({ logItem, sessionId }: Props) => {
	const { t } = useTranslation();

	const reviewSessionSound = useReviewSessionSound();
	const cancelSessionSoundReview = useCancelSessionSoundReview();
	const reviewSessionEvent = useReviewSessionEvent();
	const cancelSessionEventReview = useCancelSessionEventReview();

	const isSoundItem = logItem.kind === 'parrot' || logItem.kind === 'mimic';
	const reviewIsCorrect = logItem.userReview?.is_correct;
	const reviewSaving =
		reviewSessionSound.isPending ||
		cancelSessionSoundReview.isPending ||
		reviewSessionEvent.isPending ||
		cancelSessionEventReview.isPending;

	const handleSelectReview = (isCorrect: boolean) => {
		if (reviewSaving) {
			return;
		}

		const callbacks = {
			onError: (error: unknown) => {
				toast.custom(<Toast variant="error" message={apiErrorMessage(error, t)} />);
			},
		};

		// 선택된 버튼을 다시 누르면 취소
		if (reviewIsCorrect === isCorrect) {
			if (isSoundItem) {
				cancelSessionSoundReview.mutate({ id: sessionId, soundId: logItem.id }, callbacks);
			} else {
				cancelSessionEventReview.mutate({ id: sessionId, eventId: logItem.id }, callbacks);
			}

			return;
		}

		const data = { is_correct: isCorrect };

		if (isSoundItem) {
			reviewSessionSound.mutate({ id: sessionId, soundId: logItem.id, data }, callbacks);
		} else {
			reviewSessionEvent.mutate({ id: sessionId, eventId: logItem.id, data }, callbacks);
		}
	};

	return (
		<View style={styles.review}>
			<Button
				label={t('report.detail.reviewWrong')}
				icon={XIcon}
				variant={reviewIsCorrect === false ? 'danger' : 'secondary'}
				size="small"
				accessibilityState={{ selected: reviewIsCorrect === false, busy: reviewSaving }}
				onPress={() => handleSelectReview(false)}
				style={styles.button}
			/>
			<Button
				label={t('report.detail.reviewCorrect')}
				icon={CheckIcon}
				variant={reviewIsCorrect === true ? 'success' : 'secondary'}
				size="small"
				accessibilityState={{ selected: reviewIsCorrect === true, busy: reviewSaving }}
				onPress={() => handleSelectReview(true)}
				style={styles.button}
			/>
		</View>
	);
};

const styles = StyleSheet.create({
	review: { flexDirection: 'row', gap: 10, marginTop: 14 },
	button: { flex: 1 },
});

export default SessionLogReview;
