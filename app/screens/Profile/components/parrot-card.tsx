import { useTranslation } from "react-i18next"

import { ProfileCard } from "@/components/ui/profile-card"
import { isSpeciesId } from "@/services/profile/species"
import type { Parrot } from "@/types/apis/parrots"
import { joinLabel } from "@/utils/a11y"
import { ageMonths } from "@/utils/date"
import { MONTHS_PER_YEAR } from "@/utils/units"

interface Props {
	parrot: Parrot
	onPress(): void
}

export function ParrotCard({ parrot, onPress }: Props) {
	const { t } = useTranslation()

	const months = ageMonths(parrot.birthdate)
	const species = isSpeciesId(parrot.species)
		? t(`parrot.speciesNames.${parrot.species}`)
		: parrot.species
	let age: string | null = null

	if (months !== null) {
		age =
			months < MONTHS_PER_YEAR
				? t("profile.ageMonths", { count: months })
				: t("profile.ageYears", { count: Math.floor(months / MONTHS_PER_YEAR) })
	}

	return (
		<ProfileCard
			avatar={{ uri: parrot.photo?.url, icon: "photo", size: "medium" }}
			title={{ text: parrot.name }}
			details={[species, age]}
			label={joinLabel(t("profile.openParrot", { name: parrot.name }), species, age)}
			onPress={onPress}
		/>
	)
}
