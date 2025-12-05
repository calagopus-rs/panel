import { Group, Stack, Title } from '@mantine/core';
import { useForm } from '@mantine/form';
import { zod4Resolver } from 'mantine-form-zod-resolver';
import { useEffect, useState } from 'react';
import { z } from 'zod';
import createRole from '@/api/admin/roles/createRole';
import deleteRole from '@/api/admin/roles/deleteRole';
import updateRole from '@/api/admin/roles/updateRole';
import getPermissions from '@/api/getPermissions';
import Button from '@/elements/Button';
import Code from '@/elements/Code';
import TextArea from '@/elements/input/TextArea';
import TextInput from '@/elements/input/TextInput';
import ConfirmationModal from '@/elements/modals/ConfirmationModal';
import PermissionSelector from '@/elements/PermissionSelector';
import { adminRoleSchema } from '@/lib/schemas';
import { useResourceForm } from '@/plugins/useResourceForm';
import { useGlobalStore } from '@/stores/global';

export default function RoleCreateOrUpdate({ contextRole }: { contextRole?: Role }) {
  const { availablePermissions, setAvailablePermissions } = useGlobalStore();

  const [openModal, setOpenModal] = useState<'delete' | null>(null);

  const form = useForm<z.infer<typeof adminRoleSchema>>({
    initialValues: {
      name: '',
      description: null,
      adminPermissions: [],
      serverPermissions: [],
    },
    validateInputOnBlur: true,
    validate: zod4Resolver(adminRoleSchema),
  });

  const { loading, setLoading, doCreateOrUpdate, doDelete } = useResourceForm<z.infer<typeof adminRoleSchema>, Role>({
    form,
    createFn: () => createRole(form.values),
    updateFn: () => updateRole(contextRole!.uuid, form.values),
    deleteFn: () => deleteRole(contextRole!.uuid),
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
    setLoading(true);

    getPermissions().then((res) => {
      setAvailablePermissions(res);
      setLoading(false);
    });
  }, []);

  return (
    <>
      <ConfirmationModal
        opened={openModal === 'delete'}
        onClose={() => setOpenModal(null)}
        title='Confirm Role Deletion'
        confirm='Delete'
        onConfirmed={doDelete}
      >
        Are you sure you want to delete <Code>{form.values.name}</Code>?
      </ConfirmationModal>

      <Stack>
        <Title order={2}>{contextRole ? 'Update' : 'Create'} Role</Title>

        <Group grow>
          <TextInput withAsterisk label='Name' placeholder='Name' {...form.getInputProps('name')} />
        </Group>

        <Group grow align='start'>
          <TextArea label='Description' placeholder='Description' rows={3} {...form.getInputProps('description')} />
        </Group>

        <Group grow align='normal'>
          {availablePermissions?.serverPermissions && (
            <PermissionSelector
              label='Server Permissions'
              permissionsMapType='serverPermissions'
              permissions={availablePermissions.serverPermissions}
              selectedPermissions={form.values.serverPermissions}
              setSelectedPermissions={(permissions) => form.setFieldValue('serverPermissions', permissions)}
            />
          )}
          {availablePermissions?.adminPermissions && (
            <PermissionSelector
              label='Admin Permissions'
              permissionsMapType='adminPermissions'
              permissions={availablePermissions.adminPermissions}
              selectedPermissions={form.values.adminPermissions}
              setSelectedPermissions={(permissions) => form.setFieldValue('adminPermissions', permissions)}
            />
          )}
        </Group>

        <Group>
          <Button onClick={() => doCreateOrUpdate(false)} disabled={!form.isValid()} loading={loading}>
            Save
          </Button>
          {!contextRole && (
            <Button onClick={() => doCreateOrUpdate(true)} disabled={!form.isValid()} loading={loading}>
              Save & Stay
            </Button>
          )}
          {contextRole && (
            <Button color='red' onClick={() => setOpenModal('delete')} loading={loading}>
              Delete
            </Button>
          )}
        </Group>
      </Stack>
    </>
  );
}
