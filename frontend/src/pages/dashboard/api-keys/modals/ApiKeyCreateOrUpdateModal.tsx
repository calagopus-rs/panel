import { Group, ModalProps, Stack, Title } from '@mantine/core';
import { useForm } from '@mantine/form';
import { zod4Resolver } from 'mantine-form-zod-resolver';
import { useEffect, useState } from 'react';
import { z } from 'zod';
import { httpErrorToHuman } from '@/api/axios';
import getPermissions from '@/api/getPermissions';
import createApiKey from '@/api/me/api-keys/createApiKey';
import updateApiKey from '@/api/me/api-keys/updateApiKey';
import Button from '@/elements/Button';
import TextInput from '@/elements/input/TextInput';
import Modal from '@/elements/modals/Modal';
import PermissionSelector from '@/elements/PermissionSelector';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/providers/ToastProvider';
import { useGlobalStore } from '@/stores/global';
import { useUserStore } from '@/stores/user';

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

        <Stack>
          <Title order={3}>User Permissions</Title>
          {availablePermissions?.userPermissions && (
            <PermissionSelector
              permissions={availablePermissions.userPermissions}
              selectedPermissions={form.values.userPermissions}
              setSelectedPermissions={(permissions) => form.setFieldValue('userPermissions', permissions)}
            />
          )}
        </Stack>
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
          {user.admin && availablePermissions?.adminPermissions && (
            <PermissionSelector
              permissions={availablePermissions.adminPermissions}
              selectedPermissions={form.values.adminPermissions}
              setSelectedPermissions={(permissions) => form.setFieldValue('adminPermissions', permissions)}
            />
          )}
        </Stack>

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
