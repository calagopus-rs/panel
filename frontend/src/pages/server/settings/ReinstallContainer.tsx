import { useState } from 'react';
import { Grid, Group, Title } from '@mantine/core';
import Card from '@/elements/Card';
import Button from '@/elements/Button';
import SettingsReinstallModal from './modals/SettingsReinstallModal';

export default () => {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <Grid.Col span={{ base: 12, md: 6, lg: 4 }}>
      <Card h='100%'>
        <SettingsReinstallModal opened={modalOpen} onClose={() => setModalOpen(false)} />

        <Title order={2} c={'white'}>
          Reinstall Server
        </Title>

        <Group pt={'md'} mt={'auto'}>
          <Button color={'red'} onClick={() => setModalOpen(true)}>
            Reinstall Server
          </Button>
        </Group>
      </Card>
    </Grid.Col>
  );
};
