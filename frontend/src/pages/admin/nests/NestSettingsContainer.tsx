import { httpErrorToHuman } from '@/api/axios';
import AdminSettingContainer from '@/elements/AdminSettingContainer';
import { Button } from '@/elements/button';
import { Input } from '@/elements/inputs';
import { useToast } from '@/providers/ToastProvider';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Dialog } from '@/elements/dialog';
import Code from '@/elements/Code';
import updateNest from '@/api/admin/nests/updateNest';
import deleteNest from '@/api/admin/nests/deleteNest';

export default ({ nest }: { nest: Nest }) => {
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [openDialog, setOpenDialog] = useState<'delete'>(null);

  const doUpdate = () => {
    updateNest(nest.id, nest)
      .then(() => {
        addToast('Nest updated.', 'success');
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      });
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
        Are you sure you want to delete <Code>{nest.name}</Code>?
      </Dialog.Confirm>

      <AdminSettingContainer title={'Nest Settings'}>
        <div className={'mt-4'}>
          <Input.Label htmlFor={'author'}>Author</Input.Label>
          <Input.Text
            id={'author'}
            placeholder={'Author'}
            value={nest.author}
            onChange={(e) => (nest.author = e.target.value)}
          />
        </div>
        <div className={'mt-4'}>
          <Input.Label htmlFor={'name'}>Name</Input.Label>
          <Input.Text
            id={'name'}
            placeholder={'Name'}
            value={nest.name}
            onChange={(e) => (nest.name = e.target.value)}
          />
        </div>
        <div className={'mt-4'}>
          <Input.Label htmlFor={'description'}>Description</Input.Label>
          <Input.Text
            id={'description'}
            placeholder={'Description'}
            value={nest.description || ''}
            onChange={(e) => (nest.description = e.target.value)}
          />
        </div>

        <div className={'mt-4 flex justify-between'}>
          <Button style={Button.Styles.Red} onClick={() => setOpenDialog('delete')}>
            Delete
          </Button>
          <Button onClick={doUpdate}>Save</Button>
        </div>
      </AdminSettingContainer>
    </>
  );
};
