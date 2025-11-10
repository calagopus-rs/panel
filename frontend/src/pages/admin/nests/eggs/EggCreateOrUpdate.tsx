import { faChevronDown, faFileDownload } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Group, Stack } from '@mantine/core';
import { useForm } from '@mantine/form';
import jsYaml from 'js-yaml';
import { useEffect, useState } from 'react';
import createEgg from '@/api/admin/nests/eggs/createEgg';
import deleteEgg from '@/api/admin/nests/eggs/deleteEgg';
import exportEgg from '@/api/admin/nests/eggs/exportEgg';
import updateEgg from '@/api/admin/nests/eggs/updateEgg';
import { httpErrorToHuman } from '@/api/axios';
import Button from '@/elements/Button';
import Code from '@/elements/Code';
import ContextMenu, { ContextMenuProvider } from '@/elements/ContextMenu';
import MultiKeyValueInput from '@/elements/input/MultiKeyValueInput';
import NumberInput from '@/elements/input/NumberInput';
import Switch from '@/elements/input/Switch';
import TagsInput from '@/elements/input/TagsInput';
import TextArea from '@/elements/input/TextArea';
import TextInput from '@/elements/input/TextInput';
import ConfirmationModal from '@/elements/modals/ConfirmationModal';
import { load } from '@/lib/debounce';
import { useResourceForm } from '@/plugins/useResourceForm';
import { useToast } from '@/providers/ToastProvider';

export default function EggCreateOrUpdate({
  contextNest,
  contextEgg,
}: {
  contextNest: AdminNest;
  contextEgg?: AdminNestEgg;
}) {
  const { addToast } = useToast();

  const [openModal, setOpenModal] = useState<'delete'>(null);

  const form = useForm<AdminUpdateNestEgg>({
    initialValues: {
      author: '',
      name: '',
      description: null,
      configFiles: [],
      configStartup: {
        done: [],
        stripAnsi: false,
      },
      configStop: {
        type: '',
        value: null,
      },
      configScript: {
        container: '',
        entrypoint: '',
        content: '',
      },
      configAllocations: {
        userSelfAssign: {
          enabled: false,
          requirePrimaryAllocation: false,
          startPort: 0,
          endPort: 0,
        },
      },
      startup: '',
      forceOutgoingIp: false,
      separatePort: false,
      features: [],
      dockerImages: {},
      fileDenylist: [],
    },
  });

  const { loading, setLoading, doCreateOrUpdate, doDelete } = useResourceForm<AdminUpdateNestEgg, AdminNestEgg>({
    form,
    createFn: () => createEgg(contextNest.uuid, form.values),
    updateFn: () => updateEgg(contextNest.uuid, contextEgg.uuid, form.values),
    deleteFn: () => deleteEgg(contextNest.uuid, contextEgg.uuid),
    doUpdate: !!contextEgg,
    basePath: `/admin/nests/${contextNest.uuid}/eggs`,
    resourceName: 'Egg',
  });

  useEffect(() => {
    if (contextEgg) {
      form.setValues({
        ...contextEgg,
      });
    }
  }, [contextEgg]);

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

        <Switch
          label={'Strip ANSI from startup messages'}
          checked={form.values.configStartup.stripAnsi}
          onChange={(e) => form.setFieldValue('configStartup.stripAnsi', e.target.checked)}
        />

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

        <Switch
          label={'Allocation Self Assign'}
          checked={form.values.configAllocations.userSelfAssign.enabled}
          onChange={(e) => form.setFieldValue('configAllocations.userSelfAssign.enabled', e.target.checked)}
        />

        <Switch
          label={'Require Primary Allocation'}
          checked={form.values.configAllocations.userSelfAssign.requirePrimaryAllocation}
          onChange={(e) =>
            form.setFieldValue('configAllocations.userSelfAssign.requirePrimaryAllocation', e.target.checked)
          }
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

        <Switch
          label={'Force Outgoing IP'}
          checked={form.values.forceOutgoingIp}
          onChange={(e) => form.setFieldValue('forceOutgoingIp', e.target.checked)}
        />
        <Switch
          label={'Separate IP and Port'}
          description={'Separates the primary IP and Port in the Console page instead of joining them with ":"'}
          checked={form.values.separatePort}
          onChange={(e) => form.setFieldValue('separatePort', e.target.checked)}
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
}
