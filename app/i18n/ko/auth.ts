import type { AuthMessages } from "@/i18n/types/auth"

export const auth: AuthMessages = {
	title: "버디버드에 로그인",
	description: "로그인하고 앵무새와의 학습을 시작해요.",
	google: "Google로 계속하기",
	kakao: "Kakao로 계속하기",
	apple: "Apple로 계속하기",
	pending: {
		google: "Google 로그인 중이에요",
		kakao: "Kakao 로그인 중이에요",
		apple: "Apple 로그인 중이에요",
	},
	completing: "버디버드 로그인을 마무리하고 있어요",
	signInError: "로그인하지 못했어요. 연결을 확인하고 로그인 버튼을 다시 눌러 주세요.",
	restoreError: "저장된 로그인을 확인하지 못했어요. 다시 시도해 주세요.",
	recent: "최근 로그인",
	recentHint: "마지막으로 로그인한 방법이에요",
	signOut: "이 기기에서 로그아웃",
	signOutError: "로그아웃하지 못했어요. 연결을 확인하고 다시 시도해 주세요.",
	signIn: "로그인",
	signInRequired: "로그인하면 앵무새가 따라 한 소리를 볼 수 있어요",
	merge: {
		title: "이 휴대폰의 기록을 합칠까요?",
		message:
			"이 소셜 계정으로 이미 사용 중인 계정이 있어요. 합치면 이 휴대폰에서 등록한 앵무새, 단어, 학습 기록을 그 계정으로 옮기고, 닉네임과 사진은 그 계정의 것을 그대로 써요. 같은 앵무새를 두 번 등록했다면 합친 뒤 프로필에서 하나를 지워 주세요.",
		confirm: "합치기",
	},
}
