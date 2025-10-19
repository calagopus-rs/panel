import { Grid, Stack, Text, Title } from '@mantine/core';
import Card from '@/elements/Card';
import { useState } from 'react';
import ServerTransferModal from '@/pages/admin/servers/management/modals/ServerTransferModal';
import Button from '@/elements/Button';
import ServerDeleteModal from '@/pages/admin/servers/management/modals/ServerDeleteModal';
import ServerSuspendModal from '@/pages/admin/servers/management/modals/ServerSuspendModal';
import ServerUnsuspendModal from '@/pages/admin/servers/management/modals/ServerUnsuspendModal';
import ServerClearStateModal from './modals/ServerClearStateModal';

export default ({ server }: { server: AdminServer }) => {
  const [openModal, setOpenModal] = useState<'transfer' | 'suspend' | 'unsuspend' | 'clear-state' | 'delete'>(null);

  return (
    <>
      <ServerTransferModal server={server} opened={openModal === 'transfer'} onClose={() => setOpenModal(null)} />
      <ServerSuspendModal server={server} opened={openModal === 'suspend'} onClose={() => setOpenModal(null)} />
      <ServerUnsuspendModal server={server} opened={openModal === 'unsuspend'} onClose={() => setOpenModal(null)} />
      <ServerClearStateModal server={server} opened={openModal === 'clear-state'} onClose={() => setOpenModal(null)} />
      <ServerDeleteModal server={server} opened={openModal === 'delete'} onClose={() => setOpenModal(null)} />

      <Grid>
        <Grid.Col span={3}>
          <Card>
            <Stack gap={'xs'}>
              <Title order={2}>Transfer</Title>
              <Text size={'sm'}>Move this server to another node within this system.</Text>
              <Button onClick={() => setOpenModal('transfer')} variant={'outline'} size={'xs'}>
                Transfer
              </Button>
            </Stack>
          </Card>
        </Grid.Col>
        <Grid.Col span={3}>
          {server.suspended ? (
            <Card>
              <Stack gap={'xs'}>
                <Title order={2}>Unsuspend</Title>
                <Text size={'sm'}>
                  This will unsuspend the server, allowing it to start again. The user will be able to access their
                  files and otherwise manage the server through the panel or API.
                </Text>
                <Button onClick={() => setOpenModal('unsuspend')} variant={'outline'} size={'xs'} color={'green'}>
                  Unsuspend
                </Button>
              </Stack>
            </Card>
          ) : (
            <Card>
              <Stack gap={'xs'}>
                <Title order={2}>Suspend</Title>
                <Text size={'sm'}>
                  This will suspend the server, stop any running processes, and immediately block the user from being
                  able to access their files or otherwise manage the server through the panel or API.
                </Text>
                <Button onClick={() => setOpenModal('suspend')} variant={'outline'} size={'xs'} color={'orange'}>
                  Suspend
                </Button>
              </Stack>
            </Card>
          )}
        </Grid.Col>
        <Grid.Col span={3}>
          <Card>
            <Stack gap={'xs'}>
              <Title order={2}>Clear State</Title>
              <Text size={'sm'}>This will clear the server state known by the panel.</Text>
              <Button onClick={() => setOpenModal('clear-state')} variant={'outline'} size={'xs'} color={'red'}>
                Clear State
              </Button>
            </Stack>
          </Card>
        </Grid.Col>
        <Grid.Col span={3}>
          <Card>
            <Stack gap={'xs'}>
              <Title order={2}>Delete</Title>
              <Text size={'sm'}>This will delete the server and all of its data. This action cannot be undone.</Text>
              <Button onClick={() => setOpenModal('delete')} variant={'outline'} size={'xs'} color={'red'}>
                Delete
              </Button>
            </Stack>
          </Card>
        </Grid.Col>
      </Grid>
    </>
  );
};
