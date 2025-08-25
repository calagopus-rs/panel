import { httpErrorToHuman } from '@/api/axios';
import updateAutokill from '@/api/server/settings/updateAutokill';
import Button from '@/elements/Button';
import Card from '@/elements/Card';
import NumberInput from '@/elements/input/NumberInput';
import Switch from '@/elements/input/Switch';
import { load } from '@/lib/debounce';
import { useToast } from '@/providers/ToastProvider';
import { useServerStore } from '@/stores/server';
import { Grid, Group, Stack, Title } from '@mantine/core';
import { useState } from 'react';

export default () => {
  const { addToast } = useToast();
  const { server } = useServerStore();

  const [loading, setLoading] = useState(false);
  const [enabled, setEnabled] = useState(server.autoKill.enabled);
  const [seconds, setSeconds] = useState(server.autoKill.seconds);

  const doUpdate = () => {
    load(true, setLoading);
    updateAutokill(server.uuid, { enabled, seconds })
      .then(() => {
        addToast('Server auto-kill updated.', 'success');
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
        <Stack>
          <Title order={2} c={'white'}>
            Auto-Kill
          </Title>

          <Switch label={'Enabled'} checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
          <NumberInput
            label={'Seconds until auto-kill'}
            value={seconds}
            min={0}
            max={3600}
            onChange={(value) => setSeconds(Number(value))}
          />

          <Group>
            <Button onClick={doUpdate} loading={loading}>
              Save
            </Button>
          </Group>
        </Stack>
      </Card>
    </Grid.Col>
  );
};
