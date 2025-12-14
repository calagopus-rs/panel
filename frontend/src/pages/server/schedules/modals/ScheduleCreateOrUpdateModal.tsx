import { faMinus, faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ActionIcon, Group, ModalProps, Popover, Stack, Title } from '@mantine/core';
import { useEffect, useState } from 'react';
import { httpErrorToHuman } from '@/api/axios.ts';
import createSchedule from '@/api/server/schedules/createSchedule.ts';
import Button from '@/elements/Button.tsx';
import Select from '@/elements/input/Select.tsx';
import Switch from '@/elements/input/Switch.tsx';
import TextInput from '@/elements/input/TextInput.tsx';
import Modal from '@/elements/modals/Modal.tsx';
import { serverBackupStatusLabelMapping, serverPowerStateLabelMapping } from '@/lib/enums.ts';
import { useToast } from '@/providers/ToastProvider.tsx';
import { useServerStore } from '@/stores/server.ts';
import updateSchedule from '@/api/server/schedules/updateSchedule.ts';
import ScheduleDynamicParameterInput from '../ScheduleDynamicParameterInput.tsx';
import Divider from '@/elements/Divider.tsx';

interface CrontabEditorProps {
  value: string;
  setValue: (value: string) => void;
}

const CRON_SEGMENTS = ['Second', 'Minute', 'Hour', 'Day', 'Month', 'Weekday'] as const;

function CrontabEditor({ value, setValue }: CrontabEditorProps) {
  const [segments, setSegments] = useState(['0', '0', '0', '0', '0', '0']);

  useEffect(() => {
    const newSegments = value.split(' ');
    if (segments.every((s, i) => newSegments[i] === s)) {
      return;
    }

    for (let i = 0; i < CRON_SEGMENTS.length; i++) {
      if (!newSegments[i]) {
        newSegments[i] = '0';
      }
    }

    setSegments(newSegments);
  }, [segments, value]);

  const setSegment = (index: number, value: string) => {
    const newSegments = [...segments.slice(0, index), value, ...segments.slice(index + 1)];
    setSegments(newSegments);

    setValue(newSegments.join(' '));
  };

  return (
    <div className='grid grid-cols-3 gap-2 w-64'>
      {CRON_SEGMENTS.map((label, i) => (
        <TextInput
          key={label}
          label={label}
          placeholder={label}
          value={segments[i]}
          className='flex-1'
          onChange={(e) => setSegment(i, e.target.value)}
        />
      ))}
    </div>
  );
}

type Props = ModalProps & {
  propSchedule?: ServerSchedule;
  onScheduleUpdate?: (schedule: Partial<ServerSchedule>) => void;
};

