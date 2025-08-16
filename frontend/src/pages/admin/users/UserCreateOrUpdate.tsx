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
import getUser from '@/api/admin/users/getUser';
import updateUser from '@/api/admin/users/updateUser';
import createUser from '@/api/admin/users/createUser';
import deleteUser from '@/api/admin/users/deleteUser';

export default () => {
  const params = useParams<'id'>();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [openDialog, setOpenDialog] = useState<'delete'>(null);
  const [user, setUser] = useState<User>({
    username: '',
    email: '',
    nameFirst: '',
    nameLast: '',
    password: '',
    admin: false,
  } as User);

  useEffect(() => {
    if (params.id) {
      getUser(params.id)
        .then((user) => {
          setUser(user);
        })
        .catch((msg) => {
          addToast(httpErrorToHuman(msg), 'error');
        });
    }
  }, [params.id]);

  const doCreateOrUpdate = () => {
    if (user?.uuid) {
      updateUser(user.uuid, user)
        .then(() => {
          addToast('User updated.', 'success');
        })
        .catch((msg) => {
          addToast(httpErrorToHuman(msg), 'error');
        });
    } else {
      createUser(user)
        .then((user) => {
          addToast('User created.', 'success');
          navigate(`/admin/users/${user.uuid}`);
        })
        .catch((msg) => {
          addToast(httpErrorToHuman(msg), 'error');
        });
    }
  };

  const doDelete = () => {
    deleteUser(user.uuid)
      .then(() => {
        addToast('User deleted.', 'success');
        navigate('/admin/users');
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
        title={'Confirm User Deletion'}
        confirm={'Delete'}
        onConfirmed={doDelete}
      >
        Are you sure you want to delete <Code>{user?.username}</Code>?
      </Dialog.Confirm>

      <div className={'mb-4'}>
        <h1 className={'text-4xl font-bold text-white'}>{params.id ? 'Update' : 'Create'} User</h1>
      </div>
      <AdminSettingContainer title={'User Settings'}>
        <div className={'mt-4'}>
          <Input.Label htmlFor={'username'}>Username</Input.Label>
          <Input.Text
            id={'username'}
            placeholder={'Username'}
            value={user.username || ''}
            onChange={(e) => setUser({ ...user, username: e.target.value })}
          />
        </div>
        <div className={'mt-4'}>
          <Input.Label htmlFor={'email'}>Email</Input.Label>
          <Input.Text
            id={'email'}
            placeholder={'Email'}
            type={'email'}
            value={user.email || ''}
            onChange={(e) => setUser({ ...user, email: e.target.value })}
          />
        </div>
        <div className={'mt-4'}>
          <Input.Label htmlFor={'nameFirst'}>First Name</Input.Label>
          <Input.Text
            id={'nameFirst'}
            placeholder={'First Name'}
            value={user.nameFirst || ''}
            onChange={(e) => setUser({ ...user, nameFirst: e.target.value })}
          />
        </div>
        <div className={'mt-4'}>
          <Input.Label htmlFor={'nameLast'}>Last Name</Input.Label>
          <Input.Text
            id={'nameLast'}
            placeholder={'Last Name'}
            value={user.nameLast || ''}
            onChange={(e) => setUser({ ...user, nameLast: e.target.value })}
          />
        </div>
        <div className={'mt-4'}>
          <Input.Label htmlFor={'password'}>Password</Input.Label>
          <Input.Text
            id={'password'}
            placeholder={'Password'}
            value={user.password || ''}
            onChange={(e) => setUser({ ...user, password: e.target.value })}
          />
        </div>
        <div className={'mt-4'}>
          <Input.Switch
            name={'admin'}
            label={'Admin'}
            checked={user.admin || false}
            onChange={(e) => setUser({ ...user, admin: e.target.checked })}
          />
        </div>

        <div className={classNames('mt-4 flex', params.id ? 'justify-between' : 'justify-end')}>
          {params.id && (
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
