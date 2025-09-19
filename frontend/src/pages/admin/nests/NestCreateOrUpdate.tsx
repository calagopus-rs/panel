import { httpErrorToHuman } from '@/api/axios';
import { useToast } from '@/providers/ToastProvider';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import Code from '@/elements/Code';
import updateNest from '@/api/admin/nests/updateNest';
import deleteNest from '@/api/admin/nests/deleteNest';
import createNest from '@/api/admin/nests/createNest';
import { load } from '@/lib/debounce';
import { Group, Stack, Title } from '@mantine/core';
import Button from '@/elements/Button';
import TextInput from '@/elements/input/TextInput';
import ConfirmationModal from '@/elements/modals/ConfirmationModal';
import TextArea from '@/elements/input/TextArea';

export default ({ contextNest }: { contextNest?: Nest }) => {
  const params = useParams<'nestId'>();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [openModal, setOpenModal] = useState<'delete'>(null);
  const [loading, setLoading] = useState(false);
  const [nest, setNest] = useState<Nest>({
    author: contextNest?.author || '',
    name: contextNest?.name || '',
    description: contextNest?.description || '',
  } as Nest);

  const doCreateOrUpdate = () => {
    load(true, setLoading);
    if (params.nestId) {
      updateNest(nest.uuid, nest)
        .then(() => {
          addToast('Nest updated.', 'success');
        })
        .catch((msg) => {
          addToast(httpErrorToHuman(msg), 'error');
        })
        .finally(() => {
          load(false, setLoading);
        });
    } else {
      createNest(nest)
        .then((nest) => {
          addToast('Nest created.', 'success');
          navigate(`/admin/nests/${nest.uuid}`);
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
    await deleteNest(nest.uuid)
      .then(() => {
        addToast('Nest deleted.', 'success');
        navigate('/admin/nests');
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
        title={'Confirm Nest Deletion'}
        confirm={'Delete'}
        onConfirmed={doDelete}
      >
        Are you sure you want to delete <Code>{nest?.name}</Code>?
      </ConfirmationModal>

      <Title order={2}>{params.nestId ? 'Update' : 'Create'} Nest</Title>

      <Stack>
        <Group grow>
          <TextInput
            withAsterisk
            label={'Author'}
            placeholder={'Author'}
            value={nest.author || ''}
            onChange={(e) => setNest({ ...nest, author: e.target.value })}
          />
          <TextInput
            withAsterisk
            label={'Name'}
            placeholder={'Name'}
            value={nest.name || ''}
            onChange={(e) => setNest({ ...nest, name: e.target.value })}
          />
        </Group>

        <TextArea
          label={'Description'}
          placeholder={'Description'}
          value={nest.description || ''}
          rows={3}
          onChange={(e) => setNest({ ...nest, description: e.target.value || null })}
        />
      </Stack>

      <Group mt={'md'}>
        <Button onClick={doCreateOrUpdate} loading={loading}>
          Save
        </Button>
        {params.nestId && (
          <Button color={'red'} onClick={() => setOpenModal('delete')} loading={loading}>
            Delete
          </Button>
        )}
      </Group>
    </>
  );
};
