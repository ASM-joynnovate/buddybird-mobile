import { useEffect, useState } from 'react';

import type { LoginProvider } from '@/types/auth';

import { useLogout } from '@/hooks/apis/auth';

import { useTranslation } from 'react-i18next';

import { toast } from 'sonner-native';

import { availableLoginProviders } from '@/services/auth/providers';
import { isAppleLoginCanceled, linkAccount, signIn } from '@/services/auth/sign-in';
import { reportError } from '@/services/telemetry/client';

import ConfirmDialog from '@/components/dialogs/confirm-dialog';
import SocialLoginList from '@/components/social-login-list';
import { dialogToasterId, Toast } from '@/components/ui/toast';

/** 커뮤니티 입장 팝업의 소셜 로그인 목록 컴포넌트 */
const CommunityGateLoginForm = () => {
	const { t } = useTranslation();

	const [providers, setProviders] = useState<LoginProvider[]>([]);
	const [loadingProvider, setLoadingProvider] = useState<LoginProvider | undefined>(undefined);
	const [existingAccountProvider, setExistingAccountProvider] = useState<LoginProvider | null>(null);

	const { mutateAsync } = useLogout();

	/** 화면 진입 시 사용할 수 있는 로그인 방식 조회 */
	useEffect(() => {
		let active = true;

		void availableLoginProviders().then((loadedProviders) => {
			if (active) {
				setProviders(loadedProviders);
			}
		});

		return () => {
			active = false;
		};
	}, []);

	const handleSignIn = async (provider: LoginProvider) => {
		if (loadingProvider) {
			return;
		}

		setLoadingProvider(provider);

		try {
			// 선택한 기존 계정으로 로그인
			if (existingAccountProvider === provider) {
				try {
					await mutateAsync();
				} catch {
					toast.custom(<Toast variant="error" message={t('auth.signInError')} />, {
						toasterId: dialogToasterId,
					});

					return;
				}

				setExistingAccountProvider(null);

				await signIn(provider);

				return;
			}

			if ((await linkAccount(provider)) === 'accountExists') {
				setExistingAccountProvider(provider);
			}
		} catch (e) {
			if (!isAppleLoginCanceled(provider, e)) {
				reportError(e, 'sign_in');

				toast.custom(<Toast variant="error" message={t('auth.signInError')} />);
			}
		} finally {
			setLoadingProvider(undefined);
		}
	};

	const handleSignInExistingAccount = () => {
		if (existingAccountProvider) {
			void handleSignIn(existingAccountProvider);
		}
	};

	return (
		<>
			<SocialLoginList
				providers={providers}
				loadingProvider={loadingProvider}
				disabled={loadingProvider !== undefined}
				appearance="item"
				onSignIn={(provider) => void handleSignIn(provider)}
			/>

			<ConfirmDialog
				visible={existingAccountProvider !== null}
				text={{
					title: t('auth.existingAccount.title'),
					message: t('auth.existingAccount.message'),
					confirm: t('auth.signIn'),
				}}
				confirmBusy={loadingProvider !== undefined}
				onConfirm={handleSignInExistingAccount}
				onClose={() => setExistingAccountProvider(null)}
			/>
		</>
	);
};

export default CommunityGateLoginForm;
