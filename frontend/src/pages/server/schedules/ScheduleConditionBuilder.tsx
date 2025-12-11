import { faMinus, faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ActionIcon, Group, Select, Stack, Text } from '@mantine/core';
import Button from '@/elements/Button';
import { scheduleConditionLabelMapping } from '@/lib/enums';
import ScheduleDynamicParameterInput from './ScheduleDynamicParameterInput';

const maxConditionDepth = 3;

interface ConditionBuilderProps {
  condition: ScheduleCondition;
  onChange: (condition: ScheduleCondition) => void;
  depth?: number;
}

export default function ScheduleConditionBuilder({ condition, onChange, depth = 0 }: ConditionBuilderProps) {
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
      case 'not':
        onChange({ type: 'not', condition: { type: 'none' } });
        break;
      case 'variable_exists':
        onChange({ type: 'variable_exists', variable: { variable: '' } });
        break;
      case 'variable_equals':
        onChange({ type: 'variable_equals', variable: { variable: '' }, equals: '' });
        break;
      case 'variable_contains':
        onChange({ type: 'variable_contains', variable: { variable: '' }, contains: '' });
        break;
      case 'variable_starts_with':
        onChange({ type: 'variable_starts_with', variable: { variable: '' }, startsWith: '' });
        break;
      case 'variable_ends_with':
        onChange({ type: 'variable_ends_with', variable: { variable: '' }, endsWith: '' });
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
    <div style={{ marginLeft: depth * 20 }}>
      <Stack>
        <Select
          label='Condition Type'
          value={condition.type}
          onChange={(value) => value && handleTypeChange(value)}
          data={Object.entries(scheduleConditionLabelMapping)
            .map(([value, label]) => ({
              value,
              label,
            }))
            .filter((c) => depth < maxConditionDepth || !['and', 'or', 'not'].includes(c.value))}
        />

        {(condition.type === 'variable_exists' ||
          condition.type === 'variable_equals' ||
          condition.type === 'variable_contains' ||
          condition.type === 'variable_starts_with' ||
          condition.type === 'variable_ends_with') && (
          <ScheduleDynamicParameterInput
            label='Variable'
            allowString={false}
            value={condition.variable}
            onChange={(v) => onChange({ ...condition, variable: v })}
          />
        )}

        {condition.type === 'variable_equals' && (
          <ScheduleDynamicParameterInput
            label='Equals'
            value={condition.equals}
            onChange={(v) => onChange({ ...condition, equals: v })}
          />
        )}
        {condition.type === 'variable_contains' && (
          <ScheduleDynamicParameterInput
            label='Contains'
            value={condition.contains}
            onChange={(v) => onChange({ ...condition, contains: v })}
          />
        )}
        {condition.type === 'variable_starts_with' && (
          <ScheduleDynamicParameterInput
            label='Starts With'
            value={condition.startsWith}
            onChange={(v) => onChange({ ...condition, startsWith: v })}
          />
        )}
        {condition.type === 'variable_ends_with' && (
          <ScheduleDynamicParameterInput
            label='Ends With'
            value={condition.endsWith}
            onChange={(v) => onChange({ ...condition, endsWith: v })}
          />
        )}

        {(condition.type === 'and' || condition.type === 'or') && (
          <>
            {depth < maxConditionDepth && (
              <Group>
                <Text size='sm'>
                  {condition.type === 'and' ? 'All conditions must be true:' : 'Any condition must be true:'}
                </Text>
                <Button
                  size='xs'
                  variant='light'
                  leftSection={<FontAwesomeIcon icon={faPlus} />}
                  onClick={addNestedCondition}
                >
                  Add Condition
                </Button>
              </Group>
            )}

            {condition.conditions.map((nestedCondition, index) => (
              <Group key={index} align='flex-start'>
                <div style={{ flex: 1 }}>
                  <ScheduleConditionBuilder
                    condition={nestedCondition}
                    onChange={(newCondition) => handleNestedConditionChange(index, newCondition)}
                    depth={depth + 1}
                  />
                </div>
                <ActionIcon color='red' variant='light' onClick={() => removeNestedCondition(index)}>
                  <FontAwesomeIcon icon={faMinus} />
                </ActionIcon>
              </Group>
            ))}
          </>
        )}
        {condition.type === 'not' && (
          <>
            <Text size='sm'>Condition must not be true:</Text>

            <div style={{ flex: 1 }}>
              <ScheduleConditionBuilder
                condition={condition.condition}
                onChange={(nestedCondition) => onChange({ ...condition, condition: nestedCondition })}
                depth={depth + 1}
              />
            </div>
          </>
        )}
      </Stack>
    </div>
  );
}
