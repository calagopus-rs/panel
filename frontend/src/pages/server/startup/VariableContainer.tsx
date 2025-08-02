import { httpErrorToHuman } from '@/api/axios';
import updateVariable from '@/api/server/startup/updateVariable';
import { Button } from '@/elements/button';
import { Input } from '@/elements/inputs';
import { useToast } from '@/providers/ToastProvider';
import { useServerStore } from '@/stores/server';
import { useState } from 'react';

export default ({ variable }: { variable: ServerVariable }) => {
  const { addToast } = useToast();
  const { server, updateVariable: updateStoreVariable } = useServerStore();

  const serverValue = variable.value ?? variable.defaultValue;
  const [value, setValue] = useState(serverValue);

  const handleUpdate = () => {
    updateVariable(server.uuid, { envVariable: variable.envVariable, value })
      .then(() => {
        addToast('Server variable updated.', 'success');
        updateStoreVariable(variable.envVariable, { value });
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  };

  return (
    <div className={'bg-gray-700/50 flex flex-col justify-between rounded-md p-4 h-full'}>
      <div>
        <h1 className={'text-4xl font-bold text-white'}>{variable.name}</h1>

        <div className={'mt-4'}>
          {variable.rules.includes('boolean') ||
          (variable.rules.includes('string') &&
            (variable.rules.includes('in:1,0') || variable.rules.includes('in:true,false'))) ? (
            <Input.Switch
              name={variable.envVariable}
              defaultChecked={value === '1' || value === 'true'}
              onChange={(e) => setValue(e.target.checked ? '1' : '0')}
              label={variable.name}
            />
          ) : variable.rules.includes('string') && variable.rules.some((rule) => rule.startsWith('in:')) ? (
            <Input.Dropdown
              id={variable.envVariable}
              options={variable.rules
                .find((rule) => rule.startsWith('in:'))
                ?.replace('in:', '')
                .split(',')
                .map((option) => ({ value: option, label: option }))}
              selected={value}
              onChange={(e) => setValue(e.target.value)}
            />
          ) : (
            <Input.Text
              id={variable.envVariable}
              placeholder={variable.defaultValue}
              type={variable.rules.includes('number') ? 'number' : 'text'}
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          )}
          <p className={'text-gray-400 text-sm mt-1'}>{variable.description}</p>
        </div>
      </div>

      <div className={'mt-4 flex justify-end'}>
        <Button
          disabled={(variable.rules.includes('required') && !value) || value === serverValue}
          onClick={handleUpdate}
        >
          Update
        </Button>
      </div>
    </div>
  );
};
