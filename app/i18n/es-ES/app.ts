import type { AppMessages } from '@/i18n/types/app';

export const app: AppMessages = {
	startup: {
		loading: 'Preparando la app',
	},
	startupError: {
		title: 'No hemos podido iniciar la app',
		message: 'Revisa tu conexión a internet e inténtalo de nuevo.',
	},
	feedback: {
		sentMessage: 'Nos ha llegado tu opinión. La tendremos en cuenta para mejorar BuddyBird.',
		retry: 'Enviar de nuevo',
		promptTitle: 'Cuéntanos qué te parece',
		promptMessage: 'Escríbenos lo que piensas de BuddyBird y lo que echas en falta. ¡Nos ayuda muchísimo!',
		write: 'Dejar comentarios',
		title: 'Enviar comentarios',
		placeholder: 'Cuéntanos qué mejorarías, qué te resulta incómodo o qué función te gustaría tener.',
		privacy: '⚠ No escribas datos personales, como tu nombre o tu teléfono.',
		send: 'Enviar',
		sentTitle: '¡Gracias!',
		sendError:
			'No hemos podido enviar tu opinión. Hemos conservado el texto. Revisa la conexión e inténtalo de nuevo.',
	},
	update: {
		title: 'Actualización disponible',
		forcedTitle: 'Hace falta actualizar',
		message: 'Ya está disponible BuddyBird {{version}}.',
		forcedMessage: 'Actualiza a la versión {{version}} para seguir usando la app.',
		accept: 'Actualizar',
		openStoreError: 'No hemos podido abrir la tienda. Inténtalo de nuevo.',
	},
};
