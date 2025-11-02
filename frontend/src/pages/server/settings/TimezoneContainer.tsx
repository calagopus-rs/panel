import { httpErrorToHuman } from '@/api/axios';
import updateTimezone from '@/api/server/settings/updateTimezone';
import Button from '@/elements/Button';
import Card from '@/elements/Card';
import Select from '@/elements/input/Select';
import { load } from '@/lib/debounce';
import { useToast } from '@/providers/ToastProvider';
import { useServerStore } from '@/stores/server';
import { Grid, Group, Stack, Text, Title } from '@mantine/core';
import { useEffect, useState } from 'react';
import { zones } from 'tzdata';

const timezones = Object.keys(zones)
  .sort()
  .map((zone) => ({
    value: zone,
    label: zone,
  }));

export default () => {
  const { addToast } = useToast();
  const server = useServerStore((state) => state.server);

  const [loading, setLoading] = useState(false);
  const [timezone, setTimezone] = useState(server.timezone || '');
  const [time, setTime] = useState('');

  const doUpdate = () => {
    load(true, setLoading);
    updateTimezone(server.uuid, timezone || null)
      .then(() => {
        addToast('Server timezone updated.', 'success');
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      })
      .finally(() => {
        load(false, setLoading);
      });
  };

  useEffect(() => {
    if (timezone) {
      setTime(new Date().toLocaleString('en-US', { timeZone: timezone }));

      const interval = setInterval(() => {
        setTime(new Date().toLocaleString('en-US', { timeZone: timezone }));
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [timezone]);

  return (
    <Grid.Col span={{ base: 12, md: 6, lg: 4 }}>
      <Card h='100%'>
        <Stack h='100%'>
          <Title order={2} c={'white'}>
            Timezone
          </Title>

          <Stack gap={'xs'}>
            <Select
              withAsterisk
              label={'Timezone'}
              value={timezone}
              onChange={(value) => setTimezone(value)}
              data={[
                {
                  label: 'System',
                  value: '',
                },
                ...timezones,
              ]}
              searchable
            />
            <Text>{time}</Text>
          </Stack>

          <Group mt='auto'>
            <Button onClick={doUpdate} loading={loading}>
              Save
            </Button>
          </Group>
        </Stack>
      </Card>
    </Grid.Col>
  );
};
