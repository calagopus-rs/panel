import { httpErrorToHuman } from '@/api/axios';
import createSchedule from '@/api/server/schedules/createSchedule';
import Button from '@/elements/Button';
import Select from '@/elements/input/Select';
import Switch from '@/elements/input/Switch';
import TextInput from '@/elements/input/TextInput';
import Modal from '@/elements/modals/Modal';
import { load } from '@/lib/debounce';
import { serverPowerStateLabelMapping } from '@/lib/enums';
import { useToast } from '@/providers/ToastProvider';
import { useServerStore } from '@/stores/server';
import { faMinus, faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Group, ModalProps, Text, Stack } from '@mantine/core';
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
    setCondition({ type: 'none' });
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
      <Stack>
        <TextInput
          label={'Schedule Name'}
          placeholder={'Schedule Name'}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <Switch label={'Enabled'} name={'enabled'} checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />

        <div>
          <Text mb={'sm'}>Triggers</Text>
          {triggers.map((trigger, index) => (
            <Group key={index} grow mb={'sm'}>
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
                  data={Object.entries(serverPowerStateLabelMapping).map(([value, label]) => ({
                    value,
                    label,
                  }))}
                />
              ) : null}
            </Group>
          ))}
          <Button
            onClick={() =>
              setTriggers((triggers) => [...triggers, { type: 'cron', schedule: '' } as ScheduleTriggerCron])
            }
            variant={'light'}
            leftSection={<FontAwesomeIcon icon={faPlus} />}
          >
            Add Trigger
          </Button>
          <Button
            className={'ml-2'}
            onClick={() => setTriggers((triggers) => [...triggers.slice(0, -1)])}
            color={'red'}
            variant={'light'}
            leftSection={<FontAwesomeIcon icon={faMinus} />}
          >
            Remove Trigger
          </Button>
        </div>

        <Group>
          <Button onClick={doCreate} loading={loading} disabled={!name}>
            Create
          </Button>
          <Button variant={'default'} onClick={doClose}>
            Close
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};
