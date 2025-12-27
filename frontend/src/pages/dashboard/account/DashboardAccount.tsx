import { faShieldAlt } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Grid } from '@mantine/core';
import Alert from '@/elements/Alert.tsx';
import AccountContentContainer from '@/elements/containers/AccountContentContainer.tsx';
import { useAuth } from '@/providers/AuthProvider.tsx';
import { useTranslations } from '@/providers/TranslationProvider.tsx';
import AccountContainer from './AccountContainer.tsx';
import AvatarContainer from './AvatarContainer.tsx';
import EmailContainer from './EmailContainer.tsx';
import PasswordContainer from './PasswordContainer.tsx';
import TwoFactorContainer from './TwoFactorContainer.tsx';

export interface AccountCardProps {
  blurred?: boolean;
}

export default function DashboardAccount() {
  const { t } = useTranslations();
  const { user } = useAuth();

  const requireTwoFactorActivation = !user?.totpEnabled && user?.requireTwoFactor;

  return (
    <AccountContentContainer title={t('pages.account.account.title', {})}>
      {requireTwoFactorActivation && (
        <Alert
          icon={<FontAwesomeIcon icon={faShieldAlt} />}
          title={t('pages.account.account.alert.requireTwoFactor.title', {})}
          color='red'
          mb='md'
        >
          {t('pages.account.account.alert.requireTwoFactor.description', {})}
        </Alert>
      )}

      <Grid grow>
        <PasswordContainer blurred={requireTwoFactorActivation} />
        <EmailContainer blurred={requireTwoFactorActivation} />
        <TwoFactorContainer />
        <AccountContainer blurred={requireTwoFactorActivation} />
        <AvatarContainer blurred={requireTwoFactorActivation} />
      </Grid>
    </AccountContentContainer>
  );
}
