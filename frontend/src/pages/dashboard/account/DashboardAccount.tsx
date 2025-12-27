import { faShieldAlt } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Grid } from '@mantine/core';
import Alert from '@/elements/Alert.tsx';
import AccountContentContainer from '@/elements/containers/AccountContentContainer.tsx';
import { useAuth } from '@/providers/AuthProvider.tsx';
import AccountContainer from './AccountContainer.tsx';
import AvatarContainer from './AvatarContainer.tsx';
import EmailContainer from './EmailContainer.tsx';
import PasswordContainer from './PasswordContainer.tsx';
import TwoFactorContainer from './TwoFactorContainer.tsx';

export interface AccountCardProps {
  blurred?: boolean;
}

export default function DashboardAccount() {
  const { user } = useAuth();

  const requireTwoFactorActivation = !user?.totpEnabled && user?.requireTwoFactor;

  return (
    <AccountContentContainer title='Account'>
      {requireTwoFactorActivation && (
        <Alert
          icon={<FontAwesomeIcon icon={faShieldAlt} />}
          title='Two-Factor Authentication Required'
          color='red'
          mb='md'
        >
          Two-Factor Authentication is required on your account. Please set it up below to continue using the panel.
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
