import { httpErrorToHuman } from '@/api/axios';
import updateVariable from '@/api/server/startup/updateVariable';
import Button from '@/elements/Button';
import Card from '@/elements/Card';
import NumberInput from '@/elements/input/NumberInput';
import Select from '@/elements/input/Select';
import Switch from '@/elements/input/Switch';
import TextInput from '@/elements/input/TextInput';
import { load } from '@/lib/debounce';
import { useToast } from '@/providers/ToastProvider';
import { useServerStore } from '@/stores/server';
import { Grid, Group, Title } from '@mantine/core';
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
    <Grid.Col span={{ base: 12, md: 6, lg: 4 }}>
      <Card>
        <Title order={2} c={'white'}>
          {variable.name}
        </Title>

        <div className={'mt-4'}>
          {variable.rules.includes('boolean') ||
          (variable.rules.includes('string') &&
            (variable.rules.includes('in:1,0') || variable.rules.includes('in:true,false'))) ? (
            <Switch
              name={variable.envVariable}
              defaultChecked={value === '1' || value === 'true'}
              onChange={(e) => setValue(e.target.checked ? '1' : '0')}
              label={variable.name}
            />
          ) : variable.rules.includes('string') && variable.rules.some((rule) => rule.startsWith('in:')) ? (
            <Select
              id={variable.envVariable}
              data={variable.rules
                .find((rule) => rule.startsWith('in:'))
                ?.replace('in:', '')
                .split(',')
                .map((option) => ({ value: option, label: option }))}
              value={value}
              onChange={(value) => setValue(value)}
            />
          ) : variable.rules.includes('number') ? (
            <NumberInput
              id={variable.envVariable}
              placeholder={variable.defaultValue}
              value={value}
              onChange={(value) => setValue(String(value))}
            />
          ) : (
            <TextInput
              id={variable.envVariable}
              placeholder={variable.defaultValue}
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          )}
          <p className={'text-gray-400 text-sm mt-1'}>{variable.description}</p>
        </div>

        <Group mt={'md'}>
          <Button
            disabled={(variable.rules.includes('required') && !value) || value === serverValue}
            onClick={doUpdate}
            loading={loading}
          >
            Save
          </Button>
        </Group>
      </Card>
    </Grid.Col>
  );
};
