import { Grid, Group, Title } from '@mantine/core';
import AutokillContainer from './AutokillContainer';
import ReinstallContainer from './ReinstallContainer';
import RenameContainer from './RenameContainer';
import TimezoneContainer from './TimezoneContainer';

export default function ServerSettings() {
  return (
    <>
      <Group justify='space-between' mb='md'>
        <Title order={1} c='white'>
          Settings
        </Title>
      </Group>

      <Grid grow>
        <RenameContainer />
        <AutokillContainer />
        <TimezoneContainer />
        <ReinstallContainer />
      </Grid>
    </>
  );
}
