import { httpErrorToHuman } from '@/api/axios';
import { useToast } from '@/providers/ToastProvider';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import Code from '@/elements/Code';
import getUser from '@/api/admin/users/getUser';
import updateUser from '@/api/admin/users/updateUser';
import createUser from '@/api/admin/users/createUser';
import deleteUser from '@/api/admin/users/deleteUser';
import { Divider, Group, Stack, Title } from '@mantine/core';
import Button from '@/elements/Button';
import { load } from '@/lib/debounce';
import TextInput from '@/elements/input/TextInput';
import Switch from '@/elements/input/Switch';
import ConfirmationModal from '@/elements/modals/ConfirmationModal';

export default () => {
  const params = useParams<'id'>();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [openModal, setOpenModal] = useState<'delete'>(null);
  const [loading, setLoading] = useState(false);
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
    load(true, setLoading);
    if (user?.uuid) {
      updateUser(user.uuid, user)
        .then(() => {
          addToast('User updated.', 'success');
        })
        .catch((msg) => {
          addToast(httpErrorToHuman(msg), 'error');
        })
        .finally(() => {
          load(false, setLoading);
        });
    } else {
      createUser(user)
        .then((user) => {
          addToast('User created.', 'success');
          navigate(`/admin/users/${user.uuid}`);
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
    deleteUser(user.uuid)
      .then(() => {
        addToast('User deleted.', 'success');
        navigate('/admin/users');
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
        title={'Confirm User Deletion'}
        confirm={'Delete'}
        onConfirmed={doDelete}
      >
        Are you sure you want to delete <Code>{user?.username}</Code>?
      </ConfirmationModal>

      <Title order={1}>{params.id ? 'Update' : 'Create'} User</Title>
      <Divider />

      <Stack>
        <Group grow>
          <TextInput
            withAsterisk
            label={'Username'}
            placeholder={'Username'}
            value={user.username || ''}
            onChange={(e) => setUser({ ...user, username: e.target.value })}
          />
          <TextInput
            withAsterisk
            label={'Email'}
            placeholder={'Email'}
            type={'email'}
            value={user.email || ''}
            onChange={(e) => setUser({ ...user, email: e.target.value })}
          />
        </Group>

        <Group grow>
          <TextInput
            withAsterisk
            label={'First Name'}
            placeholder={'First Name'}
            value={user.nameFirst || ''}
            onChange={(e) => setUser({ ...user, nameFirst: e.target.value })}
          />
          <TextInput
            withAsterisk
            label={'Last Name'}
            placeholder={'Last Name'}
            value={user.nameLast || ''}
            onChange={(e) => setUser({ ...user, nameLast: e.target.value })}
          />
        </Group>

        <TextInput
          withAsterisk={!params.id}
          label={'Password'}
          placeholder={'Password'}
          type={'password'}
          value={user.password || ''}
          onChange={(e) => setUser({ ...user, password: e.target.value })}
        />

        <Switch label={'Admin'} checked={user.admin} onChange={(e) => setUser({ ...user, admin: e.target.checked })} />
      </Stack>

      <Group mt={'md'}>
        <Button onClick={doCreateOrUpdate} loading={loading}>
          Save
        </Button>
        {params.id && (
          <Button color={'red'} onClick={() => setOpenModal('delete')} loading={loading}>
            Delete
          </Button>
        )}
      </Group>
    </>
  );
};
