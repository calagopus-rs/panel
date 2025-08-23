import { httpErrorToHuman } from '@/api/axios';
import renameServer from '@/api/server/settings/renameServer';
import Button from '@/elements/Button';
import TextArea from '@/elements/input/TextArea';
import TextInput from '@/elements/input/TextInput';
import { load } from '@/lib/debounce';
import { useToast } from '@/providers/ToastProvider';
import { useServerStore } from '@/stores/server';
import { Card, Grid, Group, Title } from '@mantine/core';
import { useState } from 'react';

export default () => {
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
      <Card>
        <Title order={2} c={'white'}>
          Rename Server
        </Title>

        <TextInput
          label={'Server Name'}
          placeholder={'Server Name'}
          value={name}
          onChange={(e) => setName(e.target.value)}
          mt={'sm'}
        />

        <TextArea
          label={'Description'}
          placeholder={'Description'}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          mt={'sm'}
        />

        <Group mt={'md'}>
          <Button disabled={!name} onClick={doUpdate} loading={loading}>
            Save
          </Button>
        </Group>
      </Card>
    </Grid.Col>
  );
};
