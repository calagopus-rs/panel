import { useUserStore } from '@/stores/user';
import SetupTwoFactorButton from './actions/SetupTwoFactorButton';

export default () => {
  const { user } = useUserStore();

  return (
    <div className="bg-gray-700/50 rounded-md p-4 h-fit">
      <h1 className="text-4xl font-bold text-white">Two-Step Verification</h1>

      <div className="mt-4">
        {user.totpEnabled ? (
          <p>Two-Step Verification is currently enabled.</p>
        ) : (
          <p>
            You do not currently have two-step verification enabled on your account. Click the button below to begin
            configuring it.
          </p>
        )}
      </div>

      <div className="mt-4 flex justify-end">
        <SetupTwoFactorButton />
      </div>
    </div>
  );
};
