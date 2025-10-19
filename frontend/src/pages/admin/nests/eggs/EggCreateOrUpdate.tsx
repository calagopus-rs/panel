import { httpErrorToHuman } from '@/api/axios';
import { useToast } from '@/providers/ToastProvider';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import Code from '@/elements/Code';
import deleteEgg from '@/api/admin/eggs/deleteEgg';
import updateEgg from '@/api/admin/eggs/updateEgg';
import createEgg from '@/api/admin/eggs/createEgg';
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
import exportEgg from '@/api/admin/eggs/exportEgg';

export default ({ contextNest, contextEgg }: { contextNest: Nest; contextEgg?: AdminNestEgg }) => {
  const params = useParams<'eggId'>();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [openModal, setOpenModal] = useState<'delete'>(null);
  const [loading, setLoading] = useState(false);
  const [egg, setEgg] = useState<AdminNestEgg>({
    author: contextEgg?.author || '',
    name: contextEgg?.name || '',
    description: contextEgg?.description || '',
    configFiles: contextEgg?.configFiles || [],
    configStartup: {
      done: contextEgg?.configStartup.done || [],
    },
    configStop: {
      type: contextEgg?.configStop.type || '',
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
    features: contextEgg?.features || [],
    dockerImages: contextEgg?.dockerImages || {},
    fileDenylist: contextEgg?.fileDenylist || [],
  } as AdminNestEgg);

  const doCreateOrUpdate = () => {
    load(true, setLoading);
    if (contextEgg?.uuid) {
      updateEgg(contextNest.uuid, contextEgg.uuid, egg)
        .then(() => {
          addToast('Egg updated.', 'success');
        })
        .catch((msg) => {
          addToast(httpErrorToHuman(msg), 'error');
        })
        .finally(() => {
          load(false, setLoading);
        });
    } else {
      createEgg(contextNest.uuid, egg)
        .then((egg) => {
          addToast('Egg created.', 'success');
          navigate(`/admin/nests/${contextNest.uuid}/eggs/${egg.uuid}`);
        })
        .catch((msg) => {
          addToast(httpErrorToHuman(msg), 'error');
        })
        .finally(() => {
          load(false, setLoading);
        });
    }
  };

  const doExport = () => {
    load(true, setLoading);
    exportEgg(contextNest.uuid, contextEgg.uuid)
      .then((data) => {
        addToast('Egg exported.', 'success');

        const jsonData = JSON.stringify(data, undefined, 2);
        const fileURL = URL.createObjectURL(new Blob([jsonData], { type: 'text/plain' }));
        const downloadLink = document.createElement('a');
        downloadLink.href = fileURL;
        downloadLink.download = `egg-${contextEgg.uuid}.json`;
        document.body.appendChild(downloadLink);
        downloadLink.click();

        URL.revokeObjectURL(fileURL);
        downloadLink.remove();
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      })
      .finally(() => load(false, setLoading));
  };

  const doDelete = async () => {
    load(true, setLoading);
    await deleteEgg(contextNest.uuid, contextEgg.uuid)
      .then(() => {
        addToast('Egg deleted.', 'success');
        navigate(`/admin/nests/${contextNest.uuid}/eggs`);
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
      <ConfirmationModal
        opened={openModal === 'delete'}
        onClose={() => setOpenModal(null)}
        title={'Confirm Egg Deletion'}
        confirm={'Delete'}
        onConfirmed={doDelete}
      >
        Are you sure you want to delete <Code>{egg?.name}</Code>?
      </ConfirmationModal>

      <Stack>
        <Group grow>
          <TextInput
            withAsterisk
            label={'Author'}
            placeholder={'Author'}
            value={egg.author || ''}
            onChange={(e) => setEgg({ ...egg, author: e.target.value })}
          />
          <TextInput
            withAsterisk
            label={'Name'}
            placeholder={'Name'}
            value={egg.name || ''}
            onChange={(e) => setEgg({ ...egg, name: e.target.value })}
          />
        </Group>

        <TextArea
          label={'Description'}
          placeholder={'Description'}
          value={egg.description || ''}
          rows={3}
          onChange={(e) => setEgg({ ...egg, description: e.target.value || null })}
        />

        {/* TODO: configFiles */}

        <TagsInput
          withAsterisk
          label={'Startup Done'}
          placeholder={'Startup Done'}
          value={egg.configStartup?.done || []}
          onChange={(e) => setEgg({ ...egg, configStartup: { ...egg.configStartup, done: e } })}
        />

        <Switch
          label={'Strip ANSI from startup messages'}
          checked={egg.configStartup?.stripAnsi || false}
          onChange={(e) => setEgg({ ...egg, configStartup: { ...egg.configStartup, stripAnsi: e.target.checked } })}
        />

        {/* TODO: configStop */}

        <Group grow>
          <TextInput
            withAsterisk
            label={'Install Script Container'}
            placeholder={'Install Script Container'}
            value={egg.configScript?.container || ''}
            onChange={(e) => setEgg({ ...egg, configScript: { ...egg.configScript, container: e.target.value } })}
          />
          <TextInput
            withAsterisk
            label={'Install Script Entrypoint'}
            placeholder={'Install Script Entrypoint'}
            value={egg.configScript?.entrypoint || ''}
            onChange={(e) => setEgg({ ...egg, configScript: { ...egg.configScript, entrypoint: e.target.value } })}
          />
        </Group>

        <TextArea
          withAsterisk
          label={'Install Script Content'}
          placeholder={'Install Script Content'}
          value={egg.configScript?.content || ''}
          rows={6}
          onChange={(e) => setEgg({ ...egg, configScript: { ...egg.configScript, content: e.target.value } })}
        />

        <Switch
          label={'Allocation Self Assign'}
          checked={egg.configAllocations?.userSelfAssign?.enabled || false}
          onChange={(e) =>
            setEgg({
              ...egg,
              configAllocations: {
                ...egg.configAllocations,
                userSelfAssign: { ...egg.configAllocations.userSelfAssign, enabled: e.target.checked },
              },
            })
          }
        />

        <Switch
          label={'Require Primary Allocation'}
          checked={egg.configAllocations?.userSelfAssign?.requirePrimaryAllocation || false}
          onChange={(e) =>
            setEgg({
              ...egg,
              configAllocations: {
                ...egg.configAllocations,
                userSelfAssign: {
                  ...egg.configAllocations.userSelfAssign,
                  requirePrimaryAllocation: e.target.checked,
                },
              },
            })
          }
        />

        <Group grow>
          <NumberInput
            label={'Automatic Allocation Start'}
            placeholder={'Automatic Allocation Start'}
            value={egg.configAllocations?.userSelfAssign?.startPort || 0}
            onChange={(e) =>
              setEgg({
                ...egg,
                configAllocations: {
                  ...egg.configAllocations,
                  userSelfAssign: { ...egg.configAllocations.userSelfAssign, startPort: Number(e) },
                },
              })
            }
          />
          <NumberInput
            label={'Automatic Allocation End'}
            placeholder={'Automatic Allocation End'}
            value={egg.configAllocations?.userSelfAssign?.endPort || 0}
            onChange={(e) =>
              setEgg({
                ...egg,
                configAllocations: {
                  ...egg.configAllocations,
                  userSelfAssign: { ...egg.configAllocations.userSelfAssign, endPort: Number(e) },
                },
              })
            }
          />
        </Group>

        <TextInput
          withAsterisk
          label={'Startup'}
          placeholder={'Startup'}
          value={egg.startup || ''}
          onChange={(e) => setEgg({ ...egg, startup: e.target.value })}
        />

        <Switch
          label={'Force Outgoing IP'}
          checked={egg.forceOutgoingIp || false}
          onChange={(e) => setEgg({ ...egg, forceOutgoingIp: e.target.checked })}
        />

        <TagsInput
          label={'Features'}
          placeholder={'Feature'}
          value={egg.features || []}
          onChange={(e) => setEgg({ ...egg, features: e })}
        />

        <MultiKeyValueInput options={egg.dockerImages || {}} onChange={(e) => setEgg({ ...egg, dockerImages: e })} />

        <TagsInput
          label={'File Deny List'}
          placeholder={'File Deny List'}
          value={egg.fileDenylist || []}
          onChange={(e) => setEgg({ ...egg, fileDenylist: e })}
        />
      </Stack>

      <Group mt={'md'}>
        <Button onClick={doCreateOrUpdate} loading={loading}>
          Save
        </Button>
        {params.eggId && (
          <Button variant={'outline'} onClick={doExport} loading={loading}>
            Export
          </Button>
        )}
        {params.eggId && (
          <Button color={'red'} onClick={() => setOpenModal('delete')} loading={loading}>
            Delete
          </Button>
        )}
      </Group>
    </>
  );
};
