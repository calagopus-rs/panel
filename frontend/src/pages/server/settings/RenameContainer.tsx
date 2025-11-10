import { Grid, Group, Stack, Title } from '@mantine/core';
import { useState } from 'react';
import { httpErrorToHuman } from '@/api/axios';
import renameServer from '@/api/server/settings/renameServer';
import Button from '@/elements/Button';
import Card from '@/elements/Card';
import TextArea from '@/elements/input/TextArea';
import TextInput from '@/elements/input/TextInput';
import { load } from '@/lib/debounce';
import { useToast } from '@/providers/ToastProvider';
import { useServerStore } from '@/stores/server';

export default function RenameContainer() {
  const { addToast } = useToast();
  const { server, updateServer } = useServerStore();

  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(server.name);
  const [description, setDescription] = useState(server.description || '');

  const doUpdate = () => {
    load(true, setLoading);
    renameServer(server.uuid, { name, description })
      .then(() => {
        addToast('Server renamed.', 'success');
        updateServer({ name, description });
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
      <Card h='100%'>
        <Stack h='100%'>
          <Title order={2} c={'white'}>
            Rename Server
          </Title>

          <TextInput
            withAsterisk
            label={'Server Name'}
            placeholder={'Server Name'}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <TextArea
            label={'Description'}
            placeholder={'Description'}
            value={description}
            rows={3}
            onChange={(e) => setDescription(e.target.value)}
          />

          <Group h='100%'>
            <Button
              disabled={!name || (name === server.name && description === (server.description ?? ''))}
              onClick={doUpdate}
              loading={loading}
            >
              Save
            </Button>
          </Group>
        </Stack>
      </Card>
    </Grid.Col>
  );
}
