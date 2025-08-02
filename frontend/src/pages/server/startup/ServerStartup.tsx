import getVariables from '@/api/server/startup/getVariables';
import Container from '@/elements/Container';
import Spinner from '@/elements/Spinner';
import { NoItems } from '@/elements/table/Table';
import { useServerStore } from '@/stores/server';
import { useCallback, useEffect, useState } from 'react';
import VariableContainer from './VariableContainer';
import { useGlobalStore } from '@/stores/global';
import { Input } from '@/elements/inputs';
import { useToast } from '@/providers/ToastProvider';
import updateDockerImage from '@/api/server/startup/updateDockerImage';
import { httpErrorToHuman } from '@/api/axios';
import updateCommand from '@/api/server/startup/updateCommand';
import debounce from 'debounce';

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
    }, 200),
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
    <Container>
      <div className={'mb-4 flex justify-between'}>
        <h1 className={'text-4xl font-bold text-white'}>Startup</h1>
      </div>
      <div className={'grid grid-cols-3 gap-4'}>
        <div className={'bg-gray-700/50 flex flex-col justify-between rounded-md p-4 h-full col-span-2'}>
          <Input.Textarea
            id={'startup-command'}
            placeholder={'Startup Command'}
            className={'h-full'}
            disabled={!settings.server.allowEditingStartupCommand}
            value={command}
            onChange={(e) => setCommand(e.target.value)}
          />
        </div>
        <div className={'bg-gray-700/50 flex flex-col justify-between rounded-md p-4 h-full'}>
          <Input.Dropdown
            id={'docker-image'}
            options={Object.entries(server.egg.dockerImages).map(([key, value]) => ({
              value,
              label: key,
            }))}
            selected={dockerImage}
            onChange={(e) => setDockerImage(e.target.value)}
          />
          <p className={'text-gray-400 mt-2'}>
            The Docker image used to run this server.{' '}
            {Object.values(server.egg.dockerImages).includes(server.image) ||
            settings.server.allowOverwritingCustomDockerImage
              ? 'This can be changed to use a different image.'
              : 'This has been set by an administrator and cannot be changed.'}
          </p>
        </div>
      </div>
      <div className={'grid grid-cols-1 xl:grid-cols-2 gap-4 mt-4'}>
        {variables.map((variable) => (
          <VariableContainer key={variable.envVariable} variable={variable} />
        ))}
        {loading ? <Spinner.Centered /> : variables.length === 0 ? <NoItems /> : null}
      </div>
    </Container>
  );
};
