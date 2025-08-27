import { ActionIcon, Group, Paper, Select, Stack, Text } from '@mantine/core';
import NumberInput from '@/elements/input/NumberInput';
import Button from '@/elements/Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMinus, faPlus } from '@fortawesome/free-solid-svg-icons';
import {
  scheduleComparatorLabelMapping,
  scheduleConditionLabelMapping,
  serverPowerStateLabelMapping,
} from '@/lib/enums';
import { bytesToString, parseSize } from '@/lib/size';
import TextInput from '@/elements/input/TextInput';
import { useState } from 'react';

const maxConditionDepth = 3;

interface ConditionBuilderProps {
  condition: ScheduleCondition;
  onChange: (condition: ScheduleCondition) => void;
  depth?: number;
}

const ScheduleConditionBuilder = ({ condition, onChange, depth = 0 }: ConditionBuilderProps) => {
  const [sizeInput, setSizeInput] = useState(
    condition.type === 'memory_usage' || condition.type === 'disk_usage' ? bytesToString(condition.value) : '',
  );

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
          data={Object.entries(scheduleConditionLabelMapping)
            .map(([value, label]) => ({
              value,
              label,
            }))
            .filter((c) => depth < maxConditionDepth || !['and', 'or'].includes(c.value))}
        />

        {condition.type === 'server_state' && (
          <Select
            label={'Server State'}
            value={condition.state}
            onChange={(value) => value && onChange({ ...condition, state: value as ServerPowerState })}
            data={Object.entries(serverPowerStateLabelMapping).map(([value, label]) => ({
              value,
              label,
            }))}
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
              data={Object.entries(scheduleComparatorLabelMapping).map(([value, label]) => ({
                value,
                label,
              }))}
            />
            {condition.type === 'uptime' && (
              <NumberInput
                label={'Value (seconds)'}
                value={Number(condition.value) / 1000}
                onChange={(value) => onChange({ ...condition, value: Number(value) * 1000 || 0 })}
                min={0}
              />
            )}
            {condition.type === 'cpu_usage' && (
              <NumberInput
                label={'Value (%)'}
                value={condition.value}
                onChange={(value) => onChange({ ...condition, value: Number(value) || 0 })}
                min={0}
              />
            )}
            {(condition.type === 'memory_usage' || condition.type === 'disk_usage') && (
              <TextInput
                label={'Value + Unit (e.g. 2GB)'}
                value={sizeInput}
                onChange={(e) => {
                  const input = e.currentTarget.value;
                  setSizeInput(input);

                  try {
                    const parsed = parseSize(input);
                    if (parsed > 0) {
                      onChange({ ...condition, value: parsed });
                    }
                  } catch {
                    // ignore invalid intermediate states
                  }
                }}
              />
            )}
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
                  <ScheduleConditionBuilder
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

export default ScheduleConditionBuilder;
