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
		title: 'General',
		languageAndCountry: 'Idioma y país',
		language: 'Idioma de la app',
		languageSearchHint: 'Buscar idioma por nombre',
		languageNotFound: 'Ningún idioma coincide con «{{query}}»',
		country: 'País',
		countryChoose: 'Seleccionar',
		countrySearchHint: 'Buscar país por nombre',
		countrySearchClear: 'Borrar búsqueda',
		countryNotFound: 'Ningún país coincide con «{{query}}»',
		devices: 'Dispositivos conectados',
	},
	privacy: {
		title: 'Privacidad',
		feed: 'Mostrar en el feed',
		feedDetail: 'Los demás verán tu entrenamiento y los sonidos imitados',
		leaderboard: 'Participar en el ranking',
		leaderboardDetail: 'Los demás verán tu apodo, tu foto y tu tiempo de entrenamiento',
		consents: 'Condiciones y consentimientos',
	},
	account: {
		signOut: 'Cerrar sesión',
		withdraw: 'Eliminar cuenta',
	},
	support: {
		title: 'Ayuda',
		feedback: 'Enviar comentarios',
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
