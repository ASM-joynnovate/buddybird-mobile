import { StyleSheet, View } from 'react-native';

import type { Locale } from '@/types/locale';
import type { RootStackParamList } from '@/types/navigation';

import { invalidate } from '@/hooks/apis/invalidate';
import { apiKeys } from '@/hooks/apis/keys';

import { useTranslation } from 'react-i18next';

import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LockIcon, MessageSquareTextIcon, SmartphoneIcon } from 'lucide-react-native';

import { reportError, setUserProperties, track } from '@/services/telemetry/client';
import { useAccountStore } from '@/stores/account';
import { useDeviceSettingsStore } from '@/stores/device-settings';
import { colors, font } from '@/theme';

import { Chip } from '@/components/ui/chip';
import { Copy } from '@/components/ui/copy';
import { Item } from '@/components/ui/item';
import { ItemGroup } from '@/components/ui/item/group';

/** 앱 언어 선택, 연결된 기기와 권한 상태 항목을 보여 주고 누르면 앱 언어를 바꾸거나 해당 화면을 여는 컴포넌트 */
const GeneralGroup = () => {
	const { t } = useTranslation();

	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

	const isAnonymous = useAccountStore((state) => state.isAnonymous);

	const locale = useDeviceSettingsStore((state) => state.locale);
	const setLocale = useDeviceSettingsStore((state) => state.setLocale);

	/** 앱 언어 변경 */
	const handleChangeLanguage = (nextLocale: Locale) => {
		if (locale === nextLocale) {
			return;
		}

		try {
			setLocale(nextLocale);

			void invalidate(apiKeys.all());

			setUserProperties({ locale: nextLocale });
			track('language_changed', { from: locale, to: nextLocale });
		} catch (e) {
			reportError(e, 'change_language');
		}
	};

	return (
		<View>
			<ItemGroup title={t('settings.general.title')}>
				<View style={styles.languageRow}>
					<MessageSquareTextIcon size={22} color={colors.muted} />
					<Copy style={styles.label}>{t('settings.general.language')}</Copy>
					<Chip
						label={t('settings.general.korean')}
						selected={locale === 'ko-KR'}
						onPress={() => handleChangeLanguage('ko-KR')}
					/>
					<Chip
						label={t('settings.general.english')}
						selected={locale === 'en-US'}
						onPress={() => handleChangeLanguage('en-US')}
					/>
				</View>
				<Item
					icon={SmartphoneIcon}
					label={t('settings.general.devices')}
					onPress={() => navigation.navigate(isAnonymous ? 'Login' : 'Devices')}
				/>
				<Item
					icon={LockIcon}
					label={t('settings.general.permissions')}
					onPress={() => navigation.navigate('Permissions')}
				/>
			</ItemGroup>
		</View>
	);
};

const styles = StyleSheet.create({
	languageRow: {
		minHeight: 56,
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
		paddingHorizontal: 16,
		paddingVertical: 10,
	},
	label: { flex: 1, minWidth: 0, marginLeft: 4, fontFamily: font.extraBold, fontSize: 16 },
});

export default GeneralGroup;
