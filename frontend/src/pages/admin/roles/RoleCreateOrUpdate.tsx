import { useEffect, useState } from 'react';
import Code from '@/elements/Code';
import { Group, Stack, Title } from '@mantine/core';
import TextInput from '@/elements/input/TextInput';
import Button from '@/elements/Button';
import ConfirmationModal from '@/elements/modals/ConfirmationModal';
import TextArea from '@/elements/input/TextArea';
import updateRole from '@/api/admin/roles/updateRole';
import createRole from '@/api/admin/roles/createRole';
import deleteRole from '@/api/admin/roles/deleteRole';
import { useGlobalStore } from '@/stores/global';
import PermissionSelector from '@/elements/PermissionSelector';
import { useForm } from '@mantine/form';
import { useResourceForm } from '@/plugins/useResourceForm';
import getPermissions from '@/api/getPermissions';
import { load } from '@/lib/debounce';

export default ({ contextRole }: { contextRole?: Role }) => {
  const { availablePermissions, setAvailablePermissions } = useGlobalStore();

  const [openModal, setOpenModal] = useState<'delete'>(null);

  const form = useForm<UpdateRole>({
    initialValues: {
      name: '',
      description: '',
      adminPermissions: [],
      serverPermissions: [],
    },
  });

  const { loading, setLoading, doCreateOrUpdate, doDelete } = useResourceForm<UpdateRole, Role>({
    form,
    createFn: () => createRole(form.values),
    updateFn: () => updateRole(contextRole?.uuid, form.values),
    deleteFn: () => deleteRole(contextRole?.uuid),
    doUpdate: !!contextRole,
    basePath: '/admin/roles',
    resourceName: 'Role',
  });

  useEffect(() => {
    if (contextRole) {
      form.setValues({
        ...contextRole,
      });
    }
  }, [contextRole]);

  useEffect(() => {
    load(true, setLoading);

    getPermissions().then((res) => {
      setAvailablePermissions(res);
      load(false, setLoading);
    });
  }, []);

  return (
    <>
      <ConfirmationModal
        opened={openModal === 'delete'}
        onClose={() => setOpenModal(null)}
        title={'Confirm Role Deletion'}
        confirm={'Delete'}
        onConfirmed={doDelete}
      >
        Are you sure you want to delete <Code>{form.values.name}</Code>?
      </ConfirmationModal>

      <Stack>
        <Title order={2} mb={'md'}>
          {contextRole ? 'Update' : 'Create'} Role
        </Title>

        <Group grow>
          <TextInput withAsterisk label={'Name'} placeholder={'Name'} {...form.getInputProps('name')} />
        </Group>

        <Group grow align={'start'}>
          <TextArea label={'Description'} placeholder={'Description'} rows={3} {...form.getInputProps('description')} />
        </Group>

        <Group grow align={'normal'}>
          <Stack>
            <Title order={3}>Server Permissions</Title>
            {availablePermissions?.serverPermissions && (
              <PermissionSelector
                permissions={availablePermissions.serverPermissions}
                selectedPermissions={form.values.serverPermissions}
                setSelectedPermissions={(permissions) => form.setFieldValue('serverPermissions', permissions)}
              />
            )}
          </Stack>
          <Stack>
            <Title order={3}>Admin Permissions</Title>
            {availablePermissions?.adminPermissions && (
              <PermissionSelector
                permissions={availablePermissions.adminPermissions}
                selectedPermissions={form.values.adminPermissions}
                setSelectedPermissions={(permissions) => form.setFieldValue('adminPermissions', permissions)}
              />
            )}
          </Stack>
        </Group>

        <Group>
          <Button onClick={() => doCreateOrUpdate(false)} loading={loading}>
            Save
          </Button>
          {!contextRole && (
            <Button onClick={() => doCreateOrUpdate(true)} loading={loading}>
              Save & Stay
            </Button>
          )}
          {contextRole && (
            <Button color={'red'} onClick={() => setOpenModal('delete')} loading={loading}>
              Delete
            </Button>
          )}
        </Group>
      </Stack>
    </>
  );
};
