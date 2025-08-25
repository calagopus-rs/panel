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
import { faMinus, faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Group, ModalProps, Text, NumberInput, Stack, Paper, ActionIcon } from '@mantine/core';
import { useState } from 'react';

const maxConditionDepth = 3;

const comparatorOptions = [
  { value: 'smaller_than', label: 'Smaller Than' },
  { value: 'smaller_than_or_equals', label: 'Smaller Than or Equal' },
  { value: 'equal', label: 'Equals' },
  { value: 'greater_than', label: 'Greater Than' },
  { value: 'greater_than_or_equals', label: 'Greater Than or Equal' },
];

const serverStateOptions = [
  { value: 'running', label: 'Running' },
  { value: 'offline', label: 'Offline' },
  { value: 'starting', label: 'Starting' },
  { value: 'stopping', label: 'Stopping' },
];

const conditionTypeOptions = [
  { value: 'none', label: 'None' },
  { value: 'and', label: 'AND (All must be true)' },
  { value: 'or', label: 'OR (Any must be true)' },
  { value: 'server_state', label: 'Server State' },
  { value: 'uptime', label: 'Uptime' },
  { value: 'cpu_usage', label: 'CPU Usage' },
  { value: 'memory_usage', label: 'Memory Usage' },
  { value: 'disk_usage', label: 'Disk Usage' },
];

interface ConditionBuilderProps {
  condition: ScheduleCondition;
  onChange: (condition: ScheduleCondition) => void;
  depth?: number;
}

const ConditionBuilder = ({ condition, onChange, depth = 0 }: ConditionBuilderProps) => {
  const handleTypeChange = (type: string) => {
    switch (type) {
      case 'none':
        onChange({ type: 'none' });
        break;
      case 'and':
        onChange({ type: 'and', conditions: [] });
        break;
      case 'or':
        onChange({ type: 'or', conditions: [] });
        break;
      case 'server_state':
        onChange({ type: 'server_state', state: 'running' });
        break;
      case 'uptime':
        onChange({ type: 'uptime', comparator: 'greater_than', value: 0 });
        break;
      case 'cpu_usage':
        onChange({ type: 'cpu_usage', comparator: 'greater_than', value: 0 });
        break;
      case 'memory_usage':
        onChange({ type: 'memory_usage', comparator: 'greater_than', value: 0 });
        break;
      case 'disk_usage':
        onChange({ type: 'disk_usage', comparator: 'greater_than', value: 0 });
        break;
    }
  };

  const handleNestedConditionChange = (index: number, newCondition: ScheduleCondition) => {
    if (condition.type === 'and' || condition.type === 'or') {
      const newConditions = [...condition.conditions];
      newConditions[index] = newCondition;
      onChange({ ...condition, conditions: newConditions });
    }
  };

  const addNestedCondition = () => {
    if (condition.type === 'and' || condition.type === 'or') {
      onChange({
        ...condition,
        conditions: [...condition.conditions, { type: 'none' }],
      });
    }
  };

  const removeNestedCondition = (index: number) => {
    if (condition.type === 'and' || condition.type === 'or') {
      const newConditions = condition.conditions.filter((_, i) => i !== index);
      onChange({ ...condition, conditions: newConditions });
    }
  };

  return (
    <Paper p={'sm'} withBorder style={{ marginLeft: depth * 20 }}>
      <Stack>
        <Select
          label={'Condition Type'}
          value={condition.type}
          onChange={(value) => value && handleTypeChange(value)}
          data={
            depth >= maxConditionDepth
              ? conditionTypeOptions.filter((c) => !['and', 'or'].includes(c.value))
              : conditionTypeOptions
          }
        />

        {condition.type === 'server_state' && (
          <Select
            label={'Server State'}
            value={condition.state}
            onChange={(value) => value && onChange({ ...condition, state: value as ServerPowerState })}
            data={serverStateOptions}
          />
        )}

        {(condition.type === 'uptime' ||
          condition.type === 'cpu_usage' ||
          condition.type === 'memory_usage' ||
          condition.type === 'disk_usage') && (
          <Group grow>
            <Select
              label={'Comparator'}
              value={condition.comparator}
              onChange={(value) => value && onChange({ ...condition, comparator: value as ScheduleComparator })}
              data={comparatorOptions}
            />
            <NumberInput
              label={
                condition.type === 'uptime'
                  ? 'Value (seconds)'
                  : condition.type === 'cpu_usage'
                    ? 'Value (%)'
                    : condition.type === 'memory_usage' || condition.type === 'disk_usage'
                      ? 'Value (MiB)'
                      : ''
              }
              value={condition.value}
              onChange={(value) => onChange({ ...condition, value: Number(value) || 0 })}
              min={0}
            />
          </Group>
        )}

        {(condition.type === 'and' || condition.type === 'or') && (
          <>
            {depth < maxConditionDepth && (
              <Group>
                <Text size={'sm'}>
                  {condition.type === 'and' ? 'All conditions must be true:' : 'Any condition must be true:'}
                </Text>
                <Button
                  size={'xs'}
                  variant={'light'}
                  leftSection={<FontAwesomeIcon icon={faPlus} />}
                  onClick={addNestedCondition}
                >
                  Add Condition
                </Button>
              </Group>
            )}

            {condition.conditions.map((nestedCondition, index) => (
              <Group key={index} align={'flex-start'}>
                <div style={{ flex: 1 }}>
                  <ConditionBuilder
                    condition={nestedCondition}
                    onChange={(newCondition) => handleNestedConditionChange(index, newCondition)}
                    depth={depth + 1}
                  />
                </div>
                <ActionIcon color={'red'} variant={'light'} onClick={() => removeNestedCondition(index)}>
                  <FontAwesomeIcon icon={faMinus} />
                </ActionIcon>
              </Group>
            ))}
          </>
        )}
      </Stack>
    </Paper>
  );
};

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
                  data={serverStateOptions}
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
        </div>

        <div>
          <Text mb={'sm'}>Conditions</Text>
          <ConditionBuilder condition={condition} onChange={setCondition} />
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
