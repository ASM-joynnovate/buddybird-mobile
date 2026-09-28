import usePermission from '@/hooks/use-permission';

import { useTranslation } from 'react-i18next';

import { CheckIcon, type LucideIcon } from 'lucide-react-native';

import type { PermissionKind } from '@/services/device/permissions';
import { reportError } from '@/services/telemetry/client';
import { colors } from '@/theme';

import PermissionDialog from '@/components/dialogs/permission-dialog';
import { Item } from '@/components/ui/item';

interface Props {
	kind: PermissionKind;
	icon: LucideIcon;
	first: boolean;
}

/**
 * 권한 이름과 허용 상태를 보여 주고 허용되지 않은 권한을 누르면 권한을 요청하는 컴포넌트
 * @param kind 권한 종류
 * @param icon 권한 아이콘
 * @param first 그룹의 첫 항목 여부
 */
const PermissionItem = ({ kind, icon, first }: Props) => {
	const { t } = useTranslation();

	const permission = usePermission(kind);

	let statusText = t('settings.permissions.checking');

	if (permission.granted !== null) {
		statusText = t(permission.granted ? 'settings.permissions.granted' : 'settings.permissions.denied');
	}

	/** 권한 요청과 허용된 뒤 권한 상태 다시 읽기 */
	const handleRequestPermission = () => {
		void permission
			.run(() => void permission.refresh())
			.catch((error: unknown) => reportError(error, `permission_${kind}`));
	};

	return (
		<>
			{/*권한 이름과 허용 상태*/}
			<Item
				first={first}
				icon={icon}
				label={t(`common.permission.${kind}.name`)}
				value={statusText}
				disabled={permission.granted !== false}
				trailing={permission.granted ? <CheckIcon size={18} color={colors.orange} /> : undefined}
				onPress={handleRequestPermission}
			/>

			{/*설정에서 권한을 켜도록 안내하는 다이얼로그*/}
			<PermissionDialog state={permission.dialog} />
		</>
	);
};

export default PermissionItem;
