import { Grid, Title } from '@mantine/core';
import Card from '@/elements/Card.tsx';
import { formatTimestamp } from '@/lib/time.ts';
import { useAuth } from '@/providers/AuthProvider.tsx';
import { useTranslations } from '@/providers/TranslationProvider.tsx';
import TwoFactorDisableButton from './actions/TwoFactorDisableButton.tsx';
import TwoFactorSetupButton from './actions/TwoFactorSetupButton.tsx';

export default function TwoFactorContainer() {
  const { t } = useTranslations();
  const { user } = useAuth();

  return (
    <Grid.Col span={{ base: 12, md: 6, lg: 4 }}>
      <Card h='100%'>
        <Title order={2} c='white'>
          {t('pages.account.account.containers.twoFactor.title', {})}
        </Title>
        <div className='mt-4'>
          {user!.totpEnabled
            ? t('pages.account.account.containers.twoFactor.twoFactorEnabled', {}).md()
            : t('pages.account.account.containers.twoFactor.twoFactorDisabled', {}).md()}
          {user?.totpLastUsed && (
            <div className='mt-2 text-sm text-gray-400'>
              {t('pages.account.account.containers.twoFactor.twoFactorLastUsed', {
                date: formatTimestamp(user.totpLastUsed),
              }).md()}
            </div>
          )}
        </div>
        <div className='pt-4 flex mt-auto'>
          {user!.totpEnabled ? <TwoFactorDisableButton /> : <TwoFactorSetupButton />}
        </div>
      </Card>
    </Grid.Col>
  );
}
