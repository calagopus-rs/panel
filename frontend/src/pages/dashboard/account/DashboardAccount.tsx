import { Grid } from '@mantine/core';
import AccountContainer from './AccountContainer.tsx';
import AvatarContainer from './AvatarContainer.tsx';
import EmailContainer from './EmailContainer.tsx';
import PasswordContainer from './PasswordContainer.tsx';
import TwoFactorContainer from './TwoFactorContainer.tsx';

export default function DashboardAccount() {
  return (
    <Grid grow>
      <PasswordContainer />
      <EmailContainer />
      <TwoFactorContainer />
      <AccountContainer />
      <AvatarContainer />
    </Grid>
  );
}
