import { httpErrorToHuman } from '@/api/axios';
import { useToast } from '@/providers/ToastProvider';
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import Code from '@/elements/Code';
import { Group, Stack, Title } from '@mantine/core';
import TextInput from '@/elements/input/TextInput';
import Button from '@/elements/Button';
import { load } from '@/lib/debounce';
import ConfirmationModal from '@/elements/modals/ConfirmationModal';
import TextArea from '@/elements/input/TextArea';
import updateRole from '@/api/admin/roles/updateRole';
import createRole from '@/api/admin/roles/createRole';
import deleteRole from '@/api/admin/roles/deleteRole';
import getPermissions from '@/api/getPermissions';
import { useGlobalStore } from '@/stores/global';
import PermissionSelector from '@/elements/PermissionSelector';

export default ({ contextRole }: { contextRole?: Role }) => {
  const params = useParams<'id'>();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const { availablePermissions, setAvailablePermissions } = useGlobalStore();

  const [openModal, setOpenModal] = useState<'delete'>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<UpdateRole>({
    name: '',
    description: '',
    adminPermissions: new Set<string>([]),
    serverPermissions: new Set<string>([]),
  } as UpdateRole);

  useEffect(() => {
    if (contextRole) {
      setRole({
        name: contextRole.name,
        description: contextRole.description,
        adminPermissions: new Set(contextRole.adminPermissions ?? []),
        serverPermissions: new Set(contextRole.serverPermissions ?? []),
      });
    }
  }, [contextRole]);

  useEffect(() => {
    getPermissions().then((res) => {
      setAvailablePermissions(res);
      load(false, setLoading);
    });
  }, []);

  const doCreateOrUpdate = () => {
    load(true, setLoading);
    if (params?.id) {
      updateRole(params.id, role)
        .then(() => {
          addToast('Role updated.', 'success');
        })
        .catch((msg) => {
          addToast(httpErrorToHuman(msg), 'error');
        })
        .finally(() => {
          load(false, setLoading);
        });
    } else {
      createRole(role)
        .then((role) => {
          addToast('Role created.', 'success');
          navigate(`/admin/roles/${role.uuid}`);
        })
        .catch((msg) => {
          addToast(httpErrorToHuman(msg), 'error');
        })
        .finally(() => {
          load(false, setLoading);
        });
    }
  };

  const doDelete = async () => {
    load(true, setLoading);
    await deleteRole(params.id)
      .then(() => {
        addToast('Role deleted.', 'success');
        navigate('/admin/roles');
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
        title={'Confirm Role Deletion'}
        confirm={'Delete'}
        onConfirmed={doDelete}
      >
        Are you sure you want to delete <Code>{role?.name}</Code>?
      </ConfirmationModal>

      <Stack>
        <Title order={2}>{params.id ? 'Update' : 'Create'} Role</Title>

        <Group grow>
          <TextInput
            withAsterisk
            label={'Name'}
            placeholder={'Name'}
            value={role.name || ''}
            onChange={(e) => setRole({ ...role, name: e.target.value })}
          />
        </Group>

        <Group grow align={'start'}>
          <TextArea
            label={'Description'}
            placeholder={'Description'}
            value={role.description || ''}
            rows={3}
            onChange={(e) => setRole({ ...role, description: e.target.value || null })}
          />
        </Group>

        <Group grow align={'normal'}>
          <Stack>
            <Title order={3}>Server Permissions</Title>
            {availablePermissions?.serverPermissions && (
              <PermissionSelector
                permissions={availablePermissions.serverPermissions}
                selectedPermissions={role.serverPermissions}
                setSelectedPermissions={(permissions) => setRole({ ...role, serverPermissions: permissions })}
              />
            )}
          </Stack>
          <Stack>
            <Title order={3}>Admin Permissions</Title>
            {availablePermissions?.adminPermissions && (
              <PermissionSelector
                permissions={availablePermissions.adminPermissions}
                selectedPermissions={role.adminPermissions}
                setSelectedPermissions={(permissions) => setRole({ ...role, adminPermissions: permissions })}
              />
            )}
          </Stack>
        </Group>

        <Group>
          <Button onClick={doCreateOrUpdate} loading={loading}>
            Save
          </Button>
          {params.id && (
            <Button color={'red'} onClick={() => setOpenModal('delete')} loading={loading}>
              Delete
            </Button>
          )}
        </Group>
      </Stack>
    </>
  );
};
