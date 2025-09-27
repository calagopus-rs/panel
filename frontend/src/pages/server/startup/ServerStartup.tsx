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
import { load } from "@/lib/debounce";
import updateVariable from "@/api/server/startup/updateVariable";
import VariableContainer from "@/elements/VariableContainer";

export default () => {
  const { addToast } = useToast();
  const { settings } = useGlobalStore();
  const { server, updateServer, variables, setVariables, updateVariable: updateStoreVariable } = useServerStore();

  const [command, setCommand] = useState(server.startup);
  const [dockerImage, setDockerImage] = useState(server.image);

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

  const doUpdate = (setLoading: (loading: boolean) => void, variable: ServerVariable, value: string) => {
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
      <Group my={'md'}>
        <Title order={1} c={'white'}>
          Variables
        </Title>
      </Group>
      <div className={'grid grid-cols-1 xl:grid-cols-2 gap-4 mt-4'}>
        {variables.map((variable) => (
          <VariableContainer key={variable.envVariable} variable={variable} doUpdate={doUpdate} />
        ))}
      </div>
    </>
  );
};
