import type { HomeMessages } from "@/i18n/types/home"

export const home: HomeMessages = {
	brand: "버디버드",
	streak: "{{count}}일 연속 학습",
	notifications: "알림",
	notificationsUnread: "알림, 안 읽은 알림 {{count}}개",
	settings: "설정",
	session: {
		running: "{{device}}에서 세션 실행 중",
		lost: "{{device}} 연결 끊김",
	},
	emergency: "{{time}} {{kind}} 감지",
	parrot: {
		months: "{{count}}개월",
		years: "{{count}}살",
		page: "{{total}}마리 중 {{current}}번째",
		edit: "{{name}} 정보 수정",
		addPhoto: "사진을 추가해 주세요",
	},
	mimicry: {
		label: "{{word}}, {{time}}에 따라 한 소리",
		said: "따라 했어요",
		empty: "시작을 누르면 버디가 단어를 들려줄게요",
	},
	notice: {
		detail: "자세히",
		image: "첨부 이미지 {{index}}",
	},
	notification: {
		title: "알림",
		readAll: "모두 읽음",
		readAllError: "모두 읽음으로 표시하지 못했어요. 다시 눌러 주세요.",
		unread: "안 읽음",
		empty: "아직 받은 알림이 없어요",
		emptyScene: "빈 알림함 앞의 버디",
	},
}
