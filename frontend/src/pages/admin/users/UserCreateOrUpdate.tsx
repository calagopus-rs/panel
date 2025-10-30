import { httpErrorToHuman } from '@/api/axios';
import { useToast } from '@/providers/ToastProvider';
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import Code from '@/elements/Code';
import updateUser from '@/api/admin/users/updateUser';
import createUser from '@/api/admin/users/createUser';
import deleteUser from '@/api/admin/users/deleteUser';
import { Group, Stack, Title } from '@mantine/core';
import Button from '@/elements/Button';
import { load } from '@/lib/debounce';
import TextInput from '@/elements/input/TextInput';
import Switch from '@/elements/input/Switch';
import ConfirmationModal from '@/elements/modals/ConfirmationModal';
import disableUserTwoFactor from '@/api/admin/users/disableUserTwoFactor';
import { useSearchableResource } from '@/plugins/useSearchableResource';
import getRoles from '@/api/admin/roles/getRoles';
import Select from '@/elements/input/Select';

export default ({ contextUser }: { contextUser?: User }) => {
  const params = useParams<'id'>();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [openModal, setOpenModal] = useState<'delete' | 'disable_two_factor'>(null);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<UpdateUser>({
    username: '',
    email: '',
    nameFirst: '',
    nameLast: '',
    password: '',
    admin: false,
    totpEnabled: false,
    roleUuid: '',
  } as UpdateUser);

  const roles = useSearchableResource<Role>({ fetcher: (search) => getRoles(1, search) });

  useEffect(() => {
    if (contextUser) {
      setUser({
        username: contextUser.username,
        email: contextUser.email,
        nameFirst: contextUser.nameFirst,
        nameLast: contextUser.nameLast,
        admin: contextUser.admin,
        totpEnabled: contextUser.totpEnabled,
        roleUuid: contextUser.role?.uuid ?? '',
      });
    }
  }, [contextUser]);

  const doCreateOrUpdate = () => {
    load(true, setLoading);
    if (params?.id) {
      updateUser(contextUser.uuid, user)
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

  const doDisableTwoFactor = async () => {
    await disableUserTwoFactor(params.id)
      .then(() => {
        addToast('User two factor disabled.', 'success');
        setUser({ ...user, totpEnabled: false });

        setOpenModal(null);
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  };

  const doDelete = async () => {
    await deleteUser(contextUser.uuid)
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
      <ConfirmationModal
        opened={openModal === 'delete'}
        onClose={() => setOpenModal(null)}
        title={'Confirm User Deletion'}
        confirm={'Delete'}
        onConfirmed={doDelete}
      >
        Are you sure you want to delete <Code>{user?.username}</Code>?
      </ConfirmationModal>
      <ConfirmationModal
        opened={openModal === 'disable_two_factor'}
        onClose={() => setOpenModal(null)}
        title={'Disable User Two Factor'}
        confirm={'Disable'}
        onConfirmed={doDisableTwoFactor}
      >
        Are you sure you want to remove the two factor of <Code>{user?.username}</Code>?
      </ConfirmationModal>

      <Title order={2}>{params.id ? 'Update' : 'Create'} User</Title>

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

        <Group grow>
          <TextInput
            withAsterisk={!params.id}
            label={'Password'}
            placeholder={'Password'}
            type={'password'}
            value={user.password || ''}
            onChange={(e) => setUser({ ...user, password: e.target.value || null })}
          />

          <Select
            withAsterisk
            label={'Role'}
            placeholder={'role'}
            value={user.roleUuid}
            onChange={(value) => setUser({ ...user, roleUuid: value })}
            data={roles.items.map((nest) => ({
              label: nest.name,
              value: nest.uuid,
            }))}
            searchable
            searchValue={roles.search}
            onSearchChange={roles.setSearch}
            allowDeselect
          />
        </Group>

        <Switch label={'Admin'} checked={user.admin} onChange={(e) => setUser({ ...user, admin: e.target.checked })} />
      </Stack>

      <Group mt={'md'}>
        <Button onClick={doCreateOrUpdate} loading={loading}>
          Save
        </Button>
        {params.id && (
          <Button
            color={'red'}
            variant={'outline'}
            onClick={() => setOpenModal('disable_two_factor')}
            loading={loading}
            disabled={!user.totpEnabled}
          >
            Disable Two Factor
          </Button>
        )}
        {params.id && (
          <Button color={'red'} onClick={() => setOpenModal('delete')} loading={loading}>
            Delete
          </Button>
        )}
      </Group>
    </>
  );
};
