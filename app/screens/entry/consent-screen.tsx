import { useCallback } from 'react';

import { StyleSheet, View } from 'react-native';

import type { RootStackParamList } from '@/types/navigation';

import { useEntryRoute } from '@/hooks/use-entry-route';

import { useTranslation } from 'react-i18next';

import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useConsentChecks } from '@/screens/entry/hooks/use-consent-checks';
import { completeOnboardingStep, viewOnboardingStep } from '@/services/telemetry/onboarding';

import { BuddySays } from '@/components/buddy-says';
import { ConsentItem } from '@/components/consent-item';
import { Button } from '@/components/ui/button';
import { GroupedList } from '@/components/ui/grouped-list';
import { GroupedListCheckItem } from '@/components/ui/grouped-list/check-item';
import { InlineError } from '@/components/ui/inline-error';
import { Screen } from '@/components/ui/screen';
import { Card } from '@/components/ui/surface';

export function ConsentScreen() {
	const { t } = useTranslation();

	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

	const { route, parrotId } = useEntryRoute();

	const form = useConsentChecks(() => {
		completeOnboardingStep('consent');

		if (route !== 'Consent') {
			navigation.navigate('ParrotEditor', {
				parrotId: route === 'UsageGuide' ? parrotId : undefined,
				source: 'entry',
			});
		}
	});

	useFocusEffect(
		useCallback(() => {
			viewOnboardingStep('consent');
		}, []),
	);

	return (
		<Screen
			footer={
				<>
					<InlineError message={form.saveFailed ? t('common.saveErrorKept') : null} />
					<Button label={t('common.next')} disabled={!form.ready} loading={form.saving} onPress={form.save} />
				</>
			}
		>
			{/*안내 말풍선*/}
			<View style={styles.intro}>
				<BuddySays message={t('entry.consent.intro')} />
			</View>

			{/*동의 항목*/}
			<View style={styles.content}>
				<Card contentStyle={styles.allCard}>
					<GroupedListCheckItem
						first
						label={t('entry.consent.all')}
						checked={form.allChecked}
						disabled={form.saving}
						onToggle={form.toggleAll}
					/>
				</Card>

				<GroupedList>
					{form.consents.map((consent, index) => (
						<ConsentItem
							key={consent.id}
							first={index === 0}
							consent={consent}
							checked={form.isChecked(consent)}
							disabled={form.saving}
							actions={{
								toggle: () => form.toggle(consent),
								open: () =>
									navigation.navigate('ConsentDetail', {
										consentId: consent.id,
										source: 'entry',
									}),
							}}
						/>
					))}
				</GroupedList>
			</View>
		</Screen>
	);
}

const styles = StyleSheet.create({
	intro: { flexGrow: 1, paddingBottom: 28 },
	content: { gap: 20 },
	allCard: { padding: 0 },
});
