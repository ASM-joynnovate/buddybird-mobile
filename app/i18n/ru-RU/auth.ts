import type { AuthMessages } from '@/i18n/types/auth';

export const auth: AuthMessages = {
	continue: {
		google: 'Продолжить с Google',
		kakao: 'Продолжить с Kakao',
		apple: 'Продолжить с Apple',
	},
	signingIn: {
		google: 'Входим через Google',
		kakao: 'Входим через Kakao',
		apple: 'Входим через Apple',
	},
	completing: 'Завершаем вход в BuddyBird',
	existingAccount: {
		title: 'У тебя уже есть аккаунт',
		message: 'Войти в него? Всё, что записано до этого, перенести не получится.',
	},
	signInError: 'Не получилось войти. Проверь подключение и нажми кнопку входа ещё раз.',
	lastLogin: 'Последний вход',
	lastLoginHint: 'В прошлый раз вход был этим способом',
	signOutError: 'Не получилось выйти. Проверь подключение и попробуй ещё раз.',
	signIn: 'Войти',
};
