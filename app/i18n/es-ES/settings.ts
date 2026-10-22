import type { SettingsMessages } from '@/i18n/types/settings';

export const settings: SettingsMessages = {
	title: 'Ajustes',
	saveError: 'No hemos podido guardar el ajuste y hemos vuelto al valor anterior.\nInténtalo de nuevo.',
	notifications: {
		title: 'Notificaciones',
		all: 'Todas las notificaciones',
		permissionOff: 'El permiso de notificaciones está desactivado, así que no recibirás ninguna',
	},
	general: {
		language: 'Idioma de la app',
		korean: '한국어',
		english: 'English',
		japanese: '日本語',
		russian: 'Русский',
		spanish: 'Español',
		simplifiedChinese: '简体中文',
		traditionalChinese: '繁體中文',
		devices: 'Dispositivos conectados',
	},
	account: {
		signOut: 'Cerrar sesión',
		withdraw: 'Eliminar cuenta',
	},
	support: {
		title: 'Ayuda',
		feedback: 'Enviar comentarios',
		consents: 'Condiciones y consentimientos',
		version: 'Versión de la app {{version}}',
	},
	signOutDialog: {
		title: 'Cerrar sesión',
		message: '¿Quieres cerrar sesión en este dispositivo?',
		confirm: 'Cerrar sesión',
	},
	withdrawDialog: {
		title: 'Eliminar cuenta',
		message: 'Buddy te va a echar mucho de menos. ¿Seguro que quieres irte?',
		warning: 'Si eliminas la cuenta, no se puede recuperar.',
		confirm: 'Eliminar cuenta',
	},
	consents: {
		title: 'Condiciones y consentimientos',
		saveError: 'No hemos podido guardar el cambio. Inténtalo de nuevo.',
	},
	devices: {
		title: 'Dispositivos conectados',
		thisDevice: 'Este dispositivo',
		runningSession: 'Entrenamiento en marcha',
		lastSeen: 'Último acceso: {{time}}',
		delete: 'Eliminar {{name}}',
		deleteMessage: 'Si lo eliminas, este dispositivo dejará de recibir notificaciones.',
		sessionEnds: 'El entrenamiento que hay en marcha en este dispositivo terminará.',
		deleteError: 'No hemos podido eliminar el dispositivo. Inténtalo de nuevo.',
	},
};
