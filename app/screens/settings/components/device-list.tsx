import { FlatList, Platform, StyleSheet } from 'react-native';

import type { Device } from '@/types/apis/devices';
import type { Session } from '@/types/apis/sessions';

import { useGetDeviceList } from '@/hooks/apis/devices';
import { useGetRunningSession } from '@/hooks/apis/sessions';

import DeviceCard from '@/screens/settings/components/device-card';
import { useDeviceSettingsStore } from '@/stores/device-settings';

/** 연결된 기기 목록 변환 함수 */
const toLinkedDevices = (devices: readonly Device[], clientDeviceId: string | null, runningSession: Session | null) => {
	return devices.map((device) => ({
		id: device.id,
		model: device.client.model,
		lastSeenAt: device.last_seen_at,
		isThisDevice: device.client_device_id === clientDeviceId,
		isRunningSession: runningSession?.station.device_id === device.id,
	}));
};

/** 연결된 기기 목록 컴포넌트 */
const DeviceList = () => {
	const { data: deviceListData } = useGetDeviceList();
	const { data: runningSessionData } = useGetRunningSession();

	const clientDeviceId = useDeviceSettingsStore((state) => state.clientDeviceId);

	const linkedDevices = toLinkedDevices(deviceListData, clientDeviceId, runningSessionData);

	return (
		<FlatList
			data={linkedDevices}
			keyExtractor={(device) => device.id}
			removeClippedSubviews={Platform.OS === 'ios'}
			contentContainerStyle={styles.list}
			renderItem={({ item: device }) => <DeviceCard device={device} />}
		/>
	);
};

const styles = StyleSheet.create({
	list: { gap: 12, paddingBottom: 32 },
});

export default DeviceList;
