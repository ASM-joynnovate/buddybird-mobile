import type { RootStackParamList } from '@/types/navigation';

import { useTranslation } from 'react-i18next';

import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BellIcon, ImageIcon, type LucideIcon, MicIcon } from 'lucide-react-native';

import PermissionItem from '@/screens/settings/components/permission-item';
import type { PermissionKind } from '@/services/device/permissions';

import { ItemGroup } from '@/components/ui/item/group';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';

const PERMISSIONS: readonly { kind: PermissionKind; icon: LucideIcon }[] = [
	{ kind: 'microphone', icon: MicIcon },
	{ kind: 'notifications', icon: BellIcon },
	{ kind: 'photos', icon: ImageIcon },
];

/** 권한 상태 제목과 뒤로 가기 버튼, 마이크와 알림과 사진 권한의 허용 상태를 보여 주는 화면 */
const PermissionsScreen = () => {
	const { t } = useTranslation();

	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

	return (
		<Screen>
			{/*권한 상태 제목과 뒤로 가기 버튼*/}
			<ScreenHeader title={t('settings.permissions.title')} onBack={() => navigation.goBack()} />

			{/*권한 목록*/}
			<ItemGroup>
				{PERMISSIONS.map(({ kind, icon }, index) => (
					<PermissionItem key={kind} kind={kind} icon={icon} first={index === 0} />
				))}
			</ItemGroup>
		</Screen>
	);
};

export default PermissionsScreen;
