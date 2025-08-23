import { httpErrorToHuman } from '@/api/axios';
import { useToast } from '@/providers/ToastProvider';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Dialog } from '@/elements/dialog';
import Code from '@/elements/Code';
import getEgg from '@/api/admin/eggs/getEgg';
import deleteEgg from '@/api/admin/eggs/deleteEgg';
import updateEgg from '@/api/admin/eggs/updateEgg';
import createEgg from '@/api/admin/eggs/createEgg';
import { Group } from '@mantine/core';
import TextInput from '@/elements/inputnew/TextInput';
import TagsInput from '@/elements/inputnew/TagsInput';
import Switch from '@/elements/inputnew/Switch';
import NumberInput from '@/elements/inputnew/NumberInput';
import { MultiKeyValueInput } from '@/elements/inputnew/MultiKeyValueInput';
import NewButton from '@/elements/button/NewButton';
import { load } from '@/lib/debounce';

export default ({ nest }: { nest: Nest }) => {
  const params = useParams<'eggId'>();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [openDialog, setOpenDialog] = useState<'delete'>(null);
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

  const doDelete = () => {
    load(true, setLoading);
    deleteEgg(nest.uuid, egg.uuid)
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
      <Dialog.Confirm
        opened={openDialog === 'delete'}
        onClose={() => setOpenDialog(null)}
        title={'Confirm Egg Deletion'}
        confirm={'Delete'}
        onConfirmed={doDelete}
      >
        Are you sure you want to delete <Code>{egg?.name}</Code>?
      </Dialog.Confirm>

      <Group grow>
        <TextInput
          label={'Author'}
          placeholder={'Author'}
          value={egg.author || ''}
          onChange={(e) => setEgg({ ...egg, author: e.target.value })}
          mt={'sm'}
        />
        <TextInput
          label={'Name'}
          placeholder={'Name'}
          value={egg.name || ''}
          onChange={(e) => setEgg({ ...egg, name: e.target.value })}
          mt={'sm'}
        />
      </Group>

      <TextInput
        label={'Description'}
        placeholder={'Description'}
        value={egg.description || ''}
        onChange={(e) => setEgg({ ...egg, description: e.target.value })}
        mt={'sm'}
      />

      {/* TODO: configFiles */}

      <TagsInput
        label={'Startup Done'}
        placeholder={'Startup Done'}
        value={egg.configStartup?.done || []}
        onChange={(e) => setEgg({ ...egg, configStartup: { ...egg.configStartup, done: e } })}
        mt={'sm'}
      />

      <Switch
        label={'Strip ansi from startup messages'}
        checked={egg.configStartup?.stripAnsi || false}
        onChange={(e) => setEgg({ ...egg, configStartup: { ...egg.configStartup, stripAnsi: e.target.checked } })}
        mt={'sm'}
      />

      {/* TODO: configStop */}

      <Group grow>
        <TextInput
          label={'Script Container'}
          placeholder={'Script Container'}
          value={egg.configScript?.container || ''}
          onChange={(e) => setEgg({ ...egg, configScript: { ...egg.configScript, container: e.target.value } })}
          mt={'sm'}
        />
        <TextInput
          label={'Script Entrypoint'}
          placeholder={'Script Entrypoint'}
          value={egg.configScript?.entrypoint || ''}
          onChange={(e) => setEgg({ ...egg, configScript: { ...egg.configScript, entrypoint: e.target.value } })}
          mt={'sm'}
        />
      </Group>

      <TextInput
        label={'Script Content'}
        placeholder={'Script Content'}
        value={egg.configScript?.content || ''}
        onChange={(e) => setEgg({ ...egg, configScript: { ...egg.configScript, content: e.target.value } })}
        mt={'sm'}
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
        mt={'sm'}
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
        mt={'sm'}
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
          mt={'sm'}
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
          mt={'sm'}
        />
      </Group>

      <TextInput
        label={'Startup'}
        placeholder={'Startup'}
        value={egg.startup || ''}
        onChange={(e) => setEgg({ ...egg, startup: e.target.value })}
        mt={'sm'}
      />

      <Switch
        label={'Force Outgoing IP'}
        checked={egg.forceOutgoingIp || false}
        onChange={(e) => setEgg({ ...egg, forceOutgoingIp: e.target.checked })}
        mt={'sm'}
      />

      <TagsInput
        label={'Features'}
        placeholder={'Feature'}
        value={egg.features || []}
        onChange={(e) => setEgg({ ...egg, features: e })}
        mt={'sm'}
      />

      <MultiKeyValueInput options={egg.dockerImages || {}} onChange={(e) => setEgg({ ...egg, dockerImages: e })} />

      <TagsInput
        label={'File Deny List'}
        placeholder={'File Deny List'}
        value={egg.fileDenylist || []}
        onChange={(e) => setEgg({ ...egg, fileDenylist: e })}
        mt={'sm'}
      />

      <Group mt={'md'}>
        <NewButton onClick={doCreateOrUpdate} loading={loading}>
          Save
        </NewButton>
        {params.eggId && (
          <NewButton color={'red'} onClick={() => setOpenDialog('delete')} loading={loading}>
            Delete
          </NewButton>
        )}
      </Group>
    </>
  );
};
