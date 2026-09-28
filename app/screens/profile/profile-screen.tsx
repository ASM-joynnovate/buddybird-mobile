import { type CompositeNavigationProp, useNavigation } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { useQuery } from "@tanstack/react-query"
import { PlusIcon, SettingsIcon } from "lucide-react-native"
import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"

import { Button } from "@/components/ui/button"
import { IconButton } from "@/components/ui/icon-button"
import { Screen } from "@/components/ui/screen"
import { ScreenError } from "@/components/ui/screen-error"
import { ScreenHeader } from "@/components/ui/screen-header"
import { Skeleton } from "@/components/ui/skeleton"
import { ui } from "@/components/ui/styles"
import { Copy } from "@/components/ui/text"
import { parrotsQueryOptions } from "@/hooks/apis/parrots"
import { meQueryOptions } from "@/hooks/apis/users"
import { AccountCard } from "@/screens/profile/components/account-card"
import { ParrotCard } from "@/screens/profile/components/parrot-card"
import { useAccountStore } from "@/stores/account"
import type { ProfileStackParamList, RootStackParamList } from "@/types/navigation"

type Navigation = CompositeNavigationProp<
	NativeStackNavigationProp<ProfileStackParamList, "Profile">,
	NativeStackNavigationProp<RootStackParamList>
>

export function ProfileScreen() {
	const { t } = useTranslation()

	const navigation = useNavigation<Navigation>()

	const isAnonymous = useAccountStore((account) => account.isAnonymous)

	const me = useQuery(meQueryOptions())
	const parrots = useQuery(parrotsQueryOptions())

	function body() {
		if (me.isError || parrots.isError) {
			return (
				<ScreenError
					message={t("common.loadError")}
					onRetry={() => {
						void me.refetch()
						void parrots.refetch()
					}}
				/>
			)
		}

		if (!me.data || !parrots.data) {
			return <Skeleton rows={3} height={96} />
		}

		return (
			<>
				<AccountCard user={me.data} onPress={() => navigation.navigate("AccountEditor")} />
				{isAnonymous ? (
					<Button
						label={t("auth.signIn")}
						variant="secondary"
						onPress={() => navigation.navigate("Login")}
						style={styles.signIn}
					/>
				) : null}
				<View style={ui.section}>
					<Copy accessibilityRole="header" style={ui.sectionTitle}>
						{t("profile.parrots")}
					</Copy>
					<View style={styles.parrots}>
						{parrots.data.map((parrot) => (
							<ParrotCard
								key={parrot.id}
								parrot={parrot}
								onPress={() =>
									navigation.navigate("ParrotEditor", { parrotId: parrot.id })
								}
							/>
						))}
					</View>
					<Button
						label={t("profile.addParrot")}
						icon={PlusIcon}
						variant="secondary"
						onPress={() => navigation.navigate("ParrotEditor")}
						style={styles.add}
					/>
				</View>
			</>
		)
	}

	return (
		<Screen>
			<ScreenHeader
				large
				title={t("profile.title")}
				right=<IconButton
					icon={SettingsIcon}
					label={t("profile.settings")}
					onPress={() => navigation.navigate("Settings")}
				/>
			/>
			{body()}
		</Screen>
	)
}

const styles = StyleSheet.create({
	parrots: { gap: 12 },
	add: { marginTop: 16 },
	signIn: { marginTop: 12 },
})
