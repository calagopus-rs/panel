import { httpErrorToHuman } from '@/api/axios';
import { useToast } from '@/providers/ToastProvider';
import { useServerStore } from '@/stores/server';
import { useState } from 'react';
import SettingsReinstallDialog from './dialogs/SettingsReinstallDialog';
import reinstallServer from '@/api/server/settings/reinstallServer';
import { useNavigate } from 'react-router';
import { Grid, Group, Title } from '@mantine/core';
import { load } from '@/lib/debounce';
import Card from '@/elements/Card';
import NewButton from '@/elements/button/NewButton';

export default () => {
  const { addToast } = useToast();
  const { server } = useServerStore();
  const navigate = useNavigate();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const doReinstall = (truncateDirectory: boolean) => {
    load(true, setLoading);
    reinstallServer(server.uuid, { truncateDirectory })
      .then(() => {
        addToast('Reinstalling server...', 'success');

        navigate(`/server/${server.uuidShort}`);
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      })
      .finally(() => {
        load(false, setLoading);
      });
  };

  return (
    <Grid.Col span={{ base: 12, md: 6, lg: 4 }}>
      <Card>
        <SettingsReinstallDialog open={dialogOpen} onClose={() => setDialogOpen(false)} onReinstall={doReinstall} />

        <Title order={2} c={'white'}>
          Reinstall Server
        </Title>

        <Group mt={'md'}>
          <NewButton color={'red'} onClick={() => setDialogOpen(true)} loading={loading}>
            Reinstall Server
          </NewButton>
        </Group>
      </Card>
    </Grid.Col>
  );
};
