import { httpErrorToHuman } from '@/api/axios';
import { useToast } from '@/providers/ToastProvider';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import Code from '@/elements/Code';
import deleteEgg from '@/api/admin/nests/eggs/deleteEgg';
import updateEgg from '@/api/admin/nests/eggs/updateEgg';
import createEgg from '@/api/admin/nests/eggs/createEgg';
import { Group, Stack } from '@mantine/core';
import TextInput from '@/elements/input/TextInput';
import TagsInput from '@/elements/input/TagsInput';
import Switch from '@/elements/input/Switch';
import NumberInput from '@/elements/input/NumberInput';
import { MultiKeyValueInput } from '@/elements/input/MultiKeyValueInput';
import Button from '@/elements/Button';
import { load } from '@/lib/debounce';
import ConfirmationModal from '@/elements/modals/ConfirmationModal';
import TextArea from '@/elements/input/TextArea';
import exportEgg from '@/api/admin/nests/eggs/exportEgg';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faFileDownload } from '@fortawesome/free-solid-svg-icons';
import ContextMenu, { ContextMenuProvider } from '@/elements/ContextMenu';
import jsYaml from 'js-yaml';

export default ({ contextNest, contextEgg }: { contextNest: AdminNest; contextEgg?: AdminNestEgg }) => {
  const { addToast } = useToast();

  const [openModal, setOpenModal] = useState<'delete'>(null);

  const form = useForm<AdminUpdateNestEgg>({
    initialValues: {
      author: contextEgg?.author || '',
      name: contextEgg?.name || '',
      description: contextEgg?.description || '',
      configFiles: contextEgg?.configFiles || [],
      configStartup: {
        done: contextEgg?.configStartup.done || [],
        stripAnsi: contextEgg?.configStartup.stripAnsi || false,
      },
      configStop: {
        type: contextEgg?.configStop.type || '',
        value: contextEgg?.configStop.value || '',
      },
      configScript: {
        container: contextEgg?.configScript.container || '',
        entrypoint: contextEgg?.configScript.entrypoint || '',
        content: contextEgg?.configScript.content || '',
      },
      configAllocations: {
        userSelfAssign: {
          enabled: contextEgg?.configAllocations.userSelfAssign.enabled || false,
          requirePrimaryAllocation: contextEgg?.configAllocations.userSelfAssign.requirePrimaryAllocation || false,
          startPort: contextEgg?.configAllocations.userSelfAssign.startPort || 0,
          endPort: contextEgg?.configAllocations.userSelfAssign.endPort || 0,
        },
      },
      startup: contextEgg?.startup || '',
      forceOutgoingIp: contextEgg?.forceOutgoingIp || false,
      separatePort: contextEgg?.separatePort || false,
      features: contextEgg?.features || [],
      dockerImages: contextEgg?.dockerImages || {},
      fileDenylist: contextEgg?.fileDenylist || [],
    },
  });

  const { loading, setLoading, doCreateOrUpdate, doDelete } = useResourceForm<AdminUpdateNestEgg, AdminNestEgg>({
    form,
    createFn: () => createNest(form.values),
    updateFn: () => updateNest(contextNest?.uuid, form.values),
    deleteFn: () => deleteNest(contextNest?.uuid),
    doUpdate: !!contextEgg,
    basePath: `/admin/nests/${contextNest.uuid}/eggs`,
    resourceName: 'Egg',
  });

  useEffect(() => {
    if (contextNest) {
      form.setValues({
        ...contextNest,
      });
    }
  }, [contextNest]);

  const doExport = (format: 'json' | 'yaml') => {
    load(true, setLoading);
    exportEgg(contextNest?.uuid, contextEgg.uuid)
      .then((data) => {
        addToast('Egg exported.', 'success');

        if (format === 'json') {
          const jsonData = JSON.stringify(data, undefined, 2);
          const fileURL = URL.createObjectURL(new Blob([jsonData], { type: 'text/plain' }));
          const downloadLink = document.createElement('a');
          downloadLink.href = fileURL;
          downloadLink.download = `egg-${contextEgg.uuid}.json`;
          document.body.appendChild(downloadLink);
          downloadLink.click();

          URL.revokeObjectURL(fileURL);
          downloadLink.remove();
        } else {
          const yamlData = jsYaml.dump(data, { flowLevel: -1, forceQuotes: true });
          const fileURL = URL.createObjectURL(new Blob([yamlData], { type: 'text/plain' }));
          const downloadLink = document.createElement('a');
          downloadLink.href = fileURL;
          downloadLink.download = `egg-${contextEgg.uuid}.yml`;
          document.body.appendChild(downloadLink);
          downloadLink.click();

          URL.revokeObjectURL(fileURL);
          downloadLink.remove();
        }
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      })
      .finally(() => load(false, setLoading));
  };

  return (
    <>
      <ConfirmationModal
        opened={openModal === 'delete'}
        onClose={() => setOpenModal(null)}
        title={'Confirm Egg Deletion'}
        confirm={'Delete'}
        onConfirmed={doDelete}
      >
        Are you sure you want to delete <Code>{form.values.name}</Code>?
      </ConfirmationModal>

      <Stack>
        <Group grow>
          <TextInput withAsterisk label={'Author'} placeholder={'Author'} {...form.getInputProps('author')} />
          <TextInput withAsterisk label={'Name'} placeholder={'Name'} {...form.getInputProps('name')} />
        </Group>

        <TextArea label={'Description'} placeholder={'Description'} rows={3} {...form.getInputProps('description')} />

        {/* TODO: configFiles */}

        <TagsInput
          withAsterisk
          label={'Startup Done'}
          placeholder={'Startup Done'}
          {...form.getInputProps('configStartup.done')}
        />

        <Switch label={'Strip ANSI from startup messages'} {...form.getInputProps('configStartup.stripAnsi')} />

        {/* TODO: configStop */}

        <Group grow>
          <TextInput
            withAsterisk
            label={'Install Script Container'}
            placeholder={'Install Script Container'}
            {...form.getInputProps('configScript.container')}
          />
          <TextInput
            withAsterisk
            label={'Install Script Entrypoint'}
            placeholder={'Install Script Entrypoint'}
            {...form.getInputProps('configScript.entrypoint')}
          />
        </Group>

        <TextArea
          withAsterisk
          label={'Install Script Content'}
          placeholder={'Install Script Content'}
          rows={6}
          {...form.getInputProps('configScript.content')}
        />

        <Switch label={'Allocation Self Assign'} {...form.getInputProps('configAllocations.userSelfAssign.enabled')} />

        <Switch
          label={'Require Primary Allocation'}
          {...form.getInputProps('configAllocations.userSelfAssign.requirePrimaryAllocation')}
        />

        <Group grow>
          <NumberInput
            label={'Automatic Allocation Start'}
            placeholder={'Automatic Allocation Start'}
            {...form.getInputProps('configAllocations.userSelfAssign.startPort')}
          />
          <NumberInput
            label={'Automatic Allocation End'}
            placeholder={'Automatic Allocation End'}
            {...form.getInputProps('configAllocations.userSelfAssign.endPort')}
          />
        </Group>

        <TextInput withAsterisk label={'Startup'} placeholder={'Startup'} {...form.getInputProps('startup')} />

        <Switch label={'Force Outgoing IP'} {...form.getInputProps('forceOutgoingIp')} />
        <Switch
          label={'Separate IP and Port'}
          description={'Separates the primary IP and Port in the Console page instead of joining them with ":"'}
          {...form.getInputProps('separatePort')}
        />

        <TagsInput label={'Features'} placeholder={'Feature'} {...form.getInputProps('features')} />

        <MultiKeyValueInput
          options={form.values.dockerImages}
          onChange={(e) => form.setFieldValue('dockerImages', e)}
        />

        <TagsInput label={'File Deny List'} placeholder={'File Deny List'} {...form.getInputProps('fileDenylist')} />
      </Stack>

      <Group mt={'md'}>
        <Button onClick={() => doCreateOrUpdate(false)} loading={loading}>
          Save
        </Button>
        {contextEgg && (
          <ContextMenuProvider menuProps={{ position: 'top', offset: 40 }}>
            <ContextMenu
              items={[
                {
                  icon: faFileDownload,
                  label: 'as JSON',
                  onClick: () => doExport('json'),
                  color: 'gray',
                },
                {
                  icon: faFileDownload,
                  label: 'as YAML',
                  onClick: () => doExport('yaml'),
                  color: 'gray',
                },
              ]}
            >
              {({ openMenu }) => (
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    const rect = e.currentTarget.getBoundingClientRect();
                    openMenu(rect.left, rect.bottom);
                  }}
                  loading={loading}
                  variant={'outline'}
                  rightSection={<FontAwesomeIcon icon={faChevronDown} />}
                >
                  Export
                </Button>
              )}
            </ContextMenu>
          </ContextMenuProvider>
        )}
        {contextEgg && (
          <Button color={'red'} onClick={() => setOpenModal('delete')} loading={loading}>
            Delete
          </Button>
        )}
      </Group>
    </>
  );
};
