import { httpErrorToHuman } from '@/api/axios';
import updateVariable from '@/api/server/startup/updateVariable';
import Badge from '@/elements/Badge';
import Button from '@/elements/Button';
import Card from '@/elements/Card';
import NumberInput from '@/elements/input/NumberInput';
import Select from '@/elements/input/Select';
import Switch from '@/elements/input/Switch';
import TextInput from '@/elements/input/TextInput';
import { load } from '@/lib/debounce';
import { useToast } from '@/providers/ToastProvider';
import { useServerStore } from '@/stores/server';
import { Group, Title } from '@mantine/core';
import { useState } from 'react';

export default ({ variable }: { variable: ServerVariable }) => {
  const { addToast } = useToast();
  const { server, updateVariable: updateStoreVariable } = useServerStore();

  const serverValue = variable.value ?? variable.defaultValue;
  const [loading, setLoading] = useState(false);
  const [value, setValue] = useState(serverValue);

  const doUpdate = () => {
    load(true, setLoading);
    updateVariable(server.uuid, { envVariable: variable.envVariable, value })
      .then(() => {
        addToast('Server variable updated.', 'success');
        updateStoreVariable(variable.envVariable, { value });
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      })
      .finally(() => {
        load(false, setLoading);
      });
  };

  return (
    <Card className={'flex flex-col justify-between rounded-md p-4 h-full'}>
      <Title order={2} c={'white'}>
        <Group justify='space-between' align='center'>
          {variable.name} {!variable.isEditable && <Badge>Read Only</Badge>}
        </Group>
      </Title>

      <div className={'mt-4'}>
        {variable.rules.includes('boolean') ||
        (variable.rules.includes('string') &&
          (variable.rules.includes('in:1,0') || variable.rules.includes('in:true,false'))) ? (
          <Switch
            name={variable.envVariable}
            defaultChecked={value === '1' || value === 'true'}
            onChange={(e) => setValue(e.target.checked ? '1' : '0')}
            disabled={loading || !variable.isEditable}
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
            disabled={loading || !variable.isEditable}
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
            disabled={loading || !variable.isEditable}
          />
        ) : (
          <TextInput
            withAsterisk={variable.rules.includes('required')}
            id={variable.envVariable}
            placeholder={variable.defaultValue}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            disabled={loading || !variable.isEditable}
          />
        )}
        <p className={'text-gray-400 text-sm mt-4'}>{variable.description}</p>
      </div>

      <Group pt={'md'} mt={'auto'}>
        <Button
          disabled={!variable.isEditable || (variable.rules.includes('required') && !value) || value === serverValue}
          onClick={doUpdate}
          loading={loading}
        >
          Save
        </Button>
      </Group>
    </Card>
  );
};
