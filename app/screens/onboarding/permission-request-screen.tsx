import { useCallback, useState } from 'react';

import { StyleSheet, View } from 'react-native';

import { usePrefetchQuery } from '@tanstack/react-query';

import type { RootStackParamList } from '@/types/navigation';

import { useUpdatePushToken } from '@/hooks/apis/devices';
import { getSettingsOptions } from '@/hooks/apis/settings';

import { useTranslation } from 'react-i18next';

import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BellIcon, type LucideIcon, MicIcon } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import PermissionScene from '@/screens/onboarding/components/permission-scene';
import SceneSheet from '@/screens/onboarding/components/scene-sheet';
import { type PermissionKind, readPermission, requestPermission } from '@/services/device/permissions';
import { readPushToken } from '@/services/push/registration';
import { reportError } from '@/services/telemetry/client';
import { trackOnboardingStepCompleted, trackOnboardingStepViewed } from '@/services/telemetry/onboarding';
import { colors, contentMaxWidth, font } from '@/theme';

import { Button } from '@/components/ui/button';
import { Copy } from '@/components/ui/copy';
import { ScreenHeader } from '@/components/ui/screen-header';
import { ui } from '@/components/ui/styles';

const PERMISSIONS: readonly { kind: 'microphone' | 'notifications'; icon: LucideIcon }[] = [
	{ kind: 'microphone', icon: MicIcon },
	{ kind: 'notifications', icon: BellIcon },
];

/** 권한을 요청하고 허용 여부를 반환하는 함수 */
const askPermission = async (kind: PermissionKind) => {
	try {
		return (await requestPermission(kind)).granted;
	} catch (e) {
		reportError(e, `permission_request_${kind}`);

		return false;
	}
};

/** 현재 권한 허용 여부를 반환하는 함수 */
const isGranted = async (kind: PermissionKind) => {
	try {
		return (await readPermission(kind)).granted;
	} catch (e) {
		reportError(e, `permission_read_${kind}`);

		return false;
	}
};

/** 권한 요청 화면 */
const PermissionRequestScreen = () => {
	const { t } = useTranslation();

	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

	usePrefetchQuery(getSettingsOptions());

	const { mutate } = useUpdatePushToken();

	const [busy, setBusy] = useState(false);

	/** 화면 진입 시 onboarding_step_viewed 이벤트 전송 */
	useFocusEffect(
		useCallback(() => {
			trackOnboardingStepViewed('permissions');
		}, []),
	);

	/** 권한 단계를 끝내는 함수 */
	const completePermissionStep = (microphoneGranted: boolean, notificationsGranted: boolean) => {
		trackOnboardingStepCompleted('permissions', {
			microphone_granted: microphoneGranted,
			notifications_granted: notificationsGranted,
		});

		navigation.navigate('MarketingNotification');
	};

	const handleAllow = async () => {
		if (busy) {
			return;
		}

		setBusy(true);

		const microphoneGranted = await askPermission('microphone');
		const notificationsGranted = await askPermission('notifications');

		if (notificationsGranted) {
			void readPushToken()
				.then((token) => {
					if (token) {
						mutate({ data: { token } }, { onError: (error) => reportError(error, 'push_token_register') });
					}
				})
				.catch((error) => reportError(error, 'push_token_register'));
		}

		setBusy(false);

		completePermissionStep(microphoneGranted, notificationsGranted);
	};

	const handleLater = async () => {
		completePermissionStep(await isGranted('microphone'), await isGranted('notifications'));
	};

	return (
		<View style={styles.container}>
			<SafeAreaView edges={['top', 'left', 'right']}>
				<View style={styles.header}>
					<ScreenHeader onBack={navigation.canGoBack() ? () => navigation.goBack() : undefined} />
				</View>
			</SafeAreaView>

			<PermissionScene />

			<SceneSheet
				title={t('onboarding.permissions.intro')}
				footer={
					<View style={ui.actionsRow}>
						<Button
							label={t('onboarding.permissions.later')}
							variant="secondary"
							size="small"
							disabled={busy}
							style={ui.action}
							onPress={() => void handleLater()}
						/>
						<Button
							label={t('onboarding.permissions.allow')}
							size="small"
							loading={busy}
							style={ui.action}
							onPress={() => void handleAllow()}
						/>
					</View>
				}
			>
				<View>
					{PERMISSIONS.map(({ kind, icon: Icon }, index) => (
						<View key={kind} style={[styles.permissionRow, index > 0 && styles.divider]}>
							<Icon size={22} color={colors.orangeDark} />
							<Copy style={styles.name}>{t(`common.permission.${kind}.name`)}</Copy>
							<Copy style={styles.purpose}>{t(`onboarding.permissions.purpose.${kind}`)}</Copy>
						</View>
					))}
				</View>
			</SceneSheet>
		</View>
	);
};

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: colors.orangePale },
	header: { width: '100%', maxWidth: contentMaxWidth, alignSelf: 'center', paddingHorizontal: 24, paddingTop: 20 },
	permissionRow: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
	divider: { borderTopWidth: 2, borderTopColor: colors.border },
	name: { minWidth: 44, fontFamily: font.extraBold, fontSize: 15 },
	purpose: { flex: 1, minWidth: 0, fontSize: 14, lineHeight: 20, color: colors.muted },
});

export default PermissionRequestScreen;
