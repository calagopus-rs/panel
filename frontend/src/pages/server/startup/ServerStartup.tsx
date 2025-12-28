import { faReply } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ActionIcon, Group, Title } from '@mantine/core';
import debounce from 'debounce';
import { useCallback, useEffect, useState } from 'react';
import { httpErrorToHuman } from '@/api/axios.ts';
import getVariables from '@/api/server/startup/getVariables.ts';
import updateCommand from '@/api/server/startup/updateCommand.ts';
import updateDockerImage from '@/api/server/startup/updateDockerImage.ts';
import updateVariables from '@/api/server/startup/updateVariables.ts';
import Button from '@/elements/Button.tsx';
import Card from '@/elements/Card.tsx';
import ServerContentContainer from '@/elements/containers/ServerContentContainer.tsx';
import Select from '@/elements/input/Select.tsx';
import TextArea from '@/elements/input/TextArea.tsx';
import VariableContainer from '@/elements/VariableContainer.tsx';
import { useKeyboardShortcut } from '@/plugins/useKeyboardShortcuts.ts';
import { useToast } from '@/providers/ToastProvider.tsx';
import { useTranslations } from '@/providers/TranslationProvider.tsx';
import { useGlobalStore } from '@/stores/global.ts';
import { useServerStore } from '@/stores/server.ts';

export default function ServerStartup() {
  const { t } = useTranslations();
  const { addToast } = useToast();
  const { settings } = useGlobalStore();
  const { server, updateServer, variables, setVariables, updateVariable } = useServerStore();

  const [command, setCommand] = useState(server.startup);
  const [dockerImage, setDockerImage] = useState(server.image);
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const setDebouncedCommand = useCallback(
    debounce((command: string) => {
      updateCommand(server.uuid, command)
        .then(() => {
          addToast(t('pages.server.startup.toast.startupCommandUpdated', {}), 'success');
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
      updateDockerImage(server.uuid, dockerImage)
        .then(() => {
          addToast(t('pages.server.startup.toast.dockerImageUpdated', {}), 'success');
          updateServer({ image: dockerImage });
        })
        .catch((msg) => {
          addToast(httpErrorToHuman(msg), 'error');
        });
    }
  }, [dockerImage]);

  const doUpdate = () => {
    setLoading(true);
    updateVariables(
      server.uuid,
      Object.entries(values).map(([envVariable, value]) => ({ envVariable, value })),
    )
      .then(() => {
        addToast(t('pages.server.startup.toast.variablesUpdated', {}), 'success');
        for (const [envVariable, value] of Object.entries(values)) {
          updateVariable(envVariable, { value });
        }

        setValues({});
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      })
      .finally(() => setLoading(false));
  };

  useKeyboardShortcut(
    's',
    () => {
      if (Object.keys(values).length > 0 && !loading) {
        doUpdate();
      }
    },
    {
      modifiers: ['ctrlOrMeta'],
      allowWhenInputFocused: true,
      deps: [values, loading],
    },
  );

  return (
    <ServerContentContainer title={t('pages.server.startup.title', {})}>
      <div className='grid grid-cols-3 gap-4'>
        <Card className='flex flex-col justify-between rounded-md p-4 h-full col-span-2'>
          <TextArea
            withAsterisk
            label={t('pages.server.startup.form.startupCommand', {})}
            placeholder={t('pages.server.startup.form.startupCommand', {})}
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            disabled={!settings.server.allowEditingStartupCommand}
            autosize
            rightSection={
              <ActionIcon
                variant='subtle'
                hidden={!settings.server.allowEditingStartupCommand}
                disabled={command === server.egg.startup}
                onClick={() => setCommand(server.egg.startup)}
              >
                <FontAwesomeIcon icon={faReply} />
              </ActionIcon>
            }
          />
        </Card>
        <Card className='flex flex-col justify-between rounded-md p-4 h-full'>
          <Select
            withAsterisk
            label={t('pages.server.startup.form.dockerImage', {})}
            value={dockerImage}
            onChange={(value) => setDockerImage(value ?? '')}
            data={Object.entries(server.egg.dockerImages).map(([key, value]) => ({
              value,
              label: key,
            }))}
            searchable
            disabled={!settings.server.allowOverwritingCustomDockerImage}
          />
          <p className='text-gray-400 mt-2'>
            {Object.values(server.egg.dockerImages).includes(server.image) ||
            settings.server.allowOverwritingCustomDockerImage
              ? t('pages.server.startup.dockerImageDescription', {})
              : t('pages.server.startup.dockerImageDescriptionCustom', {})}
          </p>
        </Card>
      </div>

      <Group justify='space-between' my='md'>
        <Title order={2}>{t('pages.server.startup.variables', {})}</Title>
        <Group>
          <Button onClick={doUpdate} disabled={Object.keys(values).length === 0} loading={loading} color='blue'>
            {t('common.button.save', {})}
          </Button>
        </Group>
      </Group>

      <div className='grid grid-cols-1 xl:grid-cols-2 gap-4 mt-4'>
        {variables.map((variable) => (
          <VariableContainer
            key={variable.envVariable}
            variable={variable}
            loading={loading}
            value={values[variable.envVariable] ?? variable.value ?? variable.defaultValue ?? ''}
            setValue={(value) => setValues((prev) => ({ ...prev, [variable.envVariable]: value }))}
          />
        ))}
      </div>
    </ServerContentContainer>
  );
}
