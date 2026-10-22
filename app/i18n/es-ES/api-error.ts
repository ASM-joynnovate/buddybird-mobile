import type { ApiErrorMessages } from '@/i18n/types/api-error';

export const apiError: ApiErrorMessages = {
	COMMON__BAD_REQUEST: 'No hemos podido procesar la solicitud. Revisa lo que has escrito.',
	COMMON__RESOURCE_NOT_FOUND: 'No encontramos lo que buscas. Puede que ya se haya eliminado.',
	COMMON__FILE_SIZE_EXCEEDED: 'El archivo pesa demasiado. Solo puedes subir archivos de hasta 5 MB.',
	COMMON__IDEMPOTENCY_KEY_REQUIRED:
		'No hemos podido procesar la solicitud. Si sigue pasando, actualiza la app a la última versión.',
	COMMON__REQUEST_VALIDATION_ERROR:
		'No hemos podido comprobar la solicitud. Si sigue pasando, actualiza la app a la última versión.',
	COMMON__RESPONSE_VALIDATION_ERROR:
		'Hay un problema con la respuesta del servidor. Inténtalo de nuevo dentro de un momento.',
	COMMON__INTERNAL_SERVER_ERROR: 'Ha habido un problema en el servidor. Inténtalo de nuevo dentro de un momento.',
	AUTH__INVALID_TOKEN: 'Tu sesión ha caducado. Vuelve a iniciar sesión.',
	AUTH__SERVICE_UNAVAILABLE:
		'El inicio de sesión no está disponible ahora mismo. Inténtalo de nuevo dentro de un momento.',
	AUTH__INVALID_PROVIDER_CREDENTIAL:
		'No hemos podido verificar tu cuenta de Google, Apple o Kakao. Vuelve a iniciar sesión.',
	AUTH__PROVIDER_CREDENTIAL_REQUIRED:
		'Faltan los datos de tu cuenta de Google, Apple o Kakao. Vuelve a iniciar sesión.',
	AUTH__WITHDRAWAL_SAVE_UNAVAILABLE:
		'No hemos podido confirmar si se ha registrado tu solicitud para eliminar la cuenta. Envíala de nuevo.',
	USER__SAVE_UNAVAILABLE: 'No hemos podido guardar los datos de tu cuenta. Inténtalo de nuevo dentro de un momento.',
	USER__DUPLICATE_NICKNAME: 'Ese apodo ya lo usa otra persona. Prueba con otro.',
	USER__INVALID_PROFILE_PHOTO: 'Solo puedes subir fotos en JPEG o PNG.',
	DEVICE__NOT_REGISTERED: 'No hemos podido comprobar el registro de este dispositivo. Vuelve a abrir la app.',
	DEVICE__NOT_STATION: 'Esto solo se puede hacer desde el dispositivo que está delante de la jaula.',
	DEVICE__SAVE_UNAVAILABLE:
		'No hemos podido guardar los datos del dispositivo. Inténtalo de nuevo dentro de un momento.',
	PARROT__SAVE_UNAVAILABLE: 'No hemos podido guardar los datos de tu loro. Inténtalo de nuevo dentro de un momento.',
	WORD__SAVE_UNAVAILABLE: 'No hemos podido guardar la palabra. Inténtalo de nuevo dentro de un momento.',
	WORD__RECORDING_REQUIRED: 'Cada palabra necesita al menos una grabación.',
	WORD__INVALID_RECORDING: 'Solo puedes subir grabaciones en m4a, wav o mp3.',
	SESSION__SAVE_UNAVAILABLE:
		'No hemos podido guardar los datos del entrenamiento. Inténtalo de nuevo dentro de un momento.',
	SESSION__ALREADY_RUNNING: 'Ya hay un entrenamiento en marcha.',
	SESSION__NOT_RUNNING: 'No hay ningún entrenamiento en marcha.',
	SESSION__INVALID_SOUND: 'Solo puedes subir archivos de sonido en wav.',
	FEEDBACK__SAVE_UNAVAILABLE: 'No hemos podido guardar tu opinión. Inténtalo de nuevo dentro de un momento.',
	CONSENT__SAVE_UNAVAILABLE: 'No hemos podido guardar tu consentimiento. Inténtalo de nuevo dentro de un momento.',
	NOTIFICATION__READ_FAILED:
		'No hemos podido marcar la notificación como leída. Inténtalo de nuevo dentro de un momento.',
	CLIENT__NETWORK: 'Revisa tu conexión a internet.',
	CLIENT__TIMEOUT: 'La respuesta está tardando demasiado. Revisa tu conexión a internet.',
	CLIENT__INVALID_RESPONSE:
		'No hemos podido leer la respuesta del servidor. Inténtalo de nuevo dentro de un momento.',
	USER__SELF_TARGET: 'No puedes bloquear ni denunciar tu propia cuenta.',
	FEED__SAVE_UNAVAILABLE: 'No hemos podido guardar tu reacción. Inténtalo de nuevo dentro de un momento.',
	ABUSE_REPORT__SAVE_UNAVAILABLE: 'No hemos podido enviar la denuncia. Inténtalo de nuevo dentro de un momento.',
};
