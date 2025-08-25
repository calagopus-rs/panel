import { httpErrorToHuman } from '@/api/axios';
import createSchedule from '@/api/server/schedules/createSchedule';
import Button from '@/elements/Button';
import Select from '@/elements/input/Select';
import Switch from '@/elements/input/Switch';
import TextInput from '@/elements/input/TextInput';
import Modal from '@/elements/modals/Modal';
import { load } from '@/lib/debounce';
import { useToast } from '@/providers/ToastProvider';
import { useServerStore } from '@/stores/server';
import { Group, ModalProps, Text } from '@mantine/core';
import { useState } from 'react';

export default ({ opened, onClose }: ModalProps) => {
  const { addToast } = useToast();
  const { server, addSchedule } = useServerStore();

  const [name, setName] = useState('');
  const [enabled, setEnabled] = useState(true);
  const [triggers, setTriggers] = useState<ScheduleTrigger[]>([]);
  const [condition, setCondition] = useState<ScheduleCondition>({ type: 'none' });
  const [loading, setLoading] = useState(false);

  const doClose = () => {
    setName('');
    setEnabled(true);
    setTriggers([]);
    setCondition(null);
    onClose();
  };

  const doCreate = () => {
    load(true, setLoading);

    createSchedule(server.uuid, { name, enabled, triggers, condition })
      .then((schedule) => {
        addToast('Schedule created.', 'success');
        onClose();
        addSchedule(schedule);
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      })
      .finally(() => load(false, setLoading));
  };

  return (
    <Modal title={'Create Schedule'} onClose={doClose} opened={opened} size={'xl'}>
      <TextInput
        label={'Schedule Name'}
        placeholder={'Schedule Name'}
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <Switch
        label={'Enabled'}
        name={'enabled'}
        checked={enabled}
        onChange={(e) => setEnabled(e.target.checked)}
        mt={'sm'}
      />

      <Text mt={'sm'}>Triggers</Text>
      {triggers.map((trigger, index) => (
        <Group key={index} grow>
          <Select
            label={`Trigger ${index + 1}`}
            placeholder={`Trigger ${index + 1}`}
            value={trigger.type}
            onChange={(value) => {
              switch (value) {
                case 'cron':
                  setTriggers((triggers) => [
                    ...triggers.slice(0, index),
                    { type: 'cron', schedule: '' } as ScheduleTriggerCron,
                    ...triggers.slice(index + 1),
                  ]);
                  break;
                case 'power_action':
                  setTriggers((triggers) => [
                    ...triggers.slice(0, index),
                    { type: 'power_action', action: null } as ScheduleTriggerPowerAction,
                    ...triggers.slice(index + 1),
                  ]);
                  break;
                case 'server_state':
                  setTriggers((triggers) => [
                    ...triggers.slice(0, index),
                    { type: 'server_state', state: null } as ScheduleTriggerServerState,
                    ...triggers.slice(index + 1),
                  ]);
                  break;
                case 'crash':
                  setTriggers((triggers) => [
                    ...triggers.slice(0, index),
                    { type: 'crash' } as ScheduleTriggerCrash,
                    ...triggers.slice(index + 1),
                  ]);
                  break;
                default:
                  throw new Error(`Unknown trigger type: ${value}`);
              }
            }}
            data={[
              { value: 'cron', label: 'Cron' },
              { value: 'power_action', label: 'Power Action' },
              { value: 'server_state', label: 'Server State' },
              { value: 'crash', label: 'Crash' },
            ]}
            mt={'sm'}
          />

          {trigger.type === 'cron' ? (
            <TextInput
              label={'Cron Schedule'}
              placeholder={'Cron Schedule'}
              value={trigger.schedule}
              onChange={(e) => {
                setTriggers((triggers) => [
                  ...triggers.slice(0, index),
                  { type: 'cron', schedule: e.target.value } as ScheduleTriggerCron,
                  ...triggers.slice(index + 1),
                ]);
              }}
              mt={'sm'}
            />
          ) : trigger.type === 'power_action' ? (
            <Select
              label={'Power Action'}
              placeholder={'Power Action'}
              value={trigger.action}
              onChange={(value) => {
                setTriggers((triggers) => [
                  ...triggers.slice(0, index),
                  { type: 'power_action', action: value } as ScheduleTriggerPowerAction,
                  ...triggers.slice(index + 1),
                ]);
              }}
              data={[
                { value: 'start', label: 'Start' },
                { value: 'stop', label: 'Stop' },
                { value: 'restart', label: 'Restart' },
                { value: 'kill', label: 'Kill' },
              ]}
              mt={'sm'}
            />
          ) : trigger.type === 'server_state' ? (
            <Select
              label={'Server State'}
              placeholder={'Server State'}
              value={trigger.state}
              onChange={(value) => {
                setTriggers((triggers) => [
                  ...triggers.slice(0, index),
                  { type: 'server_state', state: value } as ScheduleTriggerServerState,
                  ...triggers.slice(index + 1),
                ]);
              }}
              data={[
                { value: 'running', label: 'Running' },
                { value: 'offline', label: 'Offline' },
              ]}
              mt={'sm'}
            />
          ) : null}
        </Group>
      ))}
      <Button
        onClick={() => setTriggers((triggers) => [...triggers, { type: 'cron', schedule: '' } as ScheduleTriggerCron])}
        mt={'sm'}
      >
        Add Trigger
      </Button>

      <Text mt={'sm'}>Condition</Text>

      <Group mt={'md'}>
        <Button onClick={doCreate} loading={loading} disabled={!name}>
          Create
        </Button>
        <Button variant={'default'} onClick={doClose}>
          Close
        </Button>
      </Group>
    </Modal>
  );
};
