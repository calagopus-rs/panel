import { Grid } from '@mantine/core';
import AccountContainer from './AccountContainer';
import AvatarContainer from './AvatarContainer';
import EmailContainer from './EmailContainer';
import PasswordContainer from './PasswordContainer';
import TwoFactorContainer from './TwoFactorContainer';

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
