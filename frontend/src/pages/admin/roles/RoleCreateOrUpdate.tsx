import { Group, Stack, Title } from '@mantine/core';
import { useForm } from '@mantine/form';
import { zod4Resolver } from 'mantine-form-zod-resolver';
import { useEffect, useState } from 'react';
import { z } from 'zod';
import createRole from '@/api/admin/roles/createRole.ts';
import deleteRole from '@/api/admin/roles/deleteRole.ts';
import updateRole from '@/api/admin/roles/updateRole.ts';
import getPermissions from '@/api/getPermissions.ts';
import Button from '@/elements/Button.tsx';
import Code from '@/elements/Code.tsx';
import TextArea from '@/elements/input/TextArea.tsx';
import TextInput from '@/elements/input/TextInput.tsx';
import ConfirmationModal from '@/elements/modals/ConfirmationModal.tsx';
import PermissionSelector from '@/elements/PermissionSelector.tsx';
import { adminRoleSchema } from '@/lib/schemas/admin/roles.ts';
import { useResourceForm } from '@/plugins/useResourceForm.ts';
import { useGlobalStore } from '@/stores/global.ts';

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
        name: contextRole.name,
        description: contextRole.description,
        adminPermissions: contextRole.adminPermissions,
        serverPermissions: contextRole.serverPermissions,
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

      <form onSubmit={form.onSubmit(() => doCreateOrUpdate(false))}>
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
            <Button type='submit' disabled={!form.isValid()} loading={loading}>
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
      </form>
    </>
  );
}
