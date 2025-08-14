import { httpErrorToHuman } from '@/api/axios';
import AdminSettingContainer from '@/elements/AdminSettingContainer';
import { Button } from '@/elements/button';
import { Input } from '@/elements/inputs';
import { useToast } from '@/providers/ToastProvider';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Dialog } from '@/elements/dialog';
import Code from '@/elements/Code';
import classNames from 'classnames';
import getNest from '@/api/admin/nests/getNest';
import updateNest from '@/api/admin/nests/updateNest';
import createNest from '@/api/admin/nests/createNest';
import deleteNest from '@/api/admin/nests/deleteNest';

export default () => {
  const params = useParams<'id'>();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [openDialog, setOpenDialog] = useState<'delete'>(null);
  const [nest, setNest] = useState<Nest | null>(null);
  const [author, setAuthor] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');

  useEffect(() => {
    if (params.id) {
      getNest(Number(params.id))
        .then((nest) => {
          setNest(nest);
          setAuthor(nest.author);
          setName(nest.name);
          setDescription(nest.description || '');
        })
        .catch((msg) => {
          addToast(httpErrorToHuman(msg), 'error');
        });
    }
  }, [params.id]);

  const doCreateOrUpdate = () => {
    if (nest?.id) {
      updateNest(nest.id, {
        author,
        name,
        description,
      })
        .then(() => {
          addToast('Nest updated.', 'success');
        })
        .catch((msg) => {
          addToast(httpErrorToHuman(msg), 'error');
        });
    } else {
      createNest({
        author,
        name,
        description,
      })
        .then((nest) => {
          addToast('Nest created.', 'success');
          navigate(`/admin/nests/${nest.id}`);
        })
        .catch((msg) => {
          addToast(httpErrorToHuman(msg), 'error');
        });
    }
  };

  const doDelete = () => {
    deleteNest(nest.id)
      .then(() => {
        addToast('Nest deleted.', 'success');
        navigate('/admin/nests');
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  };

  return (
    <>
      <Dialog.Confirm
        open={openDialog === 'delete'}
        hideCloseIcon
        onClose={() => setOpenDialog(null)}
        title={'Confirm Nest Deletion'}
        confirm={'Delete'}
        onConfirmed={doDelete}
      >
        Are you sure you want to delete <Code>{nest?.name}</Code>?
      </Dialog.Confirm>

      <div className={'mb-4'}>
        <h1 className={'text-4xl font-bold text-white'}>{params.id ? 'Update' : 'Create'} Nest</h1>
      </div>
      <AdminSettingContainer title={'Nest Settings'}>
        <div className={'mt-4'}>
          <Input.Label htmlFor={'author'}>Author</Input.Label>
          <Input.Text id={'author'} placeholder={'Author'} value={author} onChange={(e) => setAuthor(e.target.value)} />
        </div>
        <div className={'mt-4'}>
          <Input.Label htmlFor={'name'}>Name</Input.Label>
          <Input.Text id={'name'} placeholder={'Name'} value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className={'mt-4'}>
          <Input.Label htmlFor={'description'}>Description</Input.Label>
          <Input.Text
            id={'description'}
            placeholder={'Description'}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className={classNames('mt-4 flex', nest ? 'justify-between' : 'justify-end')}>
          {nest && (
            <Button style={Button.Styles.Red} onClick={() => setOpenDialog('delete')}>
              Delete
            </Button>
          )}
          <Button onClick={doCreateOrUpdate}>Save</Button>
        </div>
      </AdminSettingContainer>
    </>
  );
};
