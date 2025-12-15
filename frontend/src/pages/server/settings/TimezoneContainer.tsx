import { Grid, Group, Stack, Text, Title } from '@mantine/core';
import { useForm } from '@mantine/form';
import { zod4Resolver } from 'mantine-form-zod-resolver';
import { useEffect, useState } from 'react';
import { zones } from 'tzdata';
import { z } from 'zod';
import { httpErrorToHuman } from '@/api/axios.ts';
import updateTimezone from '@/api/server/settings/updateTimezone.ts';
import Button from '@/elements/Button.tsx';
import Card from '@/elements/Card.tsx';
import Select from '@/elements/input/Select.tsx';
import { serverSettingsTimezoneSchema } from '@/lib/schemas/server/settings.ts';
import { useToast } from '@/providers/ToastProvider.tsx';
import { useServerStore } from '@/stores/server.ts';

const timezones = Object.keys(zones)
  .sort()
  .map((zone) => ({
    value: zone,
    label: zone,
  }));

export default function TimezoneContainer() {
  const { addToast } = useToast();
  const server = useServerStore((state) => state.server);

  const [loading, setLoading] = useState(false);
  const [time, setTime] = useState('');

  const form = useForm<z.infer<typeof serverSettingsTimezoneSchema>>({
    initialValues: {
      timezone: server.timezone ?? '',
    },
    validateInputOnBlur: true,
    validate: zod4Resolver(serverSettingsTimezoneSchema),
  });

  const doUpdate = () => {
    setLoading(true);
    updateTimezone(server.uuid, form.values)
      .then(() => {
        addToast('Server timezone updated.', 'success');
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (form.values.timezone) {
      setTime(new Date().toLocaleString('en-US', { timeZone: form.values.timezone }));

      const interval = setInterval(() => {
        setTime(new Date().toLocaleString('en-US', { timeZone: form.values.timezone! }));
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [form.values.timezone]);

  return (
    <Grid.Col span={{ base: 12, md: 6, lg: 4 }}>
      <Card h='100%'>
        <form onSubmit={form.onSubmit(() => doUpdate())}>
          <Stack h='100%'>
            <Title order={2} c='white'>
              Timezone
            </Title>

            <Stack gap='xs'>
              <Select
                withAsterisk
                label='Timezone'
                data={[
                  {
                    label: 'System',
                    value: '',
                  },
                  ...timezones,
                ]}
                searchable
                {...form.getInputProps('timezone')}
              />
              <Text>{time}</Text>
            </Stack>

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
