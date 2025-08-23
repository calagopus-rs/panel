import getVariables from '@/api/server/startup/getVariables';
import Spinner from '@/elements/Spinner';
import { NoItems } from '@/elements/table/Table';
import { useServerStore } from '@/stores/server';
import { useCallback, useEffect, useState } from 'react';
import VariableContainer from './VariableContainer';
import { useGlobalStore } from '@/stores/global';
import { useToast } from '@/providers/ToastProvider';
import updateDockerImage from '@/api/server/startup/updateDockerImage';
import { httpErrorToHuman } from '@/api/axios';
import updateCommand from '@/api/server/startup/updateCommand';
import debounce from 'debounce';
import { Grid, Group, Title } from '@mantine/core';
import Card from '@/elements/Card';
import TextArea from '@/elements/inputnew/TextArea';
import Select from '@/elements/inputnew/Select';

export default () => {
  const { addToast } = useToast();
  const { settings } = useGlobalStore();
  const { server, updateServer, variables, setVariables } = useServerStore();

  const [loading, setLoading] = useState(variables.length === 0);
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
      setLoading(false);
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

  return (
    <>
      <Group justify={'space-between'} mb={'md'}>
        <Title order={1} c={'white'}>
          Startup
        </Title>
      </Group>

      <Grid grow>
        <Grid.Col span={8}>
          <Card>
            <TextArea
              label={'Startup Command'}
              placeholder={'Startup Command'}
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              disabled={!settings.server.allowEditingStartupCommand}
            />
          </Card>
        </Grid.Col>
        <Grid.Col span={4}>
          <Card>
            <Select
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
        </Grid.Col>
      </Grid>
      <Grid>
        {variables.map((variable) => (
          <VariableContainer key={variable.envVariable} variable={variable} />
        ))}
        {loading ? <Spinner.Centered /> : variables.length === 0 ? <NoItems /> : null}
      </Grid>
    </>
  );
};
