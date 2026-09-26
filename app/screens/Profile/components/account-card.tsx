import { useTranslation } from "react-i18next"

import { ProfileCard } from "@/components/ui/profile-card"
import type { User } from "@/types/apis/users"
import { joinLabel } from "@/utils/a11y"

interface Props {
	user: User
	onPress(): void
}

export function AccountCard({ user, onPress }: Props) {
	const { t } = useTranslation()

	const nickname = user.nickname ?? t("profile.nicknameMissing")

	return (
		<ProfileCard
			avatar={{ uri: user.photo?.url, icon: "profile", size: "large" }}
			title={{ text: nickname, accent: !user.nickname }}
			details={[user.email]}
			label={joinLabel(t("profile.editAccount"), nickname, user.email)}
			onPress={onPress}
		/>
	)
}
