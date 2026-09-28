import { StyleSheet, View } from 'react-native';

import { useTranslation } from 'react-i18next';

import { BookOpenIcon, MegaphoneIcon, SendIcon } from 'lucide-react-native';

import { installedVersion } from '@/services/device/application';
import { colors } from '@/theme';

import { GroupedList } from '@/components/ui/grouped-list';
import { GroupedListNavItem } from '@/components/ui/grouped-list/nav-item';
import { Copy } from '@/components/ui/text';

interface Props {
	unreadNotice: boolean;
	onFeedback(): void;
	onOpenNotices(): void;
	onOpenConsents(): void;
}

export function SupportGroup({ unreadNotice, onFeedback, onOpenNotices, onOpenConsents }: Props) {
	const { t } = useTranslation();

	return (
		<View>
			<GroupedList title={t('settings.support.title')}>
				<GroupedListNavItem first icon={SendIcon} label={t('settings.support.feedback')} onPress={onFeedback} />
				<GroupedListNavItem
					icon={MegaphoneIcon}
					label={t('settings.support.notices')}
					value={unreadNotice ? t('settings.support.unreadNotice') : undefined}
					dot={unreadNotice}
					onPress={onOpenNotices}
				/>
				<GroupedListNavItem
					icon={BookOpenIcon}
					label={t('settings.support.consents')}
					onPress={onOpenConsents}
				/>
			</GroupedList>
			<Copy style={styles.version}>{t('settings.support.version', { version: installedVersion })}</Copy>
		</View>
	);
}

const styles = StyleSheet.create({
	version: { marginTop: 12, fontSize: 13, color: colors.muted, textAlign: 'right' },
});
