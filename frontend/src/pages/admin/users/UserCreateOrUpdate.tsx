import { Group, Stack, Title } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useEffect, useState } from 'react';
import { NIL as uuidNil } from 'uuid';
import getRoles from '@/api/admin/roles/getRoles';
import createUser from '@/api/admin/users/createUser';
import deleteUser from '@/api/admin/users/deleteUser';
import disableUserTwoFactor from '@/api/admin/users/disableUserTwoFactor';
import updateUser from '@/api/admin/users/updateUser';
import { httpErrorToHuman } from '@/api/axios';
import Button from '@/elements/Button';
import Code from '@/elements/Code';
import Select from '@/elements/input/Select';
import Switch from '@/elements/input/Switch';
import TextInput from '@/elements/input/TextInput';
import ConfirmationModal from '@/elements/modals/ConfirmationModal';
import { useResourceForm } from '@/plugins/useResourceForm';
import { useSearchableResource } from '@/plugins/useSearchableResource';
import { useToast } from '@/providers/ToastProvider';

export default function UserCreateOrUpdate({ contextUser }: { contextUser?: User }) {
  const { addToast } = useToast();

  const [openModal, setOpenModal] = useState<'delete' | 'disable_two_factor'>(null);

  const form = useForm<UpdateUser>({
    initialValues: {
      username: '',
      email: '',
      nameFirst: '',
      nameLast: '',
      password: null,
      admin: false,
      totpEnabled: false,
      roleUuid: uuidNil,
    },
  });

  const { loading, doCreateOrUpdate, doDelete } = useResourceForm<UpdateUser, User>({
    form,
    createFn: () => createUser(form.values),
    updateFn: () => updateUser(contextUser?.uuid, form.values),
    deleteFn: () => deleteUser(contextUser?.uuid),
    doUpdate: !!contextUser,
    basePath: '/admin/users',
    resourceName: 'User',
  });

  useEffect(() => {
    if (contextUser) {
      form.setValues({
        ...contextUser,
        roleUuid: contextUser.role?.uuid ?? uuidNil,
      });
    }
  }, [contextUser]);

  const roles = useSearchableResource<Role>({ fetcher: (search) => getRoles(1, search) });

  const doDisableTwoFactor = async () => {
    await disableUserTwoFactor(contextUser.uuid)
      .then(() => {
        addToast('User two factor disabled.', 'success');
        form.setFieldValue('totpEnabled', false);

        setOpenModal(null);
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
        title='Confirm User Deletion'
        confirm='Delete'
        onConfirmed={doDelete}
      >
        Are you sure you want to delete <Code>{form.values.username}</Code>?
      </ConfirmationModal>
      <ConfirmationModal
        opened={openModal === 'disable_two_factor'}
        onClose={() => setOpenModal(null)}
        title='Disable User Two Factor'
        confirm='Disable'
        onConfirmed={doDisableTwoFactor}
      >
        Are you sure you want to remove the two factor of <Code>{form.values.username}</Code>?
      </ConfirmationModal>

      <Stack>
        <Title order={2}>{contextUser ? 'Update' : 'Create'} User</Title>

        <Group grow>
          <TextInput withAsterisk label='Username' placeholder='Username' {...form.getInputProps('username')} />
          <TextInput withAsterisk label='Email' placeholder='Email' type='email' {...form.getInputProps('email')} />
        </Group>

        <Group grow>
          <TextInput withAsterisk label='First Name' placeholder='First Name' {...form.getInputProps('nameFirst')} />
          <TextInput withAsterisk label='Last Name' placeholder='Last Name' {...form.getInputProps('nameLast')} />
        </Group>

        <Group grow>
          <TextInput
            withAsterisk={!contextUser}
            label='Password'
            placeholder='Password'
            type='password'
            {...form.getInputProps('password')}
          />

          <Select
            label='Role'
            placeholder='Role'
            data={roles.items.map((nest) => ({
              label: nest.name,
              value: nest.uuid,
            }))}
            searchable
            searchValue={roles.search}
            onSearchChange={roles.setSearch}
            allowDeselect
            {...form.getInputProps('roleUuid')}
          />
        </Group>

        <Switch
          label='Admin'
          checked={form.values.admin}
          onChange={(e) => form.setFieldValue('admin', e.target.checked)}
        />
      </Stack>

      <Group mt='md'>
        <Button onClick={() => doCreateOrUpdate(false)} loading={loading}>
          Save
        </Button>
        {!contextUser && (
          <Button onClick={() => doCreateOrUpdate(true)} loading={loading}>
            Save & Stay
          </Button>
        )}
        {contextUser && (
          <>
            <Button
              color='red'
              variant='outline'
              onClick={() => setOpenModal('disable_two_factor')}
              loading={loading}
              disabled={!form.values.totpEnabled}
            >
              Disable Two Factor
            </Button>
            <Button color='red' onClick={() => setOpenModal('delete')} loading={loading}>
              Delete
            </Button>
          </>
        )}
      </Group>
    </>
  );
}
