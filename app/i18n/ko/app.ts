import type { AppMessages } from "@/i18n/types/app"

export const app: AppMessages = {
	startup: {
		loading: "저장된 데이터를 준비하고 있어요",
		title: "데이터를 불러오지 못했어요",
		message: "원본 데이터는 보존되어 있어요. 다시 시도하면 이어서 준비할 수 있습니다.",
		retry: "다시 시도",
	},
	apiError: {
		AUTH__INVALID_TOKEN: "로그인이 만료되었어요. 다시 로그인해 주세요.",
		AUTH__INVALID_PROVIDER_CREDENTIAL:
			"소셜 로그인 정보를 확인하지 못했어요. 다시 로그인해 주세요.",
		AUTH__PROVIDER_CREDENTIAL_REQUIRED: "소셜 로그인 정보가 필요해요. 다시 로그인해 주세요.",
		AUTH__SERVICE_UNAVAILABLE:
			"로그인 서비스를 잠시 사용할 수 없어요. 잠시 후 다시 시도해 주세요.",
		CLIENT__NETWORK: "버디버드에 연결하지 못했어요. 연결을 확인한 뒤 다시 시도해 주세요.",
		CLIENT__TIMEOUT: "응답이 너무 늦어요. 연결을 확인한 뒤 다시 시도해 주세요.",
		CLIENT__INVALID_RESPONSE: "서버 응답을 확인하지 못했어요. 잠시 후 다시 시도해 주세요.",
	},
	storage: {
		loading: "기존 자료를 가져오고 있어요. 준비된 자료는 사용할 수 있어요.",
		partial: "일부 자료를 가져오지 못했어요. 원본은 그대로 두었으며 다시 시도할 수 있어요.",
		unavailable: "저장된 자료를 읽지 못했어요. 원본을 변경하지 않았어요. 다시 시도해 주세요.",
		settingError:
			"일부 기기 설정을 읽지 못했어요. 저장된 값은 그대로 두고 기본 설정으로 표시해요.",
		saveError: "저장 상태를 확인하지 못했어요. 다시 시도해 주세요.",
	},
	feedback: {
		thanks: "소중한 의견이 잘 전달됐어요. 더 나은 버디버드를 만드는 데 반영할게요.",
		thanksClose: "확인",
		retry: "다시 보내기",
		promptTitle: "의견을 들려주세요",
		promptMessage:
			"버디버드를 쓰면서 느낀 점이나 바라는 점을 자유롭게 남겨 주세요. 큰 힘이 됩니다!",
		later: "닫기",
		write: "피드백 남기기",
		title: "피드백 보내기",
		placeholder: "개선하면 좋을 점, 불편한 점, 바라는 기능을 자유롭게 적어 주세요.",
		privacy: "⚠ 이름·연락처 등 개인정보는 입력하지 마세요.",
		send: "보내기",
		sent: "감사합니다!",
		error: "의견을 보내지 못했어요. 내용을 보존했으니 연결을 확인하고 다시 시도해 주세요.",
	},
	update: {
		title: "업데이트 알림",
		required: "업데이트가 필요해요",
		body: "버디버드 {{version}} 버전을 사용할 수 있어요.",
		requiredBody: "계속 사용하려면 {{version}} 버전으로 업데이트해 주세요.",
		accept: "업데이트",
		later: "닫기",
		error: "스토어를 열지 못했어요. 다시 시도해 주세요.",
	},
}
