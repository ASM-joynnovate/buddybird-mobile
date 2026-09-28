import { FlatList, StyleSheet } from 'react-native';

import { useDevices } from '@/hooks/use-devices';

import { DeviceCard } from '@/screens/settings/components/device-card';

/** 기기 목록 컴포넌트 */
const DeviceList = () => {
	const { linkedDevices } = useDevices();

	return (
		<FlatList
			data={linkedDevices}
			keyExtractor={(device) => device.id}
			contentContainerStyle={styles.list}
			renderItem={({ item: device }) => <DeviceCard device={device} />}
		/>
	);
};

const styles = StyleSheet.create({
	list: { gap: 12, paddingBottom: 32 },
});

export default DeviceList;
