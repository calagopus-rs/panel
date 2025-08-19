import PasswordContainer from './PasswordContainer';
import EmailContainer from './EmailContainer';
import TwoFactorContainer from './TwoFactorContainer';
import { Grid } from '@mantine/core';

export default () => {
  return (
    <Grid grow>
      <PasswordContainer />
      <EmailContainer />
      <TwoFactorContainer />
    </Grid>
  );
};
