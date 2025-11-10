import { Group, Title } from '@mantine/core';
import Badge from '@/elements/Badge';
import Card from '@/elements/Card';
import NumberInput from '@/elements/input/NumberInput';
import Select from '@/elements/input/Select';
import Switch from '@/elements/input/Switch';
import TextInput from '@/elements/input/TextInput';
import Tooltip from '@/elements/Tooltip';

export default function VariableContainer({
  variable,
  overrideReadonly = false,
  loading = false,
  value,
  setValue,
}: {
  variable: ServerVariable;
  overrideReadonly?: boolean;
  loading?: boolean;
  value: string;
  setValue: (value: string) => void;
}) {
  return (
    <Card className={'flex flex-col justify-between rounded-md p-4 h-full'}>
      <Title order={2} c={'white'}>
        <Group justify='space-between' align='center'>
          {variable.name}
          {!variable.isEditable && overrideReadonly ? (
            <Tooltip label={'This field is not editable by a user, but you can override it.'}>
              <Badge color={'orange'}>Override Read Only</Badge>
            </Tooltip>
          ) : !variable.isEditable ? (
            <Badge>Read Only</Badge>
          ) : null}
        </Group>
      </Title>

      <div className={'mt-4'}>
        {variable.rules.includes('boolean') ||
        (variable.rules.includes('string') &&
          (variable.rules.includes('in:1,0') ||
            variable.rules.includes('in:0,1') ||
            variable.rules.includes('in:true,false') ||
            variable.rules.includes('in:false,true'))) ? (
          <Switch
            name={variable.envVariable}
            defaultChecked={value === '1' || value === 'true'}
            onChange={(e) => setValue(e.target.checked ? '1' : '0')}
            disabled={loading || (!variable.isEditable && !overrideReadonly)}
            label={variable.name}
          />
        ) : variable.rules.includes('string') && variable.rules.some((rule) => rule.startsWith('in:')) ? (
          <Select
            withAsterisk={variable.rules.includes('required')}
            id={variable.envVariable}
            data={variable.rules
              .find((rule) => rule.startsWith('in:'))
              ?.replace('in:', '')
              .split(',')
              .map((option) => ({ value: option, label: option }))}
            value={value}
            onChange={(value) => setValue(value)}
            disabled={loading || (!variable.isEditable && !overrideReadonly)}
          />
        ) : variable.rules.includes('integer') ||
          variable.rules.includes('int') ||
          variable.rules.includes('numeric') ||
          variable.rules.includes('num') ? (
          <NumberInput
            withAsterisk={variable.rules.includes('required')}
            id={variable.envVariable}
            placeholder={variable.defaultValue}
            value={value}
            onChange={(value) => setValue(String(value))}
            disabled={loading || (!variable.isEditable && !overrideReadonly)}
          />
        ) : (
          <TextInput
            withAsterisk={variable.rules.includes('required')}
            id={variable.envVariable}
            placeholder={variable.defaultValue}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            disabled={loading || (!variable.isEditable && !overrideReadonly)}
          />
        )}
        <p className={'text-gray-400 text-sm mt-4'}>{variable.description}</p>
      </div>
    </Card>
  );
}
