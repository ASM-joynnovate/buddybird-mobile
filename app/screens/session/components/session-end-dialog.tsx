import { StyleSheet, View } from 'react-native';

import { useTranslation } from 'react-i18next';

import ConfirmDialog from '@/components/dialogs/confirm-dialog';
import Mascot from '@/components/mascot';
import { Copy } from '@/components/ui/copy';

interface Props {
	visible: boolean;
	sessionFinishing: boolean;
	onConfirm: () => void;
	onClose: () => void;
}

/**
 * 학습 종료 확인 다이얼로그 컴포넌트
 * @param visible 다이얼로그 표시 여부
 * @param sessionFinishing 학습 종료 요청 중 여부
 * @param onConfirm 종료 버튼을 누를 때 실행할 함수
 * @param onClose 다이얼로그를 닫을 때 실행할 함수
 */
const SessionEndDialog = ({ visible, sessionFinishing, onConfirm, onClose }: Props) => {
	const { t } = useTranslation();

	return (
		<ConfirmDialog
			visible={visible}
			text={{
				title: t('session.end.title'),
				confirm: t('session.end.button'),
				cancel: t('session.end.keep'),
			}}
			confirmBusy={sessionFinishing}
			onConfirm={onConfirm}
			onClose={onClose}
		>
			<View style={styles.messageContainer}>
				<Mascot size={88} />
				<Copy style={styles.message}>{t('session.end.message')}</Copy>
			</View>
		</ConfirmDialog>
	);
};

const styles = StyleSheet.create({
	messageContainer: { alignItems: 'center', gap: 12 },
	message: { textAlign: 'center', lineHeight: 22 },
});

export default SessionEndDialog;
