import { Grid } from '@mantine/core';
import ServerContentContainer from '@/elements/containers/ServerContentContainer.tsx';
import AutokillContainer from './AutokillContainer.tsx';
import ReinstallContainer from './ReinstallContainer.tsx';
import RenameContainer from './RenameContainer.tsx';
import TimezoneContainer from './TimezoneContainer.tsx';

export default function ServerSettings() {
  return (
    <ServerContentContainer title='Settings'>
      <Grid grow mt='xs'>
        <RenameContainer />
        <AutokillContainer />
        <TimezoneContainer />
        <ReinstallContainer />
      </Grid>
    </ServerContentContainer>
  );
}
