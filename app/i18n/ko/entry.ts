import type { EntryMessages } from "@/i18n/types/entry"

export const entry: EntryMessages = {
	login: {
		product: "버디버드",
	},
	consent: {
		intro: "버디버드 앱 사용을 위해 동의해주세요!",
		all: "모두 동의",
		required: "필수",
		optional: "선택",
		viewFull: "{{title}} 전문 보기",
	},
	consentDetail: {
		agree: "동의",
	},
	parrot: {
		intro: "우리 앵무새를 소개해 주세요!",
		addTitle: "앵무새 등록",
		editTitle: "앵무새 수정",
		register: "등록",
		delete: "앵무새 삭제",
		deleteError: "앵무새를 삭제하지 못했어요. 다시 시도해 주세요.",
		photoType: "JPEG 또는 PNG 사진만 쓸 수 있어요. 다른 사진을 골라 주세요.",
		photoSize: "5MB 이하 사진만 쓸 수 있어요. 다른 사진을 골라 주세요.",
		photoError: "사진을 불러오지 못했어요. 다시 골라 주세요.",
	},
	usage: {
		words: {
			title: "앵무새에게 가르칠 단어를 내 목소리로 녹음해요",
			scene: "마이크에 단어를 녹음하는 사람과 버디",
		},
		login: {
			title: "쓰지 않는 휴대폰 한 대를 준비해서 같은 계정으로 로그인해 주세요",
			scene: "같은 계정으로 로그인한 휴대폰 두 대",
		},
		station: {
			title: "그 휴대폰을 새장 앞에 두고 시작을 누르면 앵무새에게 단어를 들려줘요",
			scene: "새장 앞에 가로로 세워 둔 휴대폰",
		},
		viewer: {
			title: "밖에서는 내 휴대폰으로 앵무새를 보고 알림을 받아요",
			scene: "집 밖에서 휴대폰으로 앵무새를 확인하는 사람",
		},
	},
	permissions: {
		title: "버디버드에 필요한 권한이에요",
		scene: "권한을 설명하는 버디",
		microphone: "단어 녹음과 앵무새 소리 기록",
		camera: "실시간 영상과 응급 상황 감지",
		notifications: "응급 상황과 학습 소식 알림",
		allow: "허용하기",
		later: "나중에",
		saveError: "진행 상태를 저장하지 못했어요. 버튼을 다시 눌러 주세요.",
	},
}
