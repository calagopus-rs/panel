import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useToast } from '@/providers/ToastProvider';
import { Group, Title, Divider, Stack } from '@mantine/core';
import { httpErrorToHuman } from '@/api/axios';
import Button from '@/elements/Button';
import Code from '@/elements/Code';
import TextInput from '@/elements/input/TextInput';
import Switch from '@/elements/input/Switch';
import { load } from '@/lib/debounce';
import ConfirmationModal from '@/elements/modals/ConfirmationModal';
import createMount from '@/api/admin/mounts/createMount';
import updateMount from '@/api/admin/mounts/updateMount';
import getMount from '@/api/admin/mounts/getMount';
import deleteMount from '@/api/admin/mounts/deleteMount';
import TextArea from '@/elements/input/TextArea';

export default () => {
  const params = useParams<'id'>();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [openModal, setOpenModal] = useState<'delete'>(null);
  const [loading, setLoading] = useState(false);
  const [mount, setMount] = useState<AdminUpdateMount>({
    name: '',
    description: '',
    source: '',
    target: '',
    readOnly: false,
    userMountable: false,
  } as AdminUpdateMount);

  useEffect(() => {
    if (params.id) {
      getMount(params.id)
        .then((mount) => {
          setMount(mount);
        })
        .catch((msg) => {
          addToast(httpErrorToHuman(msg), 'error');
        });
    }
  }, [params.id]);

  const doCreateOrUpdate = () => {
    load(true, setLoading);
    if (params?.id) {
      updateMount(params.id, mount)
        .then(() => {
          addToast('Mount updated.', 'success');
        })
        .catch((msg) => {
          addToast(httpErrorToHuman(msg), 'error');
        })
        .finally(() => {
          load(false, setLoading);
        });
    } else {
      createMount(mount)
        .then((databaseHost) => {
          addToast('Mount created.', 'success');
          navigate(`/admin/mounts/${databaseHost.uuid}`);
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
    deleteMount(params.id)
      .then(() => {
        addToast('Mount deleted.', 'success');
        navigate('/admin/mounts');
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
        title={'Confirm Mount Deletion'}
        confirm={'Delete'}
        onConfirmed={doDelete}
      >
        Are you sure you want to delete <Code>{mount?.name}</Code>?
      </ConfirmationModal>

      <Title order={1}>{params.id ? 'Update' : 'Create'} Mount</Title>
      <Divider />

      <Stack>
        <Group grow align={'start'}>
          <TextInput
            withAsterisk
            label={'Name'}
            placeholder={'Name'}
            value={mount.name || ''}
            onChange={(e) => setMount({ ...mount, name: e.target.value })}
          />
          <TextArea
            label={'Description'}
            placeholder={'Description'}
            value={mount.description || ''}
            onChange={(e) => setMount({ ...mount, description: e.target.value || null })}
            rows={3}
          />
        </Group>

        <Group grow>
          <TextInput
            withAsterisk
            label={'Source'}
            placeholder={'Source'}
            value={mount.source || ''}
            onChange={(e) => setMount({ ...mount, source: e.target.value })}
          />
          <TextInput
            withAsterisk
            label={'Target'}
            placeholder={'Target'}
            value={mount.target || ''}
            onChange={(e) => setMount({ ...mount, target: e.target.value })}
          />
        </Group>

        <Group grow>
          <Switch
            label={'Read Only'}
            checked={mount.readOnly || false}
            onChange={(e) => setMount({ ...mount, readOnly: e.currentTarget.checked })}
          />
          <Switch
            label={'User Mountable'}
            checked={mount.userMountable || false}
            onChange={(e) => setMount({ ...mount, userMountable: e.currentTarget.checked })}
          />
        </Group>

        <Group>
          <Button onClick={doCreateOrUpdate} loading={loading}>
            Save
          </Button>
          {params.id && (
            <Button color={'red'} onClick={() => setOpenModal('delete')} loading={loading}>
              Delete
            </Button>
          )}
        </Group>
      </Stack>
    </>
  );
};