export default function ScheduleCreateOrUpdateModal({ propSchedule, onScheduleUpdate, opened, onClose }: Props) {
  const { addToast } = useToast();
  const { server, addSchedule } = useServerStore();

  const [name, setName] = useState('');
  const [enabled, setEnabled] = useState(true);
  const [triggers, setTriggers] = useState<ScheduleTrigger[]>([]);
  const [condition, setCondition] = useState<SchedulePreCondition>({ type: 'none' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (propSchedule) {
      setName(propSchedule.name);
      setEnabled(propSchedule.enabled);
      setTriggers(propSchedule.triggers);
    }
  }, [propSchedule]);

  const doCreateOrUpdate = () => {
    setLoading(true);

    if (propSchedule?.uuid) {
      updateSchedule(server.uuid, propSchedule.uuid, { name, enabled, triggers })
        .then(() => {
          addToast('Schedule updated.', 'success');
          onClose();
          onScheduleUpdate!({ name, enabled, triggers });
        })
        .catch((msg) => {
          addToast(httpErrorToHuman(msg), 'error');
        })
        .finally(() => setLoading(false));
    } else {
      createSchedule(server.uuid, { name, enabled, triggers, condition })
        .then((schedule) => {
          addToast('Schedule created.', 'success');
          setName('');
          setEnabled(true);
          setTriggers([]);
          setCondition({ type: 'none' });
          onClose();
          addSchedule(schedule);
        })
        .catch((msg) => {
          addToast(httpErrorToHuman(msg), 'error');
        })
        .finally(() => setLoading(false));
    }
  };

  return (
    <Modal title={`${propSchedule?.uuid ? 'Update' : 'Create'} Schedule`} onClose={onClose} opened={opened}>
      <Stack>
        <TextInput
          label='Schedule Name'
          placeholder='Schedule Name'
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <Switch label='Enabled' name='enabled' checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />

        <div>
          <Title order={4} mb='sm'>
            Triggers
          </Title>
          {triggers.map((trigger, index) => (
            <div key={`trigger-${index}`} className='flex flex-col'>
              {index !== 0 && <Divider my='sm' />}

              <div className='flex flex-row items-end space-x-2 mb-2'>
                <Select
                  label={`Trigger ${index + 1}`}
                  placeholder={`Trigger ${index + 1}`}
                  value={trigger.type}
                  className='flex-1'
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
                          { type: 'power_action', action: 'start' } as ScheduleTriggerPowerAction,
                          ...triggers.slice(index + 1),
                        ]);
                        break;
                      case 'server_state':
                        setTriggers((triggers) => [
                          ...triggers.slice(0, index),
                          { type: 'server_state', state: 'running' } as ScheduleTriggerServerState,
                          ...triggers.slice(index + 1),
                        ]);
                        break;
                      case 'backup_status':
                        setTriggers((triggers) => [
                          ...triggers.slice(0, index),
                          { type: 'backup_status', status: 'starting' } as ScheduleTriggerBackupStatus,
                          ...triggers.slice(index + 1),
                        ]);
                        break;
                      case 'console_line':
                        setTriggers((triggers) => [
                          ...triggers.slice(0, index),
                          { type: 'console_line', contains: '', outputInto: null } as ScheduleTriggerConsoleLine,
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
                    { value: 'backup_status', label: 'Backup Status' },
                    { value: 'console_line', label: 'Console Line' },
                    { value: 'crash', label: 'Crash' },
                  ]}
                />

                {trigger.type === 'cron' ? (
                  <Popover>
                    <Popover.Target>
                      <TextInput
                        label='Cron Schedule'
                        placeholder='Cron Schedule'
                        value={trigger.schedule}
                        className='flex-1'
                        onChange={(e) => {
                          setTriggers((triggers) => [
                            ...triggers.slice(0, index),
                            { type: 'cron', schedule: e.target.value } as ScheduleTriggerCron,
                            ...triggers.slice(index + 1),
                          ]);
                        }}
                      />
                    </Popover.Target>
                    <Popover.Dropdown>
                      <CrontabEditor
                        value={trigger.schedule}
                        setValue={(value) =>
                          setTriggers((triggers) => [
                            ...triggers.slice(0, index),
                            { type: 'cron', schedule: value } as ScheduleTriggerCron,
                            ...triggers.slice(index + 1),
                          ])
                        }
                      />
                    </Popover.Dropdown>
                  </Popover>
                ) : trigger.type === 'power_action' ? (
                  <Select
                    label='Power Action'
                    placeholder='Power Action'
                    value={trigger.action}
                    className='flex-1'
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
                    label='Server State'
                    placeholder='Server State'
                    value={trigger.state}
                    className='flex-1'
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
                ) : trigger.type === 'backup_status' ? (
                  <Select
                    label='Backup Status'
                    placeholder='Backup Status'
                    value={trigger.status}
                    className='flex-1'
                    onChange={(value) => {
                      setTriggers((triggers) => [
                        ...triggers.slice(0, index),
                        { type: 'backup_status', status: value } as ScheduleTriggerBackupStatus,
                        ...triggers.slice(index + 1),
                      ]);
                    }}
                    data={Object.entries(serverBackupStatusLabelMapping).map(([value, label]) => ({
                      value,
                      label,
                    }))}
                  />
                ) : trigger.type === 'console_line' ? (
                  <TextInput
                    label='Line Contains'
                    placeholder='Line Contains'
                    value={trigger.contains}
                    className='flex-1'
                    onChange={(e) => {
                      setTriggers((triggers) => [
                        ...triggers.slice(0, index),
                        { ...triggers[index], contains: e.target.value } as ScheduleTriggerConsoleLine,
                        ...triggers.slice(index + 1),
                      ]);
                    }}
                  />
                ) : null}

                <ActionIcon
                  size='input-sm'
                  color='red'
                  variant='light'
                  onClick={() => setTriggers((triggers) => [...triggers.filter((t) => t !== trigger)])}
                >
                  <FontAwesomeIcon icon={faMinus} />
                </ActionIcon>
              </div>
              {trigger.type === 'console_line' ? (
                <ScheduleDynamicParameterInput
                  label='Output into'
                  placeholder='Output the captured line into a variable'
                  className='mb-2'
                  allowNull
                  allowString={false}
                  value={trigger.outputInto}
                  onChange={(v) => {
                    setTriggers((triggers) => [
                      ...triggers.slice(0, index),
                      { ...triggers[index], outputInto: v } as ScheduleTriggerConsoleLine,
                      ...triggers.slice(index + 1),
                    ]);
                  }}
                />
              ) : null}
            </div>
          ))}

          <Button
            onClick={() =>
              setTriggers((triggers) => [...triggers, { type: 'cron', schedule: '' } as ScheduleTriggerCron])
            }
            variant='light'
            leftSection={<FontAwesomeIcon icon={faPlus} />}
          >
            Add Trigger
          </Button>
        </div>

        <Group>
          <Button onClick={doCreateOrUpdate} loading={loading} disabled={!name}>
            {propSchedule?.uuid ? 'Update' : 'Create'}
          </Button>
          <Button variant='default' onClick={onClose}>
            Close
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
