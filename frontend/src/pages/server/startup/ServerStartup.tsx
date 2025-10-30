import getVariables from '@/api/server/startup/getVariables';
import { useServerStore } from '@/stores/server';
import { useCallback, useEffect, useState } from 'react';
import { useGlobalStore } from '@/stores/global';
import { useToast } from '@/providers/ToastProvider';
import updateDockerImage from '@/api/server/startup/updateDockerImage';
import { httpErrorToHuman } from '@/api/axios';
import updateCommand from '@/api/server/startup/updateCommand';
import debounce from 'debounce';
import { Group, Title } from '@mantine/core';
import Card from '@/elements/Card';
import TextArea from '@/elements/input/TextArea';
import Select from '@/elements/input/Select';
import { load } from '@/lib/debounce';
import updateVariables from '@/api/server/startup/updateVariables';
import VariableContainer from '@/elements/VariableContainer';
import Button from '@/elements/Button';

export default () => {
  const { addToast } = useToast();
  const { settings } = useGlobalStore();
  const { server, updateServer, variables, setVariables, updateVariable } = useServerStore();

  const [command, setCommand] = useState(server.startup);
  const [dockerImage, setDockerImage] = useState(server.image);
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const setDebouncedCommand = useCallback(
    debounce((command: string) => {
      updateCommand(server.uuid, { command })
        .then(() => {
          addToast('Startup command updated.', 'success');
          updateServer({ startup: command });
        })
        .catch((msg) => {
          addToast(httpErrorToHuman(msg), 'error');
        });
    }, 1000),
    [],
  );

  useEffect(() => {
    getVariables(server.uuid).then((data) => {
      setVariables(data);
    });
  }, []);

  useEffect(() => {
    if (command !== server.startup) {
      setDebouncedCommand(command);
    }
  }, [command]);

  useEffect(() => {
    if (dockerImage !== server.image) {
      updateDockerImage(server.uuid, { image: dockerImage })
        .then(() => {
          addToast('Docker image updated.', 'success');
          updateServer({ image: dockerImage });
        })
        .catch((msg) => {
          addToast(httpErrorToHuman(msg), 'error');
        });
    }
  }, [dockerImage]);

  const doUpdate = () => {
    load(true, setLoading);
    updateVariables(
      server.uuid,
      Object.entries(values).map(([envVariable, value]) => ({ envVariable, value })),
    )
      .then(() => {
        addToast('Variables updated.', 'success');
        for (const [envVariable, value] of Object.entries(values)) {
          updateVariable(envVariable, { value });
        }

        setValues({});
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      })
      .finally(() => {
        load(false, setLoading);
      });
  };

  return (
    <>
      <Group justify={'space-between'} mb={'md'}>
        <Title order={1} c={'white'}>
          Startup
        </Title>
      </Group>

      <div className={'grid grid-cols-3 gap-4'}>
        <Card className={'flex flex-col justify-between rounded-md p-4 h-full col-span-2'}>
          <TextArea
            withAsterisk
            label={'Startup Command'}
            placeholder={'Startup Command'}
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            disabled={!settings.server.allowEditingStartupCommand}
            autosize
          />
        </Card>
        <Card className={'flex flex-col justify-between rounded-md p-4 h-full'}>
          <Select
            withAsterisk
            label={'Docker Image'}
            value={dockerImage}
            onChange={(value) => setDockerImage(value)}
            data={Object.entries(server.egg.dockerImages).map(([key, value]) => ({
              value,
              label: key,
            }))}
            disabled={!settings.server.allowOverwritingCustomDockerImage}
          />
          <p className={'text-gray-400 mt-2'}>
            The Docker image used to run this server.{' '}
            {Object.values(server.egg.dockerImages).includes(server.image) ||
            settings.server.allowOverwritingCustomDockerImage
              ? 'This can be changed to use a different image.'
              : 'This has been set by an administrator and cannot be changed.'}
          </p>
        </Card>
      </div>

      <Group justify={'space-between'} my={'md'}>
        <Title order={2}>Variables</Title>
        <Group>
          <Button onClick={doUpdate} disabled={Object.keys(values).length === 0} loading={loading} color={'blue'}>
            Save
          </Button>
        </Group>
      </Group>

      <div className={'grid grid-cols-1 xl:grid-cols-2 gap-4 mt-4'}>
        {variables.map((variable) => (
          <VariableContainer
            key={variable.envVariable}
            variable={variable}
            loading={loading}
            overrideReadonly
            value={values[variable.envVariable] ?? variable.value ?? variable.defaultValue ?? ''}
            setValue={(value) => setValues((prev) => ({ ...prev, [variable.envVariable]: value }))}
          />
        ))}
      </div>
    </>
  );
};
