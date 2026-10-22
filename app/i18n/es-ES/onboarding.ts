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
			scene: 'un loro en una percha junto a una tableta y la palabra Hola grabada con la voz de su dueño',
			voiceOwner: 'Tu voz',
		},
		place: {
			title: 'Antes de salir, deja <b>un dispositivo que no uses</b> junto a la jaula y empieza el entrenamiento.',
			scene: 'foto de una tableta cargándose que hace un entrenamiento junto a un loro sobre la jaula',
			spareDevice: 'Dispositivo que no uses (tableta, móvil viejo)',
			charger: 'Conéctalo al cargador',
		},
		live: {
			title: 'Aunque estés fuera, mira los detalles del entrenamiento <b>en tu móvil</b> en tiempo real',
			scene: 'detalles del entrenamiento en un móvil: tiempo de entrenamiento, palabra enseñada, imitaciones, emergencias y registro',
		},
		sound: {
			title: 'Una <b>IA especializada en loros</b> detecta los gorjeos de tu loro y las palabras que repite.',
			scene: 'registro de sonidos en los detalles del entrenamiento: la palabra Hola repetida, un gorjeo y un grito de alarma',
		},
		motion: {
			title: 'También se registran los momentos en que tu loro <b>sale de cámara o vuelve</b>.',
			scene: 'registro de movimiento en los detalles del entrenamiento: vídeo del loro saliendo de cámara y foto del loro de vuelta en cámara',
		},
		start: 'Empezar',
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
