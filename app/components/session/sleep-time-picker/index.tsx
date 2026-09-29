import type { SleepSettings } from '@/types/sleep-settings';

import { useTranslation } from 'react-i18next';

import { formatClock } from '@/i18n/format';

import { MoonIcon } from 'lucide-react-native';

import SleepTimeEditor from '@/components/session/sleep-time-picker/sleep-time-editor';
import { ItemPicker } from '@/components/ui/item/picker';

interface Props {
	value: SleepSettings | undefined;
	first?: boolean;
	onChange: (value: SleepSettings) => void;
}

/**
 * 수면 시간 선택 컴포넌트
 * @param value 수면 시간
 * @param first 목록의 첫 항목 여부
 * @param onChange 수면 시간 변경 시 실행할 함수
 */
const SleepTimePicker = ({ value, first, onChange }: Props) => {
	const { t } = useTranslation();

	return (
		<ItemPicker
			item={{
				first,
				icon: MoonIcon,
				label: t('session.sleep.label'),
				value: value
					? t('session.sleep.range', {
							sleep: formatClock(value.sleep_at),
							wake: formatClock(value.wake_at),
						})
					: undefined,
				disabled: !value,
			}}
			sheet={{ title: t('session.sleep.label'), description: t('session.sleep.description') }}
		>
			{(close) => (value ? <SleepTimeEditor value={value} onChange={onChange} onClose={close} /> : null)}
		</ItemPicker>
	);
};

export default SleepTimePicker;
