import type { ProfileMessages } from '@/i18n/types/profile';

export const profile: ProfileMessages = {
	title: 'Профиль',
	settings: 'Настройки',
	nicknameMissing: 'Добавь никнейм',
	editAccount: 'Изменить аккаунт',
	parrots: 'Попугаи',
	addParrot: 'Добавить попугая',
	editParrot: 'Изменить данные: {{name}}',
	ageMonths: '{{count}} мес.',
	ageYears_one: '{{count}} год',
	ageYears_few: '{{count}} года',
	ageYears_many: '{{count}} лет',
	ageYears_other: '{{count}} года',
	nickname: 'Никнейм',
	nicknameHint: 'От 2 до 20 символов',
	nicknameInvalid:
		'В никнейме должно быть от 2 до 20 символов. Подходят только буквы, цифры, подчёркивания и пробелы.',
	photoUploading: 'Загружаем фото',
	photoUploadFailed: 'Не получилось загрузить фото.',
};
