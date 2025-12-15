import { Grid, Group, Stack, Title } from '@mantine/core';
import { useForm } from '@mantine/form';
import { zod4Resolver } from 'mantine-form-zod-resolver';
import { useState } from 'react';
import { z } from 'zod';
import { httpErrorToHuman } from '@/api/axios.ts';
import updateAutokill from '@/api/server/settings/updateAutokill.ts';
import Button from '@/elements/Button.tsx';
import Card from '@/elements/Card.tsx';
import NumberInput from '@/elements/input/NumberInput.tsx';
import Switch from '@/elements/input/Switch.tsx';
import { serverSettingsAutokillSchema } from '@/lib/schemas/server/settings.ts';
import { useToast } from '@/providers/ToastProvider.tsx';
import { useServerStore } from '@/stores/server.ts';

export default function AutokillContainer() {
  const { addToast } = useToast();
  const server = useServerStore((state) => state.server);

  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof serverSettingsAutokillSchema>>({
    initialValues: {
      enabled: server.autoKill.enabled,
      seconds: server.autoKill.seconds,
    },
    validateInputOnBlur: true,
    validate: zod4Resolver(serverSettingsAutokillSchema),
  });

  const doUpdate = () => {
    setLoading(true);
    updateAutokill(server.uuid, form.values)
      .then(() => {
        addToast('Server auto-kill updated.', 'success');
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
              Auto-Kill
            </Title>

            <Switch
              label='Enabled'
              checked={form.values.enabled}
              onChange={(e) => form.setFieldValue('enabled', e.target.checked)}
            />
            <NumberInput label='Seconds until auto-kill' min={0} max={3600} {...form.getInputProps('seconds')} />

            <Group mt='auto'>
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
