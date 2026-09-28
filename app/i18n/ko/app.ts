import type { AppMessages } from '@/i18n/types/app';

export const app: AppMessages = {
	startup: {
		loading: '앱을 준비하고 있어요',
		title: '앱을 시작하지 못했어요',
		message: '인터넷 연결을 확인하고 다시 시도해 주세요.',
	},
	feedback: {
		thanks: '소중한 의견이 잘 전달됐어요. 더 나은 버디버드를 만드는 데 반영할게요.',
		thanksClose: '확인',
		retry: '다시 보내기',
		promptTitle: '의견을 들려주세요',
		promptMessage: '버디버드를 쓰면서 느낀 점이나 바라는 점을 자유롭게 남겨 주세요. 큰 힘이 됩니다!',
		later: '닫기',
		write: '피드백 남기기',
		title: '피드백 보내기',
		placeholder: '개선하면 좋을 점, 불편한 점, 바라는 기능을 자유롭게 적어 주세요.',
		privacy: '⚠ 이름·연락처 등 개인정보는 입력하지 마세요.',
		send: '보내기',
		sent: '감사합니다!',
		error: '의견을 보내지 못했어요. 내용을 보존했으니 연결을 확인하고 다시 시도해 주세요.',
	},
	update: {
		title: '업데이트 알림',
		required: '업데이트가 필요해요',
		body: '버디버드 {{version}} 버전을 사용할 수 있어요.',
		requiredBody: '계속 사용하려면 {{version}} 버전으로 업데이트해 주세요.',
		accept: '업데이트',
		later: '닫기',
		error: '스토어를 열지 못했어요. 다시 시도해 주세요.',
	},
};
