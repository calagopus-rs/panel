import RenameContainer from './RenameContainer';
import TimezoneContainer from './TimezoneContainer';
import AutokillContainer from './AutokillContainer';
import ReinstallContainer from './ReinstallContainer';
import { Grid, Group, Title } from '@mantine/core';

export default () => {
  return (
    <>
      <Group justify={'space-between'} mb={'md'}>
        <Title order={1} c={'white'}>
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
};
