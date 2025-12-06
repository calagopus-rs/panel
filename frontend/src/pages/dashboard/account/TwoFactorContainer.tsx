import { Grid, Title } from '@mantine/core';
import Card from '@/elements/Card';
import { useAuth } from '@/providers/AuthProvider';
import TwoFactorDisableButton from './actions/TwoFactorDisableButton';
import TwoFactorSetupButton from './actions/TwoFactorSetupButton';

export default function TwoFactorContainer() {
  const { user } = useAuth();

  return (
    <Grid.Col span={{ base: 12, md: 6, lg: 4 }}>
      <Card h='100%'>
        <Title order={2} c='white'>
          Two-Step Verification
        </Title>
        <div className='mt-4'>
          {user!.totpEnabled ? (
            <p>Two-Step Verification is currently enabled.</p>
          ) : (
            <p>
              You do not currently have two-step verification enabled on your account. Click the button below to begin
              configuring it.
            </p>
          )}
        </div>
        <div className='pt-4 flex mt-auto'>
          {user!.totpEnabled ? <TwoFactorDisableButton /> : <TwoFactorSetupButton />}
        </div>
      </Card>
    </Grid.Col>
  );
}
