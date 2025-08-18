import { httpErrorToHuman } from '@/api/axios';
import { useToast } from '@/providers/ToastProvider';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Dialog } from '@/elements/dialog';
import Code from '@/elements/Code';
import updateNest from '@/api/admin/nests/updateNest';
import deleteNest from '@/api/admin/nests/deleteNest';
import createNest from '@/api/admin/nests/createNest';
import { load } from '@/lib/debounce';
import { Group, Title } from '@mantine/core';
import NewButton from '@/elements/button/NewButton';
import TextInput from '@/elements/inputnew/TextInput';

export default ({ contextNest }: { contextNest?: Nest }) => {
  const params = useParams<'nestId'>();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [openDialog, setOpenDialog] = useState<'delete'>(null);
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

  const doDelete = () => {
    load(true, setLoading);
    deleteNest(nest.uuid)
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
      <Dialog.Confirm
        opened={openDialog === 'delete'}
        onClose={() => setOpenDialog(null)}
        title={'Confirm Nest Deletion'}
        confirm={'Delete'}
        onConfirmed={doDelete}
      >
        Are you sure you want to delete <Code>{nest?.name}</Code>?
      </Dialog.Confirm>

      <Title order={2}>{params.nestId ? 'Update' : 'Create'} Nest</Title>

      <Group grow>
        <TextInput
          label={'Author'}
          placeholder={'Author'}
          value={nest.author || ''}
          onChange={(e) => setNest({ ...nest, author: e.target.value })}
          mt={'sm'}
        />
        <TextInput
          label={'Name'}
          placeholder={'Name'}
          value={nest.name || ''}
          onChange={(e) => setNest({ ...nest, name: e.target.value })}
          mt={'sm'}
        />
      </Group>

      <TextInput
        label={'Description'}
        placeholder={'Description'}
        value={nest.description || ''}
        onChange={(e) => setNest({ ...nest, description: e.target.value })}
        mt={'sm'}
      />

      <Group mt={'md'}>
        <NewButton onClick={doCreateOrUpdate} loading={loading}>
          Save
        </NewButton>
        {params.nestId && (
          <NewButton color={'red'} onClick={() => setOpenDialog('delete')} loading={loading}>
            Delete
          </NewButton>
        )}
      </Group>
    </>
  );
};
