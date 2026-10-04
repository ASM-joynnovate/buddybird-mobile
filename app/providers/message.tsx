import type { ReactNode } from 'react';

import { useTranslation } from 'react-i18next';

import { useMessageStore } from '@/stores/message';

import Dialog from '@/components/dialogs/dialog';
import { Button } from '@/components/ui/button';
import { Copy } from '@/components/ui/copy';

interface Props {
	children: ReactNode;
}

/**
 * 메시지 다이얼로그 provider
 * @param children 감싸는 내용
 */
const MessageProvider = ({ children }: Props) => {
	const { t } = useTranslation();

	const message = useMessageStore((state) => state.message);
	const closePopup = useMessageStore((state) => state.closePopup);

	return (
		<>
			{children}

			<Dialog
				visible={message !== null}
				onClose={closePopup}
				title={message?.title ?? ''}
				footer=<Button label={t('common.done')} depth="high" onPress={closePopup} />
			>
				{!!message?.content && <Copy>{message.content}</Copy>}
			</Dialog>
		</>
	);
};

export default MessageProvider;
