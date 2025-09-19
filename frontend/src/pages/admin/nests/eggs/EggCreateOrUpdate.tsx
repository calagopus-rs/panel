import { httpErrorToHuman } from '@/api/axios';
import { useToast } from '@/providers/ToastProvider';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import Code from '@/elements/Code';
import getEgg from '@/api/admin/eggs/getEgg';
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

export default ({ nest }: { nest: Nest }) => {
  const params = useParams<'eggId'>();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [openModal, setOpenModal] = useState<'delete'>(null);
  const [loading, setLoading] = useState(false);
  const [egg, setEgg] = useState<AdminNestEgg>({
    author: '',
    name: '',
    description: '',
    configFiles: [],
    configStartup: {
      done: [],
    },
    configStop: {
      type: '',
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
    features: [],
    dockerImages: {},
    fileDenylist: [],
  } as AdminNestEgg);

  useEffect(() => {
    if (params.eggId) {
      getEgg(nest.uuid, params.eggId)
        .then((egg) => {
          setEgg(egg);
        })
        .catch((msg) => {
          addToast(httpErrorToHuman(msg), 'error');
        });
    }
  }, [params.eggId]);

  const doCreateOrUpdate = () => {
    load(true, setLoading);
    if (egg?.uuid) {
      updateEgg(nest.uuid, egg.uuid, egg)
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
      createEgg(nest.uuid, egg)
        .then((egg) => {
          addToast('Egg created.', 'success');
          navigate(`/admin/nests/${nest.uuid}/eggs/${egg.uuid}`);
        })
        .catch((msg) => {
          addToast(httpErrorToHuman(msg), 'error');
        })
        .finally(() => {
          load(false, setLoading);
        });
    }
  };

  const doDelete = async () => {
    load(true, setLoading);
    await deleteEgg(nest.uuid, egg.uuid)
      .then(() => {
        addToast('Egg deleted.', 'success');
        navigate(`/admin/nests/${nest.uuid}/eggs`);
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
          label={'Strip ansi from startup messages'}
          checked={egg.configStartup?.stripAnsi || false}
          onChange={(e) => setEgg({ ...egg, configStartup: { ...egg.configStartup, stripAnsi: e.target.checked } })}
        />

        {/* TODO: configStop */}

        <Group grow>
          <TextInput
            withAsterisk
            label={'Script Container'}
            placeholder={'Script Container'}
            value={egg.configScript?.container || ''}
            onChange={(e) => setEgg({ ...egg, configScript: { ...egg.configScript, container: e.target.value } })}
          />
          <TextInput
            withAsterisk
            label={'Script Entrypoint'}
            placeholder={'Script Entrypoint'}
            value={egg.configScript?.entrypoint || ''}
            onChange={(e) => setEgg({ ...egg, configScript: { ...egg.configScript, entrypoint: e.target.value } })}
          />
        </Group>

        <TextInput
          withAsterisk
          label={'Script Content'}
          placeholder={'Script Content'}
          value={egg.configScript?.content || ''}
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
          <Button color={'red'} onClick={() => setOpenModal('delete')} loading={loading}>
            Delete
          </Button>
        )}
      </Group>
    </>
  );
};
