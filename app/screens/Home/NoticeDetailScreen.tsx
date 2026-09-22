import { type RouteProp, useNavigation, useRoute } from "@react-navigation/native"
import { useMutation, useQuery } from "@tanstack/react-query"
import { randomUUID } from "expo-crypto"
import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import { Image, StyleSheet, View } from "react-native"

import { ScreenHeader } from "@/components/ui/header"
import { Screen } from "@/components/ui/screen"
import { ScreenError, Skeleton } from "@/components/ui/states"
import { Copy, Title } from "@/components/ui/text"
import { noticeQueryOptions, readNoticeMutationOptions } from "@/hooks/apis/notices"
import { useDeviceSetting } from "@/hooks/use-device-setting"
import { formatDate } from "@/i18n/format"
import { colors, radius } from "@/theme"
import type { RootStackParamList } from "@/types/navigation"

export function NoticeDetailScreen() {
	const { t } = useTranslation()
	const navigation = useNavigation()
	const { params } = useRoute<RouteProp<RootStackParamList, "NoticeDetail">>()
	const locale = useDeviceSetting("locale")
	const notice = useQuery(noticeQueryOptions(params.noticeId))
	const { mutate } = useMutation(readNoticeMutationOptions())
	const alreadyRead = notice.data?.is_read

	useEffect(() => {
		if (alreadyRead === false) {
			mutate({ id: params.noticeId, idempotencyKey: randomUUID() })
		}
	}, [alreadyRead, mutate, params.noticeId])

	let body = <Skeleton rows={3} />

	if (notice.isError) {
		body = <ScreenError message={t("common.loadError")} onRetry={() => void notice.refetch()} />
	} else if (notice.data) {
		body = (
			<View style={styles.body}>
				<View style={styles.heading}>
					<Title>{notice.data.title}</Title>
					<Copy style={styles.date}>{formatDate(notice.data.starts_at, locale)}</Copy>
				</View>
				{notice.data.body ? <Copy style={styles.text}>{notice.data.body}</Copy> : null}
				{notice.data.images.map((image, index) => (
					<Image
						key={`${image.url}-${index}`}
						source={{ uri: image.url }}
						style={styles.image}
						resizeMode="contain"
						accessibilityIgnoresInvertColors
						accessibilityLabel={t("home.notice.image", { index: index + 1 })}
					/>
				))}
			</View>
		)
	}

	return (
		<Screen>
			<ScreenHeader onBack={() => navigation.goBack()} />
			{body}
		</Screen>
	)
}

const styles = StyleSheet.create({
	body: { gap: 20 },
	heading: { gap: 6 },
	date: { fontSize: 13, color: colors.muted },
	text: { lineHeight: 24 },
	image: {
		width: "100%",
		aspectRatio: 4 / 3,
		borderRadius: radius.card,
		backgroundColor: colors.surface,
	},
})
