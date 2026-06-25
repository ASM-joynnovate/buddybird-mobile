import { useFcmRegistration } from '@/features/notifications/hooks/use-fcm-registration';
import { useProfile } from '@/features/profile/profile-context';

export function FcmRegistrationBootstrap() {
  const { profile } = useProfile();

  useFcmRegistration({ enabled: !!profile });

  return null;
}
