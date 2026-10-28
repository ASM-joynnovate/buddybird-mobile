import type { SettingsMessages } from '@/i18n/types/settings';

export const settings: SettingsMessages = {
	title: 'Настройки',
	saveError: 'Не получилось сохранить настройку, поэтому вернули прежнее значение.\nПопробуй ещё раз.',
	notifications: {
		title: 'Уведомления',
		all: 'Все уведомления',
		permissionOff: 'Уведомления запрещены, поэтому они не приходят',
	},
	general: {
		title: 'Основные',
		languageAndCountry: 'Язык и страна',
		language: 'Язык приложения',
		languageSearchHint: 'Поиск по названию языка',
		languageNotFound: 'По запросу «{{query}}» ничего не нашлось',
		country: 'Страна',
		countryChoose: 'Выбери',
		countrySearchHint: 'Поиск по названию страны',
		searchClear: 'Очистить поиск',
		countryNotFound: 'По запросу «{{query}}» ничего не нашлось',
		devices: 'Подключённые устройства',
	},
	privacy: {
		title: 'Конфиденциальность',
		feed: 'Показывать в ленте',
		feedDetail: 'Другие увидят твои занятия и звуки, которые повторяет попугай',
		leaderboard: 'Участвовать в рейтинге',
		leaderboardDetail: 'Другие пользователи увидят твой никнейм, фото и время занятий',
		consents: 'Условия и согласия',
	},
	account: {
		signOut: 'Выйти',
		withdraw: 'Удалить аккаунт',
	},
	support: {
		title: 'Поддержка',
		feedback: 'Отправить отзыв',
		version: 'Версия приложения {{version}}',
	},
	signOutDialog: {
		title: 'Выход',
		message: 'Выйти из аккаунта на этом устройстве?',
		confirm: 'Выйти',
	},
	withdrawDialog: {
		title: 'Удаление аккаунта',
		message: 'Бадди будет очень скучать. Точно хочешь уйти?',
		warning: 'Вернуть удалённый аккаунт не получится.',
		confirm: 'Удалить аккаунт',
	},
	consents: {
		title: 'Условия и согласия',
		saveError: 'Не получилось сохранить изменение. Попробуй ещё раз.',
	},
	devices: {
		title: 'Подключённые устройства',
		thisDevice: 'Это устройство',
		runningSession: 'Идёт занятие',
		lastSeen: 'Последняя активность: {{time}}',
		delete: 'Удалить «{{name}}»',
		deleteMessage: 'После удаления уведомления на это устройство приходить не будут.',
		sessionEnds: 'Занятие на этом устройстве завершится.',
		deleteError: 'Не получилось удалить устройство. Попробуй ещё раз.',
	},
};
