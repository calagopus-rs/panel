import { Group, ModalProps, Stack } from '@mantine/core';
import { useForm } from '@mantine/form';
import { zod4Resolver } from 'mantine-form-zod-resolver';
import { useEffect, useState } from 'react';
import { z } from 'zod';
import { httpErrorToHuman } from '@/api/axios.ts';
import getPermissions from '@/api/getPermissions.ts';
import createApiKey from '@/api/me/api-keys/createApiKey.ts';
import updateApiKey from '@/api/me/api-keys/updateApiKey.ts';
import Button from '@/elements/Button.tsx';
import TextInput from '@/elements/input/TextInput.tsx';
import Modal from '@/elements/modals/Modal.tsx';
import PermissionSelector from '@/elements/PermissionSelector.tsx';
import { useAuth } from '@/providers/AuthProvider.tsx';
import { useToast } from '@/providers/ToastProvider.tsx';
import { useGlobalStore } from '@/stores/global.ts';
import { useUserStore } from '@/stores/user.ts';

const schema = z.object({
  name: z.string().min(3).max(31),
  userPermissions: z.array(z.string()),
  serverPermissions: z.array(z.string()),
  adminPermissions: z.array(z.string()),
});

type Props = ModalProps & {
  contextApiKey?: UserApiKey;
};

export default function ApiKeyCreateOrUpdateModal({ contextApiKey, opened, onClose }: Props) {
  const { addToast } = useToast();
  const { addApiKey, updateApiKey: updateStateApiKey } = useUserStore();
  const { availablePermissions, setAvailablePermissions } = useGlobalStore();
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const form = useForm<z.infer<typeof schema>>({
    initialValues: {
      name: '',
      userPermissions: [],
      serverPermissions: [],
      adminPermissions: [],
    },
    validateInputOnBlur: true,
    validate: zod4Resolver(schema),
  });

  useEffect(() => {
    if (contextApiKey) {
      form.setValues({
        name: contextApiKey.name,
        userPermissions: contextApiKey.userPermissions,
        serverPermissions: contextApiKey.serverPermissions,
        adminPermissions: contextApiKey.adminPermissions,
      });
    }
  }, [contextApiKey]);

  useEffect(() => {
    getPermissions().then((res) => {
      setAvailablePermissions(res);
      setLoading(false);
    });
  }, []);

  const doCreateOrUpdate = () => {
    setLoading(true);

    if (contextApiKey) {
      updateApiKey(contextApiKey.uuid, form.values)
        .then(() => {
          addToast('API key updated.', 'success');
          onClose();
          updateStateApiKey(contextApiKey.uuid, form.values);
        })
        .catch((msg) => {
          addToast(httpErrorToHuman(msg), 'error');
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      createApiKey(form.values)
        .then((key) => {
          addToast('API key created.', 'success');
          onClose();
          addApiKey({ ...key.apiKey, keyStart: key.key });
        })
        .catch((msg) => {
          addToast(httpErrorToHuman(msg), 'error');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  };

  return (
    <Modal title={`${contextApiKey ? 'Update' : 'Create'} API Key`} onClose={onClose} opened={opened} size='xl'>
      <Stack>
        <TextInput withAsterisk label='Name' placeholder='Name' {...form.getInputProps('name')} />

        {availablePermissions?.userPermissions && (
          <PermissionSelector
            label='User Permissions'
            permissionsMapType='userPermissions'
            permissions={availablePermissions.userPermissions}
            selectedPermissions={form.values.userPermissions}
            setSelectedPermissions={(permissions) => form.setFieldValue('userPermissions', permissions)}
          />
        )}
        {availablePermissions?.serverPermissions && (
          <PermissionSelector
            label='Server Permissions'
            permissionsMapType='serverPermissions'
            permissions={availablePermissions.serverPermissions}
            selectedPermissions={form.values.serverPermissions}
            setSelectedPermissions={(permissions) => form.setFieldValue('serverPermissions', permissions)}
          />
        )}
        {user!.admin && availablePermissions?.adminPermissions && (
          <PermissionSelector
            label='Admin Permissions'
            permissionsMapType='adminPermissions'
            permissions={availablePermissions.adminPermissions}
            selectedPermissions={form.values.adminPermissions}
            setSelectedPermissions={(permissions) => form.setFieldValue('adminPermissions', permissions)}
          />
        )}

        <Group mt='md'>
          <Button onClick={doCreateOrUpdate} loading={loading} disabled={!form.isValid()}>
            Save
          </Button>
          <Button variant='default' onClick={onClose}>
            Close
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
