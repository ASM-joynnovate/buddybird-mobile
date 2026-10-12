import type { ApiErrorMessages } from '@/i18n/types/api-error';

export const apiError: ApiErrorMessages = {
	COMMON__BAD_REQUEST: 'Не получилось выполнить запрос. Проверь введённые данные.',
	COMMON__RESOURCE_NOT_FOUND: 'Ничего не нашлось. Возможно, это уже удалено.',
	COMMON__FILE_SIZE_EXCEEDED: 'Файл слишком большой. Можно загружать файлы до 5 МБ.',
	COMMON__IDEMPOTENCY_KEY_REQUIRED:
		'Не получилось выполнить запрос. Если ошибка повторяется, обнови приложение до последней версии.',
	COMMON__REQUEST_VALIDATION_ERROR:
		'Не получилось проверить запрос. Если ошибка повторяется, обнови приложение до последней версии.',
	COMMON__RESPONSE_VALIDATION_ERROR: 'С ответом сервера что-то не так. Попробуй ещё раз чуть позже.',
	COMMON__INTERNAL_SERVER_ERROR: 'На сервере что-то пошло не так. Попробуй ещё раз чуть позже.',
	AUTH__INVALID_TOKEN: 'Сеанс истёк. Войди ещё раз.',
	AUTH__SERVICE_UNAVAILABLE: 'Вход временно недоступен. Попробуй ещё раз чуть позже.',
	AUTH__INVALID_PROVIDER_CREDENTIAL:
		'Не получилось проверить данные входа через Google, Apple или Kakao. Войди ещё раз.',
	AUTH__PROVIDER_CREDENTIAL_REQUIRED: 'Нужны данные входа через Google, Apple или Kakao. Войди ещё раз.',
	AUTH__WITHDRAWAL_SAVE_UNAVAILABLE:
		'Не получилось проверить, принят ли запрос на удаление аккаунта. Отправь его ещё раз.',
	USER__SAVE_UNAVAILABLE: 'Не получилось сохранить данные аккаунта. Попробуй ещё раз чуть позже.',
	USER__DUPLICATE_NICKNAME: 'Этот никнейм уже занят. Придумай другой.',
	USER__INVALID_PROFILE_PHOTO: 'Можно загружать только фото в формате JPEG или PNG.',
	DEVICE__NOT_REGISTERED: 'Не получилось проверить регистрацию этого устройства. Перезапусти приложение.',
	DEVICE__NOT_STATION: 'Это можно сделать только на устройстве у клетки.',
	DEVICE__SAVE_UNAVAILABLE: 'Не получилось сохранить данные устройства. Попробуй ещё раз чуть позже.',
	PARROT__SAVE_UNAVAILABLE: 'Не получилось сохранить данные попугая. Попробуй ещё раз чуть позже.',
	WORD__SAVE_UNAVAILABLE: 'Не получилось сохранить слово. Попробуй ещё раз чуть позже.',
	WORD__RECORDING_REQUIRED: 'У каждого слова должна быть хотя бы одна запись.',
	WORD__INVALID_RECORDING: 'Можно загружать только записи в формате m4a, wav или mp3.',
	SESSION__SAVE_UNAVAILABLE: 'Не получилось сохранить данные занятия. Попробуй ещё раз чуть позже.',
	SESSION__ALREADY_RUNNING: 'Занятие уже идёт.',
	SESSION__NOT_RUNNING: 'Сейчас нет активного занятия.',
	SESSION__INVALID_SOUND: 'Можно загружать только звуковые файлы wav.',
	FEEDBACK__SAVE_UNAVAILABLE: 'Не получилось сохранить отзыв. Попробуй ещё раз чуть позже.',
	CONSENT__SAVE_UNAVAILABLE: 'Не получилось сохранить согласие. Попробуй ещё раз чуть позже.',
	NOTIFICATION__READ_FAILED: 'Не получилось отметить уведомление прочитанным. Попробуй ещё раз чуть позже.',
	CLIENT__NETWORK: 'Проверь подключение к сети.',
	CLIENT__TIMEOUT: 'Сервер отвечает слишком долго. Проверь подключение к сети.',
	CLIENT__INVALID_RESPONSE: 'Не получилось прочитать ответ сервера. Попробуй ещё раз чуть позже.',
};
