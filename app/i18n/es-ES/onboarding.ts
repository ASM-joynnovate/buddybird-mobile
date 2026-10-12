import type { OnboardingMessages } from '@/i18n/types/onboarding';

export const onboarding: OnboardingMessages = {
	login: {
		tagline: 'Tu loro aprende a hablar aunque no estés en casa',
		greeting: {
			title: '¡Qué alegría verte!',
			body: 'Inicia sesión y empezamos juntos',
		},
		words: ['Hola', 'Te quiero', 'Buenos días', 'A comer', 'Qué guapo'],
	},
	consent: {
		intro: '¡Acepta las condiciones para usar BuddyBird!',
		all: 'Aceptar todo',
	},
	usage: {
		record: {
			title: 'Graba con <b>tu propia voz</b> las palabras que quieres enseñarle a tu loro',
			scene: 'una palabra grabándose y un micrófono',
			recording: 'Grabando',
		},
		place: {
			title: 'Deja el móvil <b>delante de la jaula</b> y pulsa «Empezar entrenamiento» para que tu loro escuche las palabras',
			scene: 'un móvil delante de la jaula que le reproduce una palabra al loro',
		},
		keepOn: {
			title: 'Durante el entrenamiento, deja la app abierta y <b>no apagues la pantalla</b>',
			scene: 'un móvil cargándose con la pantalla encendida en una habitación a oscuras',
		},
		report: {
			title: 'En el <b>informe</b> puedes ver el tiempo de entrenamiento y el historial',
			scene: 'un informe que compara el tiempo de entrenamiento de esta semana y de la anterior',
			lastWeek: 'Semana pasada',
			comparedToLastWeek: '+{{duration}} frente a la semana pasada',
		},
	},
	permissions: {
		intro: 'Estos son los permisos que necesita BuddyBird',
		scene: 'un móvil delante de la jaula que escucha al loro y envía una notificación',
		buddyWord: '¡Hola!',
		listening: 'Escuchando',
		alert: {
			appName: 'BuddyBird',
			time: 'ahora',
			message: 'El entrenamiento ha terminado',
		},
		purpose: {
			microphone: 'Grabar palabras y registrar los sonidos del loro',
			notifications: 'Notificaciones de los entrenamientos',
		},
		continue: 'Continuar',
	},
	marketing: {
		intro: '¿Quieres recibir notificaciones de funciones nuevas y eventos?',
		scene: 'Buddy en una percha y novedades colgadas en la pared',
		news: {
			features: 'Funciones nuevas',
			events: 'Eventos',
		},
		hint: 'Puedes cambiarlo cuando quieras en Ajustes > Notificaciones.',
		night: 'Recibir también de 21:00 a 8:00',
		accept: 'Sí, avísame',
		decline: 'No, gracias',
	},
	legacy: {
		uploading: 'Pasando a tu cuenta el loro y las palabras de este móvil',
		uploadError:
			'No hemos podido pasar a tu cuenta el loro y las palabras. Revisa la conexión e inténtalo de nuevo.',
		askTitle: '¿Añadir el loro y las palabras de este móvil?',
	},
};
