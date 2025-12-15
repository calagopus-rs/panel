import { Grid, Group, Stack, Title } from '@mantine/core';
import { useForm } from '@mantine/form';
import { zod4Resolver } from 'mantine-form-zod-resolver';
import { useState } from 'react';
import { z } from 'zod';
import { httpErrorToHuman } from '@/api/axios.ts';
import renameServer from '@/api/server/settings/renameServer.ts';
import Button from '@/elements/Button.tsx';
import Card from '@/elements/Card.tsx';
import TextArea from '@/elements/input/TextArea.tsx';
import TextInput from '@/elements/input/TextInput.tsx';
import { serverSettingsRenameSchema } from '@/lib/schemas/server/settings.ts';
import { useToast } from '@/providers/ToastProvider.tsx';
import { useServerStore } from '@/stores/server.ts';

export default function RenameContainer() {
  const { addToast } = useToast();
  const { server, updateServer } = useServerStore();

  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof serverSettingsRenameSchema>>({
    initialValues: {
      name: server.name,
      description: server.description ?? '',
    },
    validateInputOnBlur: true,
    validate: zod4Resolver(serverSettingsRenameSchema),
  });

  const doUpdate = () => {
    setLoading(true);
    renameServer(server.uuid, form.values)
      .then(() => {
        addToast('Server renamed.', 'success');
        updateServer(form.values);
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      })
      .finally(() => setLoading(false));
  };

  return (
    <Grid.Col span={{ base: 12, md: 6, lg: 4 }}>
      <Card h='100%'>
        <form onSubmit={form.onSubmit(() => doUpdate())}>
          <Stack h='100%'>
            <Title order={2} c='white'>
              Rename Server
            </Title>

            <TextInput withAsterisk label='Server Name' placeholder='Server Name' {...form.getInputProps('name')} />

            <TextArea label='Description' placeholder='Description' rows={3} {...form.getInputProps('description')} />

            <Group h='100%'>
              <Button type='submit' loading={loading} disabled={!form.isValid()}>
                Save
              </Button>
            </Group>
          </Stack>
        </form>
      </Card>
    </Grid.Col>
  );
}
