import { httpErrorToHuman } from '@/api/axios';
import updateAutokill from '@/api/server/settings/updateAutokill';
import NewButton from '@/elements/button/NewButton';
import Card from '@/elements/Card';
import NumberInput from '@/elements/inputnew/NumberInput';
import Switch from '@/elements/inputnew/Switch';
import { load } from '@/lib/debounce';
import { useToast } from '@/providers/ToastProvider';
import { useServerStore } from '@/stores/server';
import { Grid, Group, Title } from '@mantine/core';
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
        <Title order={2} c={'white'}>
          Auto-Kill
        </Title>

        <Switch label={'Enabled'} checked={enabled} onChange={(e) => setEnabled(e.target.checked)} mt={'sm'} />

        <NumberInput
          label={'Seconds until auto-kill'}
          value={seconds}
          min={0}
          max={3600}
          onChange={(value) => setSeconds(Number(value))}
          mt={'sm'}
        />

        <Group mt={'md'}>
          <NewButton onClick={doUpdate} loading={loading}>
            Save
          </NewButton>
        </Group>
      </Card>
    </Grid.Col>
  );
};
