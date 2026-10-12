import type { AuthMessages } from '@/i18n/types/auth';

export const auth: AuthMessages = {
	continue: {
		google: 'Continuar con Google',
		kakao: 'Continuar con Kakao',
		apple: 'Continuar con Apple',
	},
	signingIn: {
		google: 'Iniciando sesión con Google',
		kakao: 'Iniciando sesión con Kakao',
		apple: 'Iniciando sesión con Apple',
	},
	completing: 'Terminando de iniciar sesión en BuddyBird',
	existingAccount: {
		title: 'Ya tienes una cuenta',
		message: '¿Quieres iniciar sesión con esa cuenta? Lo que has guardado hasta ahora no se pasará a esa cuenta.',
	},
	signInError: 'No hemos podido iniciar sesión. Revisa la conexión y pulsa de nuevo el botón de inicio de sesión.',
	lastLogin: 'Último acceso',
	lastLoginHint: 'Es el método con el que entraste la última vez',
	signOutError: 'No hemos podido cerrar la sesión. Revisa la conexión e inténtalo de nuevo.',
	signIn: 'Iniciar sesión',
};
