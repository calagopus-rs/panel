import { Grid, Title } from '@mantine/core';
import TwoFactorDisableButton from './actions/TwoFactorDisableButton';
import TwoFactorSetupButton from './actions/TwoFactorSetupButton';
import { useAuth } from '@/providers/AuthProvider';

export default () => {
  const { user } = useAuth();

  return (
    <Grid.Col span={{ base: 12, md: 6, lg: 4 }}>
      <Title order={2} c={'white'}>
        Two-Step Verification
      </Title>

      <div className={'mt-4'}>
        {user.totpEnabled ? (
          <p>Two-Step Verification is currently enabled.</p>
        ) : (
          <p>
            You do not currently have two-step verification enabled on your account. Click the button below to begin
            configuring it.
          </p>
        )}
      </div>

      <div className={'mt-4 flex justify-end'}>
        {user.totpEnabled ? <TwoFactorDisableButton /> : <TwoFactorSetupButton />}
      </div>
    </Grid.Col>
  );
};
