import { useNavigation } from "@react-navigation/native"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"

import type { RootStackParamList } from "@/types/navigation"
import { useFeedbackDialog } from "@/hooks/use-feedback-dialog"
import { Button } from "@/components/ui/button"

export function ProfileActions() {
	const { t } = useTranslation()
	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
	const feedback = useFeedbackDialog()

	return (
		<View style={styles.actions}>
			<Button
				testID="profile-edit"
				label={t("profile.edit")}
				variant="secondary"
				onPress={() => navigation.navigate("ProfileEditor")}
				style={styles.action}
			/>
			<Button
				testID="profile-feedback"
				label={t("profile.feedback")}
				variant="secondary"
				onPress={() => feedback.open("profile")}
				style={styles.action}
			/>
		</View>
	)
}

const styles = StyleSheet.create({
	actions: { flexDirection: "row", gap: 10, marginTop: 24 },
	action: { flex: 1 },
})
