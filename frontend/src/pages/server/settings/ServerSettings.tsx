import { Grid, Group, Title } from '@mantine/core';
import AutokillContainer from './AutokillContainer.tsx';
import ReinstallContainer from './ReinstallContainer.tsx';
import RenameContainer from './RenameContainer.tsx';
import TimezoneContainer from './TimezoneContainer.tsx';

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
